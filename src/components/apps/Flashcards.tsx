"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Layers, Plus, ChevronLeft, Trash2, Play, Upload, Pencil, Check, X, Loader2, RotateCcw, Shuffle } from 'lucide-react';
import styles from '../../../styles/Tools.module.css';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { localDate, toast } from '../../lib/api';
import type { Deck, FlashCard } from '../../lib/database';

// Leitner boxes: a card moves up a box when you know it and back to 0 when you don't.
// The box decides how many days pass before the card is due again.
const INTERVALS = [0, 1, 2, 4, 8, 16];
const COLORS = ['#ff7b00', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308'];

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDate(d);
};

const cardId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const isDue = (c: FlashCard, today: string) => c.due <= today;

type Grade = 'again' | 'hard' | 'good' | 'easy';

function schedule(card: FlashCard, grade: Grade): FlashCard {
  const box = grade === 'again' ? 0 : grade === 'hard' ? Math.max(1, card.box) : grade === 'good' ? Math.min(5, card.box + 1) : Math.min(5, card.box + 2);
  return { ...card, box, due: addDays(grade === 'again' ? 0 : INTERVALS[box]) };
}

/** "front ; back", "front<TAB>back" or "front - back" per line */
function parseImport(text: string): Pick<FlashCard, 'front' | 'back'>[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)\s*(?:\t|;|\s[-–—]\s|::)\s*(.*)$/);
      return m ? { front: m[1].trim(), back: m[2].trim() } : { front: line, back: '' };
    })
    .filter((c) => c.front)
    .slice(0, 1000);
}

type View = { name: 'decks' } | { name: 'deck'; id: string } | { name: 'study'; id: string; cram: boolean };

