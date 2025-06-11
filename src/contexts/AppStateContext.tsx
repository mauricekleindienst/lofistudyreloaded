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

export interface AppStates {
  pomodoro: PomodoroState;
  todo: TodoState;
  music: MusicState;
}

interface AppStateContextType {
  appStates: AppStates;
  updatePomodoroState: (state: Partial<PomodoroState>) => void;
  updateTodoState: (state: Partial<TodoState>) => void;
  updateMusicState: (state: Partial<MusicState>) => void;
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
  },  music: {
    isPlaying: false,
    currentTrack: null
  }
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appStates, setAppStates] = useState<AppStates>(defaultAppStates);
  const updatePomodoroState = useCallback((state: Partial<PomodoroState>) => {
    setAppStates(prev => ({
      ...prev,
      pomodoro: { ...prev.pomodoro, ...state }
    }));
  }, []);

  const updateTodoState = useCallback((state: Partial<TodoState>) => {
    setAppStates(prev => ({
      ...prev,
      todo: { ...prev.todo, ...state }
    }));
  }, []);

  const updateMusicState = useCallback((state: Partial<MusicState>) => {
    setAppStates(prev => ({
      ...prev,
      music: { ...prev.music, ...state }
    }));
  }, []);

  return (
    <AppStateContext.Provider value={{
      appStates,
      updatePomodoroState,
      updateTodoState,
      updateMusicState
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
