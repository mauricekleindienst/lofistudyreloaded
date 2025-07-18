"use client";

import React, { 
  useState, useEffect, useCallback, useMemo 
} from 'react';
import { 
  X, 
  BarChart3,
  Trophy, 
  Clock, 
  TrendingUp,
  BookOpen,
  Code,
  PenTool,
  Briefcase,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDataPersistence } from '../hooks/useDataPersistence';
import { PomodoroStats } from '../lib/database';
import styles from '../../styles/StatsModal.module.css';
import { createClient } from '../utils/supabase/client';

// Create a single Supabase client instance
const supabase = createClient();

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryIcon = (category: string) => {
  const iconProps = { size: 16, className: styles.categoryIcon };
  switch (category.toLowerCase()) {
    case 'studying':
      return <BookOpen {...iconProps} />;
    case 'coding':
      return <Code {...iconProps} />;
    case 'writing':
      return <PenTool {...iconProps} />;
    case 'working':
      return <Briefcase {...iconProps} />;
    default:
      return <MoreHorizontal {...iconProps} />;
  }
};


const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { loadPomodoroStats } = useDataPersistence();
  
  const [stats, setStats] = useState<PomodoroStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);


  const loadStats = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setStats([]);
      if (isInitialLoad) setLoading(false);
      return;
    }

    // Set loading state only on manual refresh, not initial
    setLoading(true);
    
    const minDisplayTime = 400;
    const startTime = Date.now();

    try {
      const fetchedStats = await loadPomodoroStats(days);
      setStats(fetchedStats || []);
    } catch (error) {
      console.error('[StatsModal] Failed to load stats:', error);
      setStats([]);
    } finally {
      const duration = Date.now() - startTime;
      setTimeout(() => setLoading(false), Math.max(0, minDisplayTime - duration));
    }
  }, [user, days, loadPomodoroStats]);

  // Load stats only once when the modal is opened and user is available
  useEffect(() => {
    if (isOpen && user) {
      loadStats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const { totalSessions, totalFocusTime, avgSessionsPerDay, categoryStats } = useMemo(() => {
    if (!stats) {
      return { totalSessions: 0, totalFocusTime: 0, avgSessionsPerDay: 0, categoryStats: {} };
    }

    const totalSessions = stats.reduce((acc, s) => acc + (s.pomodoro_count || 0), 0);
    const totalFocusTime = stats.reduce((acc, s) => acc + (s.total_focus_time_minutes || 0), 0);
    
    const categoryStats = stats.reduce((acc, s) => {
      const category = s.category || 'Other';
      if (!acc[category]) {
        acc[category] = { sessions: 0, time: 0 };
      }
      acc[category].sessions += s.pomodoro_count || 0;
      acc[category].time += s.total_focus_time_minutes || 0;
      return acc;
    }, {} as Record<string, { sessions: number; time: number }>);

    return {
      totalSessions,
      totalFocusTime,
      avgSessionsPerDay: totalSessions > 0 ? (totalSessions / days) : 0,
      categoryStats
    };
  }, [stats, days]);
  

  if (!isOpen) return null;


  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <BarChart3 size={20} />
            <h2>Statistics</h2>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => loadStats(false)} 
              className={styles.refreshButton}
              aria-label="Refresh stats"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className={styles.closeButton} aria-label="Close modal"><X /></button>
          </div>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <RefreshCw className={`${styles.loadingIcon} animate-spin`} />
              <span>Loading stats...</span>
            </div>
          ) : !stats || stats.length === 0 ? (
            <div className={styles.noData}>
              <BarChart3 size={40} />
              <h3>No Data Available</h3>
              <p>Complete some Pomodoro sessions to see your stats here.</p>
            </div>
          ) : (
            <>
              <div className={styles.timeFilter}>
                <button 
                  className={days === 7 ? styles.active : ''}
                  onClick={() => setDays(7)}
                >
                  Last 7 Days
                </button>
                <button 
                  className={days === 30 ? styles.active : ''}
                  onClick={() => setDays(30)}
                >
                  Last 30 Days
                </button>
              </div>

              <div className={styles.statsGrid}>
                <StatCard 
                  icon={<Trophy />}
                  label="Total Sessions"
                  value={totalSessions} 
                />
                <StatCard 
                  icon={<Clock />}
                  label="Total Focus Time"
                  value={`${totalFocusTime} min`}
                />
                <StatCard 
                  icon={<TrendingUp />}
                  label="Avg. Daily Sessions"
                  value={avgSessionsPerDay.toFixed(1)}
                />
              </div>

              <div className={styles.detailsContainer}>
                <div className={styles.categoryBreakdown}>
                  <h3>Category Breakdown</h3>
                  <ul>
                    {Object.entries(categoryStats)
                      .sort(([, a], [, b]) => b.sessions - a.sessions)
                      .map(([category, data]) => (
                      <li key={category}>
                        <div className={styles.categoryInfo}>
                          {getCategoryIcon(category)}
                          <span className={styles.categoryName}>{category}</span>
                        </div>
                        <div className={styles.categoryStats}>
                          <span>{data.sessions} sessions</span>
                          <span>{data.time} min</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.activityHeatmap}>
                  <ActivityHeatmap stats={stats} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statValue}>{value}</div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);

const ActivityHeatmap = ({ stats }: { stats: PomodoroStats[] }) => {
  const { days, maxCount } = useMemo(() => {
    const endDate = new Date();
    // Go back 29 days to get a total of 30 days
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    // Create array of dates
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        count: 0,
        dayOfWeek: date.getDay(),
        column: Math.floor(i / 7)
      };
    });

    let maxCount = 0;
    stats.forEach(stat => {
      const statDate = stat.date?.split('T')[0];
      const day = days.find(d => d.date === statDate);
      if (day) {
        const sessionCount = stat.pomodoro_count || 0;
        day.count = sessionCount;
        if (sessionCount > maxCount) maxCount = sessionCount;
      }
    });

    return { days, maxCount: maxCount || 4 }; // Use at least 4 as max to avoid division by zero
  }, [stats]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className={styles.heatmapContainer}>
      <h3>Last 30 Days Activity</h3>
      <div className={styles.heatmap}>
        <div className={styles.weekdays}>
          {weekdays.map((name, idx) => (
            <div key={idx}>{name}</div>
          ))}
        </div>
        <div className={styles.days}>
          {days.map((day, index) => (
            <div
              key={index}
              className={styles.dayCell}
              style={{ 
                '--intensity': day.count / maxCount,
                gridRow: day.dayOfWeek + 1,
                gridColumn: day.column + 1
              } as React.CSSProperties}
              title={`${day.date}: ${day.count} sessions`}
            />
          ))}
        </div>
      </div>
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        <div className={styles.legendColors}>
          <div className={styles.dayCell} style={{ '--intensity': 0 } as React.CSSProperties}></div>
          <div className={styles.dayCell} style={{ '--intensity': 0.25 } as React.CSSProperties}></div>
          <div className={styles.dayCell} style={{ '--intensity': 0.5 } as React.CSSProperties}></div>
          <div className={styles.dayCell} style={{ '--intensity': 0.75 } as React.CSSProperties}></div>
          <div className={styles.dayCell} style={{ '--intensity': 1 } as React.CSSProperties}></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