export default function Flashcards() {
  const { db, isAuthenticated, authLoading } = useDataPersistence();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ name: 'decks' });
  const [newTitle, setNewTitle] = useState('');
  const today = localDate();

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    db.getDecks().then((items) => {
      if (cancelled) return;
      setDecks(items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [db, isAuthenticated, authLoading]);

  const saveCards = async (deck: Deck, cards: FlashCard[]) => {
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? { ...d, cards } : d)));
    const updated = await db.updateDeck(deck.id, { cards });
    if (!updated) setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)));
    return Boolean(updated);
  };

  const createDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const deck = await db.saveDeck({ title, color: COLORS[decks.length % COLORS.length], cards: [] });
    if (deck) {
      setDecks((prev) => [deck, ...prev]);
      setNewTitle('');
      setView({ name: 'deck', id: deck.id });
    }
  };

  const deleteDeck = async (deck: Deck) => {
    if (!confirm(`Delete “${deck.title}” and its ${deck.cards.length} cards?`)) return;
    if (await db.deleteDeck(deck.id)) {
      setDecks((prev) => prev.filter((d) => d.id !== deck.id));
      setView({ name: 'decks' });
    }
  };

  const renameDeck = async (deck: Deck, title: string) => {
    if (!title.trim() || title === deck.title) return;
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? { ...d, title } : d)));
    if (!(await db.updateDeck(deck.id, { title }))) setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)));
  };

  const current = view.name !== 'decks' ? decks.find((d) => d.id === view.id) : undefined;

  if (view.name === 'study' && current) {
    return (
      <Study
        deck={current}
        cram={view.cram}
        onExit={() => setView({ name: 'deck', id: current.id })}
        onSave={(cards) => saveCards(current, cards)}
      />
    );
  }

  if (view.name === 'deck' && current) {
    return (
      <DeckEditor
        deck={current}
        today={today}
        onBack={() => setView({ name: 'decks' })}
        onStudy={(cram) => setView({ name: 'study', id: current.id, cram })}
        onSave={(cards) => saveCards(current, cards)}
        onRename={(t) => renameDeck(current, t)}
        onDelete={() => deleteDeck(current)}
      />
    );
  }

  const totalDue = decks.reduce((n, d) => n + d.cards.filter((c) => isDue(c, today)).length, 0);

  return (
    <div className={styles.app}>
      <div className={styles.spread}>
        <div>
          <h2 className={styles.h2}>Flashcards</h2>
          <p className={styles.muted}>
            {decks.length ? `${totalDue} card${totalDue === 1 ? '' : 's'} due today` : 'Learn anything with spaced repetition'}
          </p>
        </div>
      </div>

      <form className={styles.row} onSubmit={createDeck}>
        <input
          className={styles.input}
          placeholder="New deck, e.g. Spanish verbs"
          value={newTitle}
          maxLength={120}
          onChange={(e) => setNewTitle(e.target.value)}
          aria-label="New deck name"
        />
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={!newTitle.trim()} aria-label="Create deck">
          <Plus size={16} />
        </button>
      </form>

      {loading ? (
        <div className={styles.empty}>
          <Loader2 size={22} className={styles.spin} />
        </div>
      ) : decks.length === 0 ? (
        <div className={styles.empty}>
          <Layers size={32} />
          <strong>No decks yet</strong>
          <span>Create a deck, add cards (or paste a list), then study a few minutes a day. Cards you know come back less often.</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {decks.map((d) => {
            const due = d.cards.filter((c) => isDue(c, today)).length;
            const mastered = d.cards.filter((c) => c.box >= 4).length;
            return (
              <li key={d.id}>
                <button className={styles.deck} style={{ '--tone': d.color || COLORS[0] } as React.CSSProperties} onClick={() => setView({ name: 'deck', id: d.id })}>
                  <span className={styles.deckIcon}>
                    <Layers size={18} />
                  </span>
                  <span className={styles.grow}>
                    <strong style={{ display: 'block', fontSize: 14 }}>{d.title}</strong>
                    <span className={styles.muted}>
                      {d.cards.length} cards · {mastered} mastered
                    </span>
                  </span>
                  {due > 0 && <span className={styles.due}>{due} due</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeckEditor({
  deck,
  today,
  onBack,
  onStudy,
  onSave,
  onRename,
  onDelete,
}: {
  deck: Deck;
  today: string;
  onBack: () => void;
  onStudy: (cram: boolean) => void;
  onSave: (cards: FlashCard[]) => Promise<boolean>;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ front: '', back: '' });
  const [title, setTitle] = useState(deck.title);
  const frontRef = useRef<HTMLTextAreaElement>(null);

  const due = deck.cards.filter((c) => isDue(c, today)).length;
  const mastered = deck.cards.filter((c) => c.box >= 4).length;

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim()) return;
    const ok = await onSave([...deck.cards, { id: cardId(), front: front.trim(), back: back.trim(), box: 0, due: today }]);
    if (ok) {
      setFront('');
      setBack('');
      frontRef.current?.focus();
    }
  };

  const importCards = async () => {
    const parsed = parseImport(importText);
    if (!parsed.length) return toast('Nothing to import — put one card per line, e.g. “hola ; hello”.', 'warning');
    const ok = await onSave([...deck.cards, ...parsed.map((c) => ({ ...c, id: cardId(), box: 0, due: today }))]);
    if (ok) {
      toast(`Imported ${parsed.length} cards.`, 'success');
      setImportText('');
      setShowImport(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !draft.front.trim()) return setEditing(null);
    await onSave(deck.cards.map((c) => (c.id === editing ? { ...c, front: draft.front.trim(), back: draft.back.trim() } : c)));
    setEditing(null);
  };

  return (
    <div className={styles.app}>
      <div className={styles.row}>
        <button className={styles.icon} onClick={onBack} aria-label="All decks">
          <ChevronLeft size={18} />
        </button>
        <input
          className={`${styles.input} ${styles.grow}`}
          style={{ fontWeight: 700, background: 'transparent', borderColor: 'transparent' }}
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onRename(title.trim() || deck.title)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Deck name"
        />
        <button className={`${styles.icon} ${styles.danger}`} onClick={onDelete} aria-label="Delete deck" title="Delete deck">
          <Trash2 size={16} />
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.spread}>
          <div>
            <strong style={{ fontSize: 22 }}>{due}</strong> <span className={styles.muted}>due now</span>
            <div className={styles.muted}>
              {deck.cards.length} cards · {mastered} mastered
            </div>
          </div>
          <div className={styles.row}>
            {due === 0 && deck.cards.length > 0 && (
              <button className={styles.btn} onClick={() => onStudy(true)} title="Review all cards anyway">
                <Shuffle size={15} /> Review all
              </button>
            )}
            <button className={`${styles.btn} ${styles.primary}`} disabled={due === 0} onClick={() => onStudy(false)}>
              <Play size={15} /> Study
            </button>
          </div>
        </div>
        {deck.cards.length > 0 && (
          <div className={styles.bar} style={{ marginTop: 10 }} aria-label={`${mastered} of ${deck.cards.length} mastered`}>
            <div className={styles.barFill} style={{ width: `${(mastered / deck.cards.length) * 100}%`, background: '#10b981' }} />
          </div>
        )}
      </div>

      <form onSubmit={addCard} className={styles.list}>
        <textarea
          ref={frontRef}
          className={styles.input}
          placeholder="Front — question or word"
          value={front}
          maxLength={2000}
          rows={2}
          onChange={(e) => setFront(e.target.value)}
          aria-label="Card front"
        />
        <textarea
          className={styles.input}
          placeholder="Back — answer"
          value={back}
          maxLength={4000}
          rows={2}
          onChange={(e) => setBack(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addCard(e);
          }}
          aria-label="Card back"
        />
        <div className={styles.row}>
          <button type="submit" className={`${styles.btn} ${styles.primary} ${styles.grow}`} disabled={!front.trim()}>
            <Plus size={15} /> Add card
          </button>
          <button type="button" className={styles.btn} onClick={() => setShowImport((v) => !v)} aria-expanded={showImport}>
            <Upload size={15} /> Paste list
          </button>
        </div>
      </form>

      {showImport && (
        <div className={styles.card}>
          <p className={styles.muted} style={{ marginBottom: 8 }}>
            One card per line: <code>front ; back</code> (a tab or “ - ” works too). Paste straight from a spreadsheet.
          </p>
          <textarea
            className={styles.input}
            rows={5}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'la casa ; the house\nel perro ; the dog'}
            aria-label="Cards to import"
          />
          <div className={styles.row} style={{ marginTop: 8, justifyContent: 'flex-end' }}>
            <span className={styles.muted}>{parseImport(importText).length} cards</span>
            <button className={`${styles.btn} ${styles.primary}`} onClick={importCards}>
              Import
            </button>
          </div>
        </div>
      )}

      {deck.cards.length > 0 && (
        <ul className={styles.list}>
          {[...deck.cards].reverse().map((c) => (
            <li key={c.id} className={styles.cardRow}>
              {editing === c.id ? (
                <div className={styles.grow} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea className={styles.input} rows={2} value={draft.front} onChange={(e) => setDraft((d) => ({ ...d, front: e.target.value }))} aria-label="Front" />
                  <textarea className={styles.input} rows={2} value={draft.back} onChange={(e) => setDraft((d) => ({ ...d, back: e.target.value }))} aria-label="Back" />
                </div>
              ) : (
                <div className={styles.cardText}>
                  <span>{c.front}</span>
                  <span>{c.back || '—'}</span>
                  <span className={styles.boxDots} aria-label={`Level ${c.box} of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i key={i} style={i <= c.box ? { background: '#86efac' } : undefined} />
                    ))}
                  </span>
                </div>
              )}
              {editing === c.id ? (
                <>
                  <button className={styles.icon} onClick={saveEdit} aria-label="Save card">
                    <Check size={15} />
                  </button>
                  <button className={styles.icon} onClick={() => setEditing(null)} aria-label="Cancel">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.icon}
                    onClick={() => {
                      setEditing(c.id);
                      setDraft({ front: c.front, back: c.back });
                    }}
                    aria-label="Edit card"
                  >
                    <Pencil size={14} />
                  </button>
                  <button className={styles.icon} onClick={() => onSave(deck.cards.filter((x) => x.id !== c.id))} aria-label="Delete card">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Study({ deck, cram, onExit, onSave }: { deck: Deck; cram: boolean; onExit: () => void; onSave: (cards: FlashCard[]) => Promise<boolean> }) {
  const today = localDate();
  // The queue is fixed when the session starts; "again" puts a card back at the end.
  const [queue, setQueue] = useState<string[]>(() => {
    const ids = deck.cards.filter((c) => cram || isDue(c, today)).map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  });
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  // Graded cards in this session (box/due changed); saved shortly after each answer.
  const [graded, setGraded] = useState<Record<string, FlashCard>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const [total] = useState(queue.length);

  const save = () => {
    if (!dirty.current) return;
    dirty.current = false;
    onSave(deck.cards.map((c) => graded[c.id] ?? c));
  };

  // Save a moment after each answer, and right away when the session, window or page closes.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!Object.keys(graded).length) return;
    const id = window.setTimeout(() => saveRef.current(), 1500);
    return () => window.clearTimeout(id);
  }, [graded]);
  useEffect(() => {
    const flush = () => saveRef.current();
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const card = queue.length ? (graded[queue[0]] ?? deck.cards.find((c) => c.id === queue[0])) : undefined;

  const grade = (g: Grade) => {
    if (!card) return;
    setGraded((m) => ({ ...m, [card.id]: schedule(card, g) }));
    dirty.current = true;
    setResults((r) => ({ ...r, [g]: r[g] + 1 }));
    setFlipped(false);
    setQueue((q) => (g === 'again' ? [...q.slice(1), q[0]] : q.slice(1)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only while this study view has focus (or nothing else does), never for other windows.
      const root = rootRef.current;
      const active = document.activeElement;
      if (!root || !(root.contains(active) || !active || active === document.body)) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === ' ' || e.key === 'Enter') {
        // A focused button handles Enter/Space itself.
        if (target.closest('button, a')) return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        grade((['again', 'hard', 'good', 'easy'] as Grade[])[Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const done = total - queue.length;

  if (!card) {
    const answered = results.again + results.hard + results.good + results.easy;
    return (
      <div className={styles.app}>
        <div className={styles.empty}>
          <span style={{ fontSize: 40 }}>🎉</span>
          <strong>Session complete</strong>
          <span>
            {answered} answers · {results.good + results.easy} known · {results.again} to repeat
          </span>
          <div className={styles.row} style={{ marginTop: 8 }}>
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => {
                save();
                onExit();
              }}
            >
              Back to deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextIn = (g: Grade) => {
    const days = g === 'again' ? 0 : INTERVALS[schedule(card, g).box];
    return days === 0 ? 'now' : days === 1 ? '1 day' : `${days} days`;
  };

  return (
    <div className={styles.app} ref={rootRef}>
      <div className={styles.row}>
        <button
          className={styles.icon}
          onClick={() => {
            save();
            onExit();
          }}
          aria-label="End session"
        >
          <ChevronLeft size={18} />
        </button>
        <div className={styles.grow}>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
        <span className={`${styles.muted} ${styles.mono}`}>
          {done}/{total}
        </span>
      </div>

      <div className={styles.flashWrap}>
        <button
          className={`${styles.flash} ${flipped ? styles.flipped : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Show question' : 'Show answer'}
        >
          <span className={styles.face}>
            <span className={styles.faceLabel}>{deck.title}</span>
            {card.front}
            <span className={styles.muted}>Tap or press Space to flip</span>
          </span>
          <span className={`${styles.face} ${styles.faceBack}`} aria-hidden={!flipped}>
            <span className={styles.faceLabel}>Answer</span>
            {card.back || <em className={styles.muted}>(no answer written)</em>}
          </span>
        </button>
      </div>

      {flipped ? (
        <div className={styles.grades}>
          {(
            [
              ['again', 'Again', styles.gAgain],
              ['hard', 'Hard', styles.gHard],
              ['good', 'Good', styles.gGood],
              ['easy', 'Easy', styles.gEasy],
            ] as const
          ).map(([g, label, cls], i) => (
            <button key={g} className={`${styles.grade} ${cls}`} onClick={() => grade(g)} aria-keyshortcuts={String(i + 1)}>
              {label}
              <small>{nextIn(g)}</small>
            </button>
          ))}
        </div>
      ) : (
        <button className={`${styles.btn} ${styles.primary}`} style={{ height: 48 }} onClick={() => setFlipped(true)}>
          <RotateCcw size={15} /> Show answer
        </button>
      )}
    </div>
  );
}
