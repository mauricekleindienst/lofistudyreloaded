"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  LogIn
} from 'lucide-react';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { useAppState } from '../../contexts/AppStateContext';
import { Note } from '../../lib/database';
import styles from '../../../styles/NotesApp.module.css';

interface LocalNote extends Omit<Note, 'id'> {
  id: string;
  isLocal?: boolean;
}

export default function NotesApp() {
  const { updateNotesState } = useAppState();
  const { 
    loadNotes, 
    saveNote, 
    updateNote, 
    deleteNote, 
    isAuthenticated 
  } = useDataPersistence();

  // State management
  const [notes, setNotes] = useState<(Note | LocalNote)[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<(Note | LocalNote)[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | LocalNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | LocalNote | null>(null);

  // Update app state context with notes count
  useEffect(() => {
    updateNotesState({ totalCount: notes.length });
  }, [notes.length, updateNotesState]);

  // Load notes on mount and when authentication changes
  const loadNotesData = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from localStorage for unauthenticated users
      const localNotes = localStorage.getItem('lofi-notes');
      if (localNotes) {
        const parsed = JSON.parse(localNotes);
        setNotes(parsed);
      }
      return;
    }

    setIsLoading(true);
    try {
      const fetchedNotes = await loadNotes();
      setNotes(fetchedNotes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadNotes]);

  useEffect(() => {
    loadNotesData();
  }, [loadNotesData]);

  // Save to localStorage for unauthenticated users
  const saveToLocal = useCallback((updatedNotes: (Note | LocalNote)[]) => {
    if (!isAuthenticated) {
      localStorage.setItem('lofi-notes', JSON.stringify(updatedNotes));
    }
  }, [isAuthenticated]);

  // Filter and sort notes
  useEffect(() => {
    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort notes
    const sorted = [...filtered].sort((a, b) => {
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

  // Handle creating a new note
  const handleCreateNote = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
  };

  // Handle saving a note
  const handleSaveNote = async () => {
    if (!editTitle.trim()) {
      alert('Please enter a title for your note.');
      return;
    }

    const noteData = {
      title: editTitle.trim(),
      content: editContent.trim(),
      updated_at: new Date().toISOString()
    };

    if (isCreating) {
      // Creating new note
      if (isAuthenticated) {
        try {
          const newNote = await saveNote({
            ...noteData,
            created_at: new Date().toISOString()
          });
          if (newNote) {
            setNotes(prev => [newNote, ...prev]);
            setSelectedNote(newNote);
          }
        } catch (error) {
          console.error('Failed to save note:', error);
          alert('Failed to save note. Please try again.');
          return;
        }
      } else {
        // Local storage for unauthenticated users
        const newLocalNote: LocalNote = {
          id: Date.now().toString(),
          ...noteData,
          created_at: new Date().toISOString(),
          isLocal: true
        };
        const updatedNotes = [newLocalNote, ...notes];
        setNotes(updatedNotes);
        saveToLocal(updatedNotes);
        setSelectedNote(newLocalNote);
      }
    } else if (selectedNote) {
      // Updating existing note
      if (isAuthenticated && typeof selectedNote.id === 'number') {
        try {
          const updatedNote = await updateNote(selectedNote.id, noteData);
          if (updatedNote) {
            setNotes(prev => prev.map(note => 
              note.id === selectedNote.id ? updatedNote : note
            ));
            setSelectedNote(updatedNote);
          }
        } catch (error) {
          console.error('Failed to update note:', error);
          alert('Failed to update note. Please try again.');
          return;
        }
      } else {
        // Update local note
        const updatedNote = { ...selectedNote, ...noteData };
        const updatedNotes = notes.map(note => 
          note.id === selectedNote.id ? updatedNote : note
        );
        setNotes(updatedNotes);
        saveToLocal(updatedNotes);
        setSelectedNote(updatedNote);
      }
    }

    setIsCreating(false);
    setIsEditing(false);
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteToDelete: Note | LocalNote) => {
    setNoteToDelete(noteToDelete);
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!noteToDelete) return;

    if (isAuthenticated && typeof noteToDelete.id === 'number') {
      try {
        const success = await deleteNote(noteToDelete.id);
        if (success) {
          setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
          if (selectedNote?.id === noteToDelete.id) {
            setSelectedNote(null);
            setIsEditing(false);
          }
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
      }
    } else {
      // Delete local note
      const updatedNotes = notes.filter(note => note.id !== noteToDelete.id);
      setNotes(updatedNotes);
      saveToLocal(updatedNotes);
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
  const handleSelectNote = (note: Note | LocalNote) => {
    if (isEditing && (editTitle !== selectedNote?.title || editContent !== selectedNote?.content)) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }

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
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (isCreating) {
      setSelectedNote(null);
      setIsCreating(false);
    } else if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
    setIsEditing(false);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  // Get note preview
  const getPreview = (content: string): string => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

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
  const formatUnderline = () => insertTextAtCursor('<u>', '</u>');
  const formatStrikethrough = () => insertTextAtCursor('~~', 'strikethrough text');
  const formatCode = () => insertTextAtCursor('`', 'code');
  const formatQuote = () => insertTextAtCursor('> ');
  const formatH1 = () => insertTextAtCursor('# ');
  const formatH2 = () => insertTextAtCursor('## ');
  const formatH3 = () => insertTextAtCursor('### ');
  const formatOrderedList = () => insertTextAtCursor('1. ');
  const formatUnorderedList = () => insertTextAtCursor('- ');

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

  // Render markdown-like content for display
  const renderFormattedContent = (content: string) => {
    if (!content) return '';
    
    // Simple markdown-like rendering
    let rendered = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Quote
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      // Horizontal line
      .replace(/^---$/gm, '<hr>')
      // Lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap consecutive li elements in ul/ol
    rendered = rendered.replace(/(<li>.*<\/li>)/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    return rendered;
  };

  const isEmpty = filteredNotes.length === 0 && !isLoading;

  // If user is not authenticated, show sign-in message
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.signInContainer}>
          <LogIn size={48} className={styles.signInIcon} />
          <h2>Sign in to use Notes</h2>
          <p>Please sign in to create and manage your notes.</p>
        </div>
      </div>
    );
  }

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
      <div className={styles.mainContent}>
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
              >
                <div className={styles.noteHeader}>
                  <h3 className={styles.noteTitle}>{note.title}</h3>
                  <div className={styles.noteActions}>
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
