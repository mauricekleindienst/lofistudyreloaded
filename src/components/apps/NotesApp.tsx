"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Calendar,
  Filter,
  Grid,
  List,
  StickyNote,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  ListOrdered,
  List as ListIcon,
  ChevronLeft,
  Pin,
  PinOff,
  Download,
  Copy,
  ListChecks,
  Check,
} from 'lucide-react';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { useAppState } from '../../contexts/AppStateContext';
import { toast } from '../../lib/api';
import { renderMarkdown, stripMarkdown, toggleTask, countWords } from '../../lib/markdown';
import type { Note } from '../../lib/database';
import styles from '../../../styles/NotesApp.module.css';


const DRAFT_KEY = 'lofi:notes:draft';

export default function NotesApp() {
  const { updateNotesState } = useAppState();
  const { db, isAuthenticated, authLoading } = useDataPersistence();

  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    updateNotesState({ totalCount: notes.length });
  }, [notes.length, updateNotesState]);

  // Load notes on mount and whenever the user signs in or out
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setIsLoading(true);
    setSelectedNote(null);
    setIsEditing(false);
    setIsCreating(false);
    db.getNotes().then((items) => {
      if (cancelled) return;
      setNotes(items);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [db, isAuthenticated, authLoading]);

  // Filter and sort notes
  useEffect(() => {
    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort notes
    const sorted = [...filtered].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
      }
    });

    setFilteredNotes(sorted);
  }, [notes, searchQuery, sortBy]);

  // Handle creating a new note (an unsaved draft from last time is restored)
  const handleCreateNote = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedNote(null);
    let draft: { title?: string; content?: string } | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch {
      // ignore
    }
    setEditTitle(draft?.title ?? '');
    setEditContent(draft?.content ?? '');
    if (draft?.title || draft?.content) toast('Restored your unsaved draft.', 'info');
  };

  // New notes: keep a local draft so a closed window doesn't lose text.
  useEffect(() => {
    if (!isCreating) return;
    try {
      if (editTitle || editContent) localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: editTitle, content: editContent }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, [isCreating, editTitle, editContent]);

  // Existing notes: save automatically a moment after typing stops.
  const autosaveTimer = useRef<number | null>(null);
  /** edit waiting for the autosave timer; flushed if the window or page closes first */
  const pending = useRef<{ id: string; title: string; content: string } | null>(null);
  useEffect(() => {
    if (!isEditing || isCreating || !selectedNote) return;
    const title = editTitle.trim();
    if (!title || (title === selectedNote.title && editContent === selectedNote.content)) return;
    const change = { id: selectedNote.id, title, content: editContent };
    pending.current = change;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      pending.current = null;
      setAutoSaved('saving');
      const updated = await db.updateNote(change.id, { title: change.title, content: change.content });
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        // The user may have moved on to another note while this was saving.
        setSelectedNote((current) => (current?.id === updated.id ? updated : current));
        setAutoSaved('saved');
      } else setAutoSaved('idle');
    }, 1200);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [isEditing, isCreating, selectedNote, editTitle, editContent, db]);

  useEffect(() => {
    const flush = () => {
      const change = pending.current;
      if (!change) return;
      pending.current = null;
      db.updateNote(change.id, { title: change.title, content: change.content });
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [db]);

  /**
   * Leaving the editor never throws work away: an existing note is saved right now,
   * a new one stays as the local draft that "New note" restores.
   */
  const keepEdits = () => {
    if (!hasUnsavedEdits()) return;
    if (isCreating) {
      toast('Your new note is kept as a draft — press “New Note” to continue.', 'info');
      return;
    }
    const title = editTitle.trim();
    if (!selectedNote || !title) return;
    pending.current = null;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    const id = selectedNote.id;
    db.updateNote(id, { title, content: editContent }).then((updated) => {
      if (updated) setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    });
  };

  /** Edits that would be lost by leaving the editor now. */
  const hasUnsavedEdits = () =>
    isEditing &&
    (isCreating
      ? Boolean(editTitle.trim() || editContent.trim())
      : editTitle.trim() !== (selectedNote?.title ?? '') || editContent !== (selectedNote?.content ?? ''));

  const togglePin = async (note: Note) => {
    const pinned = !note.pinned;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, pinned } : n)));
    if (selectedNote?.id === note.id) setSelectedNote({ ...selectedNote, pinned });
    const updated = await db.updateNote(note.id, { pinned });
    if (!updated) setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
  };

  const copyNote = async (note: Note) => {
    try {
      await navigator.clipboard.writeText(`# ${note.title}\n\n${note.content}`);
      toast('Note copied to the clipboard.', 'success');
    } catch {
      toast('Copying is blocked in this browser.', 'warning');
    }
  };

  const downloadNote = (note: Note) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}\n`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'note'}.md`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Ticking a checklist item while reading saves the note right away.
  const onContentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const box = (e.target as HTMLElement).closest<HTMLInputElement>('input[data-line]');
    if (!box || !selectedNote) return;
    e.preventDefault();
    const content = toggleTask(selectedNote.content, Number(box.dataset.line));
    const optimistic = { ...selectedNote, content };
    setSelectedNote(optimistic);
    setNotes((prev) => prev.map((n) => (n.id === optimistic.id ? optimistic : n)));
    const updated = await db.updateNote(selectedNote.id, { content });
    if (!updated) {
      setSelectedNote(selectedNote);
      setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? selectedNote : n)));
    }
  };

  // Handle saving a note
  const handleSaveNote = async () => {
    if (!editTitle.trim()) {
      toast('Please enter a title for your note.', 'warning');
      return;
    }
    if (isSaving) return;

    const noteData = { title: editTitle.trim(), content: editContent };
    setIsSaving(true);
    try {
      if (isCreating) {
        const created = await db.saveNote(noteData);
        if (!created) return;
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        setNotes(prev => [created, ...prev]);
        setSelectedNote(created);
      } else if (selectedNote) {
        const updated = await db.updateNote(selectedNote.id, noteData);
        if (!updated) return;
        setNotes(prev => prev.map(note => (note.id === updated.id ? updated : note)));
        setSelectedNote(updated);
      }
      setIsCreating(false);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    const ok = await db.deleteNote(noteToDelete.id);
    if (ok) {
      setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  // Handle selecting a note
  const handleSelectNote = (note: Note) => {
    keepEdits();

    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
    setIsCreating(false);
  };

  // Handle editing
  const handleEditNote = () => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setAutoSaved('idle');
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (isCreating) {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      setSelectedNote(null);
      setIsCreating(false);
    } else if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
    setIsEditing(false);
  };

  // Format date relative to today's calendar day
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPreview = (content: string): string => stripMarkdown(content);

  // Text formatting functions
  const insertTextAtCursor = (text: string, wrapText?: string) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    let newText;
    if (wrapText) {
      // For wrapping formats like bold, italic, etc.
      newText = `${text}${selectedText || wrapText}${text}`;
    } else {
      // For insertions like headers, lists, etc.
      newText = selectedText ? `${text}${selectedText}` : text;
    }

    const newContent = editContent.substring(0, start) + newText + editContent.substring(end);
    setEditContent(newContent);

    // Set cursor position
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + newText.length;
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.focus();
      }
    }, 0);
  };

  const formatBold = () => insertTextAtCursor('**', 'bold text');
  const formatItalic = () => insertTextAtCursor('*', 'italic text');
  const formatUnderline = () => insertTextAtCursor('__', 'underlined text');
  const formatStrikethrough = () => insertTextAtCursor('~~', 'strikethrough text');
  const formatCode = () => insertTextAtCursor('`', 'code');
  const formatQuote = () => insertTextAtCursor('> ');
  const formatH1 = () => insertTextAtCursor('# ');
  const formatH2 = () => insertTextAtCursor('## ');
  const formatH3 = () => insertTextAtCursor('### ');
  const formatOrderedList = () => insertTextAtCursor('1. ');
  const formatUnorderedList = () => insertTextAtCursor('- ');
  const formatChecklist = () => insertTextAtCursor('- [ ] ');

  const insertLine = () => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const newContent = editContent.substring(0, start) + '\n---\n' + editContent.substring(start);
    setEditContent(newContent);
    
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + 5;
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.focus();
      }
    }, 0);
  };

  const renderFormattedContent = renderMarkdown;

  const isEmpty = filteredNotes.length === 0 && !isLoading;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.appTitle}>
            <StickyNote size={20} />
            <h2>Notes</h2>
            <span className={styles.noteCount}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.viewControls}>
            <button
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>

          <button 
            className={styles.newNoteButton}
            onClick={handleCreateNote}
            title="Create new note"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.sortContainer}>
          <Filter size={14} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
            className={styles.sortSelect}
          >
            <option value="updated">Last Modified</option>
            <option value="created">Date Created</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${styles.mainContent} ${selectedNote || isCreating ? styles.hasSelection : ''}`}>
        {/* Notes List */}
        <div className={`${styles.notesList} ${viewMode === 'grid' ? styles.gridView : styles.listView}`}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading notes...</p>
            </div>
          ) : isEmpty ? (
            <div className={styles.emptyState}>
              <FileText size={48} />
              <h3>No notes yet</h3>
              <p>Create your first note to get started</p>
              <button onClick={handleCreateNote} className={styles.emptyStateButton}>
                <Plus size={16} />
                Create Note
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`${styles.noteCard} ${selectedNote?.id === note.id ? styles.selected : ''}`}
                onClick={() => handleSelectNote(note)}
                role="button"
                tabIndex={0}
                aria-label={`Open note ${note.title}`}
                aria-current={selectedNote?.id === note.id}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                  e.preventDefault();
                  handleSelectNote(note);
                }}
              >
                <div className={styles.noteHeader}>
                  <h3 className={styles.noteTitle}>
                    {note.pinned && <Pin size={12} className={styles.pinMark} aria-label="Pinned" />}
                    {note.title}
                  </h3>
                  <div className={styles.noteActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(note);
                      }}
                      className={styles.deleteButton}
                      title={note.pinned ? 'Unpin' : 'Pin to top'}
                      aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                      {note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note);
                      }}
                      className={styles.deleteButton}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {note.content && (
                  <p className={styles.notePreview}>
                    {getPreview(note.content)}
                  </p>
                )}
                
                <div className={styles.noteFooter}>
                  <span className={styles.noteDate}>
                    <Calendar size={12} />
                    {formatDate(note.updated_at || note.created_at)}
                  </span>
                  {!isAuthenticated && (
                    <span className={styles.localIndicator}>Local</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Editor */}
        {(selectedNote || isCreating) && (
          <div className={styles.noteEditor}>
            <div className={styles.editorHeader}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => {
                  keepEdits();
                  setIsEditing(false);
                  setIsCreating(false);
                  setSelectedNote(null);
                }}
                aria-label="Back to all notes"
              >
                <ChevronLeft size={18} />
              </button>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className={styles.titleInput}
                    autoFocus
                  />
                  <div className={styles.editorActions}>
                    <button
                      onClick={handleSaveNote}
                      className={styles.saveButton}
                      title="Save note"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={styles.cancelButton}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.editorTitle}>{selectedNote?.title}</h2>
                  <div className={styles.editorActions}>
                    <button
                      onClick={() => selectedNote && togglePin(selectedNote)}
                      className={styles.cancelButton}
                      title={selectedNote?.pinned ? 'Unpin' : 'Pin to top'}
                      aria-label={selectedNote?.pinned ? 'Unpin note' : 'Pin note'}
                      aria-pressed={Boolean(selectedNote?.pinned)}
                    >
                      {selectedNote?.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button
                      onClick={() => selectedNote && copyNote(selectedNote)}
                      className={styles.cancelButton}
                      title="Copy as Markdown"
                      aria-label="Copy note"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => selectedNote && downloadNote(selectedNote)}
                      className={styles.cancelButton}
                      title="Download as .md"
                      aria-label="Download note"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={handleEditNote}
                      className={styles.editButton}
                      title="Edit note"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNote(selectedNote!)}
                      className={styles.deleteButton}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={styles.editorContent}>
              {isEditing ? (
                <>
                  {/* Formatting Toolbar */}
                  <div className={styles.formattingToolbar}>
                    <div className={styles.toolbarGroup}>
                      <button
                        type="button"
                        onClick={formatBold}
                        className={styles.toolbarButton}
                        title="Bold (Ctrl+B)"
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatItalic}
                        className={styles.toolbarButton}
                        title="Italic (Ctrl+I)"
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatUnderline}
                        className={styles.toolbarButton}
                        title="Underline (Ctrl+U)"
                      >
                        <Underline size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatStrikethrough}
                        className={styles.toolbarButton}
                        title="Strikethrough"
                      >
                        <Strikethrough size={16} />
                      </button>
                    </div>

                    <div className={styles.toolbarSeparator}></div>

                    <div className={styles.toolbarGroup}>
                      <button
                        type="button"
                        onClick={formatH1}
                        className={styles.toolbarButton}
                        title="Heading 1"
                      >
                        <Heading1 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatH2}
                        className={styles.toolbarButton}
                        title="Heading 2"
                      >
                        <Heading2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatH3}
                        className={styles.toolbarButton}
                        title="Heading 3"
                      >
                        <Heading3 size={16} />
                      </button>
                    </div>

                    <div className={styles.toolbarSeparator}></div>

                    <div className={styles.toolbarGroup}>
                      <button
                        type="button"
                        onClick={formatQuote}
                        className={styles.toolbarButton}
                        title="Quote"
                      >
                        <Quote size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatCode}
                        className={styles.toolbarButton}
                        title="Code"
                      >
                        <Code size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={insertLine}
                        className={styles.toolbarButton}
                        title="Horizontal Line"
                      >
                        <div className={styles.lineIcon}></div>
                      </button>
                    </div>

                    <div className={styles.toolbarSeparator}></div>

                    <div className={styles.toolbarGroup}>
                      <button
                        type="button"
                        onClick={formatUnorderedList}
                        className={styles.toolbarButton}
                        title="Bullet List"
                      >
                        <ListIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatOrderedList}
                        className={styles.toolbarButton}
                        title="Numbered List"
                      >
                        <ListOrdered size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={formatChecklist}
                        className={styles.toolbarButton}
                        title="Checklist"
                      >
                        <ListChecks size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Text Editor */}
                  <textarea
                    ref={setTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing your note..."
                    className={styles.contentTextarea}
                    onKeyDown={(e) => {
                      // Keyboard shortcuts
                      if (e.ctrlKey || e.metaKey) {
                        switch (e.key) {
                          case 'b':
                            e.preventDefault();
                            formatBold();
                            break;
                          case 'i':
                            e.preventDefault();
                            formatItalic();
                            break;
                          case 'u':
                            e.preventDefault();
                            formatUnderline();
                            break;
                          case 's':
                            e.preventDefault();
                            handleSaveNote();
                            break;
                        }
                      }
                    }}
                  />
                </>
              ) : (
                <div className={styles.contentDisplay}>
                  {selectedNote?.content ? (
                    <div
                      className={styles.contentFormatted}
                      onClick={onContentClick}
                      dangerouslySetInnerHTML={{ 
                        __html: renderFormattedContent(selectedNote.content) 
                      }}
                    />
                  ) : (
                    <p className={styles.emptyContent}>This note is empty. Click Edit to add content.</p>
                  )}
                </div>
              )}
            </div>

            {selectedNote && !isEditing && (
              <div className={styles.editorFooter}>
                <div className={styles.noteMetadata}>
                  <span>
                    Created: {formatDate(selectedNote.created_at)}
                  </span>
                  {selectedNote.updated_at !== selectedNote.created_at && (
                    <span>
                      Modified: {formatDate(selectedNote.updated_at)}
                    </span>
                  )}
                  <span>
                    {countWords(selectedNote.content)} words · {Math.max(1, Math.round(countWords(selectedNote.content) / 220))} min read
                  </span>
                </div>
              </div>
            )}
            {isEditing && (
              <div className={styles.editorFooter}>
                <div className={styles.noteMetadata}>
                  <span>{countWords(editContent)} words</span>
                  {!isCreating && (
                    <span className={styles.autosave} aria-live="polite">
                      {autoSaved === 'saving' ? 'Saving…' : autoSaved === 'saved' ? (
                        <>
                          <Check size={12} /> Saved
                        </>
                      ) : 'Autosave on'}
                    </span>
                  )}
                  {isCreating && <span>Draft kept on this device until you save</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && noteToDelete && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <h3>Delete Note</h3>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalTitle}>
                &quot;{noteToDelete.title.length > 40 
                  ? noteToDelete.title.substring(0, 40) + '...' 
                  : noteToDelete.title}&quot;
              </p>
              <p className={styles.modalDescription}>
                This action cannot be undone. Your note will be permanently removed from{' '}
                <strong>{isAuthenticated ? 'your account' : 'local storage'}</strong>.
              </p>
              <p className={styles.modalWarning}>
                Are you absolutely sure you want to continue?
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteButton}
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
