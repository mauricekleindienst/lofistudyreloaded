"use client";
import { useState, useEffect } from 'react';
import { 
  Plus,
  Save,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react';
import styles from '../../../styles/NotesApp.module.css';
import { useDataPersistence } from '../../hooks/useDataPersistence';

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
}

const NotesApp: React.FC = () => {
  const { 
    isAuthenticated, 
    loadNotes, 
    saveNote: saveNoteToDb, 
    updateNote: updateNoteInDb, 
    deleteNote: deleteNoteFromDb 
  } = useDataPersistence();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Load notes when user becomes authenticated
  useEffect(() => {
    const loadUserNotes = async () => {
      if (isAuthenticated) {
        const userNotes = await loadNotes();
        const formattedNotes: Note[] = userNotes.map(note => ({
          id: note.id!,
          title: note.title,
          content: note.content,
          date: note.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));
        setNotes(formattedNotes);
        if (formattedNotes.length > 0 && !selectedNote) {
          setSelectedNote(formattedNotes[0].id);
        }
      } else {
        // Load default notes when not authenticated
        const defaultNotes = [
          { 
            id: 1, 
            title: "Study Goals", 
            content: "Complete TypeScript course\nFinish project proposal\nReview algorithms", 
            date: "2025-06-07" 
          },
          { 
            id: 2, 
            title: "Meeting Notes", 
            content: "Team standup at 2 PM\nDiscuss new features\nPlan sprint review", 
            date: "2025-06-07" 
          }
        ];
        setNotes(defaultNotes);
        setSelectedNote(1);
      }
    };

    loadUserNotes();
  }, [isAuthenticated, loadNotes]); // Removed selectedNote from dependencies
  const createNote = async () => {
    if (newTitle.trim()) {
      const tempId = Date.now();
      const newNote = {
        id: tempId,
        title: newTitle,
        content: newContent,
        date: new Date().toISOString().split('T')[0]
      };
      
      // Optimistically update UI
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote.id);
      setNewTitle('');
      setNewContent('');
      setIsEditing(false);

      if (isAuthenticated) {
        setIsSaving(true);
        try {
          const savedNote = await saveNoteToDb({
            title: newNote.title,
            content: newNote.content
          });

          if (savedNote) {
            // Replace temp note with saved note
            setNotes(prev => prev.map(note => 
              note.id === tempId 
                ? { ...newNote, id: savedNote.id! }
                : note
            ));
            setSelectedNote(savedNote.id!);
          }
        } catch (error) {
          // Revert on error
          setNotes(prev => prev.filter(note => note.id !== tempId));
          console.error('Failed to save note:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const saveNote = async () => {
    if (selectedNote && newTitle.trim()) {
      const updatedNote = { title: newTitle, content: newContent };
      
      // Optimistically update UI
      setNotes(notes.map(note => 
        note.id === selectedNote 
          ? { ...note, ...updatedNote }
          : note
      ));
      setIsEditing(false);

      if (isAuthenticated) {
        setIsSaving(true);
        try {
          await updateNoteInDb(selectedNote, updatedNote);
        } catch (error) {
          // Revert on error - reload the note
          const originalNote = notes.find(n => n.id === selectedNote);
          if (originalNote) {
            setNewTitle(originalNote.title);
            setNewContent(originalNote.content);
          }
          console.error('Failed to update note:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const deleteNote = async (id: number) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    // Optimistically update UI
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote === id) {
      const remainingNotes = notes.filter(n => n.id !== id);
      setSelectedNote(remainingNotes.length > 0 ? remainingNotes[0].id : null);
    }

    if (isAuthenticated) {
      try {
        await deleteNoteFromDb(id);
      } catch (error) {
        // Revert on error
        setNotes(prev => [...prev, noteToDelete]);
        console.error('Failed to delete note:', error);
      }
    }
  };

  // Update form when selecting a note
  const selectNote = (note: Note) => {
    setSelectedNote(note.id);
    setNewTitle(note.title);
    setNewContent(note.content);
    setIsEditing(false);
  };  return (
    <div className={styles.notesAppContainer}>
      <div className={styles.notesApp}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Notes List */}
          <div className={styles.notesList}>
            <div className={styles.notesListHeader}>
              <h3>All Notes</h3>
              <button
                onClick={() => {
                  setNewTitle('');
                  setNewContent('');
                  setIsEditing(true);
                  setSelectedNote(null);
                }}
                className={styles.addButton}
                disabled={isSaving}
              >
                <Plus size={16} />
                New Note
              </button>
            </div>
            
            <div className={styles.notesListContainer}>
              {notes.length === 0 ? (
                <div className={styles.emptyNotesList}>
                  <FileText size={32} />
                  <p>No notes yet</p>
                  <span>Create your first note to get started</span>
                </div>
              ) : (
                notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`${styles.noteItem} ${
                      selectedNote === note.id ? styles.noteItemActive : ''
                    }`}
                  >
                    <div className={styles.noteItemContent}>
                      <div className={styles.noteTitle}>{note.title}</div>
                      <div className={styles.notePreview}>
                        {note.content.slice(0, 80)}
                        {note.content.length > 80 ? '...' : ''}
                      </div>
                    </div>
                    <div className={styles.noteDate}>{note.date}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Note Editor */}
          <div className={styles.noteEditor}>
            {(selectedNote || isEditing) ? (
              <>
                <div className={styles.editorHeader}>
                  <div className={styles.editorHeaderContent}>
                    <h3>{isEditing || selectedNote === null ? 'Editing Note' : 'Viewing Note'}</h3>
                    <div className={styles.editorActions}>
                      {isEditing || selectedNote === null ? (
                        <button 
                          onClick={selectedNote ? saveNote : createNote} 
                          className={styles.saveButton}
                          disabled={!newTitle.trim()}
                        >
                          <Save size={16} />
                          Save
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(true)} 
                            className={styles.editButton}
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteNote(selectedNote)} 
                            className={styles.deleteButton}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={styles.editorContent}>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter note title..."
                    readOnly={!isEditing && selectedNote !== null}
                    className={styles.titleInput}
                  />
                  
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Start writing your note..."
                    readOnly={!isEditing && selectedNote !== null}
                    className={styles.contentTextarea}
                  />
                </div>
              </>
            ) : (
              <div className={styles.emptyEditor}>
                <div className={styles.emptyEditorIcon}>
                  <FileText size={48} />
                </div>
                <h3>Select a note to view</h3>
                <p>Choose a note from the list or create a new one to get started</p>
                <button
                  onClick={() => {
                    setNewTitle('');
                    setNewContent('');
                    setIsEditing(true);
                    setSelectedNote(null);
                  }}
                  className={styles.createFirstButton}
                >
                  <Plus size={16} />
                  Create Your First Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;
