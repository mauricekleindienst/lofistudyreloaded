"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PomodoroState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  cycles: number;
  category?: 'Studying' | 'Coding' | 'Writing' | 'Working' | 'Other';
}

interface TodoState {
  pendingCount: number;
}

interface MusicState {
  isPlaying: boolean;
  currentTrack: string | null;
}

interface FocusState {
  isDeepFocusMode: boolean;
}

interface NotesState {
  totalCount: number;
}

interface ChatState {
  unreadCount: number;
  lastMessageTimestamp: number | null;
}

export interface AppStates {
  pomodoro: PomodoroState;
  todo: TodoState;
  music: MusicState;
  focus: FocusState;
  notes: NotesState;
  chat: ChatState;
}

interface AppStateContextType {
  appStates: AppStates;
  updatePomodoroState: (state: Partial<PomodoroState> | ((prev: PomodoroState) => Partial<PomodoroState>)) => void;
  updateTodoState: (state: Partial<TodoState> | ((prev: TodoState) => Partial<TodoState>)) => void;
  updateMusicState: (state: Partial<MusicState> | ((prev: MusicState) => Partial<MusicState>)) => void;
  updateFocusState: (state: Partial<FocusState> | ((prev: FocusState) => Partial<FocusState>)) => void;
  updateNotesState: (state: Partial<NotesState> | ((prev: NotesState) => Partial<NotesState>)) => void;
  updateChatState: (state: Partial<ChatState> | ((prev: ChatState) => Partial<ChatState>)) => void;
}

const defaultAppStates: AppStates = {
  pomodoro: {
    minutes: 25,
    seconds: 0,
    isRunning: false,
    mode: 'work',
    cycles: 0,
    category: 'Studying'
  },
  todo: {
    pendingCount: 0
  }, music: {
    isPlaying: false,
    currentTrack: null
  },
  focus: {
    isDeepFocusMode: false
  },
  notes: {
    totalCount: 0
  },
  chat: {
    unreadCount: 0,
    lastMessageTimestamp: null
  }
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appStates, setAppStates] = useState<AppStates>(defaultAppStates);
  const updatePomodoroState = useCallback((state: Partial<PomodoroState> | ((prev: PomodoroState) => Partial<PomodoroState>)) => {
    setAppStates(prev => ({
      ...prev,
      pomodoro: { ...prev.pomodoro, ...(typeof state === 'function' ? state(prev.pomodoro) : state) }
    }));
  }, []);

  const updateTodoState = useCallback((state: Partial<TodoState> | ((prev: TodoState) => Partial<TodoState>)) => {
    setAppStates(prev => ({
      ...prev,
      todo: { ...prev.todo, ...(typeof state === 'function' ? state(prev.todo) : state) }
    }));
  }, []);

  const updateMusicState = useCallback((state: Partial<MusicState> | ((prev: MusicState) => Partial<MusicState>)) => {
    setAppStates(prev => ({
      ...prev,
      music: { ...prev.music, ...(typeof state === 'function' ? state(prev.music) : state) }
    }));
  }, []);

  const updateFocusState = useCallback((state: Partial<FocusState> | ((prev: FocusState) => Partial<FocusState>)) => {
    setAppStates(prev => ({
      ...prev,
      focus: { ...prev.focus, ...(typeof state === 'function' ? state(prev.focus) : state) }
    }));
  }, []);

  const updateNotesState = useCallback((state: Partial<NotesState> | ((prev: NotesState) => Partial<NotesState>)) => {
    setAppStates(prev => ({
      ...prev,
      notes: { ...prev.notes, ...(typeof state === 'function' ? state(prev.notes) : state) }
    }));
  }, []);

  const updateChatState = useCallback((state: Partial<ChatState> | ((prev: ChatState) => Partial<ChatState>)) => {
    setAppStates(prev => ({
      ...prev,
      chat: { ...prev.chat, ...(typeof state === 'function' ? state(prev.chat) : state) }
    }));
  }, []);

  return (
    <AppStateContext value={{
      appStates,
      updatePomodoroState,
      updateTodoState,
      updateMusicState,
      updateFocusState,
      updateNotesState,
      updateChatState
    }}>
      {children}
    </AppStateContext>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
