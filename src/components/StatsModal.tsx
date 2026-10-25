"use client";

import React, {
  useState, useEffect, useCallback, useMemo, useRef
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
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, type PomodoroStats, type LeaderboardEntry } from '../lib/database';
import { daysAgo, localDate } from '../lib/api';
import styles from '../../styles/StatsModal.module.css';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

const getCategoryIcon = (category: string) => {
  const iconProps = { size: 14, className: styles.categoryIcon };
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

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, onSignIn }) => {
  const { user, updateProfile } = useAuth();

  // All of the user's stats rows; the range filters below are applied client-side.
  const [allStats, setAllStats] = useState<PomodoroStats[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [days, setDays] = useState(7);

  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'sessions' | 'time'>('sessions');
  const [leaderboardTimeRange, setLeaderboardTimeRange] = useState<7 | 30 | 'all'>(7);

  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const leaderboardRequest = useRef(0);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setAllStats(await db.getPomodoroStats());
    setStatsLoading(false);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const request = ++leaderboardRequest.current;
    setLeaderboardLoading(true);
    const from = leaderboardTimeRange === 'all' ? undefined : daysAgo(leaderboardTimeRange - 1);
    const entries = await db.getLeaderboard(from, leaderboardFilter);
    // Ignore responses that arrive after the filters changed again.
    if (request !== leaderboardRequest.current) return;
    setLeaderboardUsers(entries);
    setLeaderboardLoading(false);
  }, [leaderboardFilter, leaderboardTimeRange]);

  const updateUsername = async () => {
    if (!user || username.trim().length < 2) {
      setUsernameError('Please use at least 2 characters');
      return;
    }
    setIsUpdatingUsername(true);
    setUsernameError('');
    const { error } = await updateProfile({ full_name: username.trim() });
    setIsUpdatingUsername(false);
    if (error) {
      setUsernameError(error);
      return;
    }
    setShowUsernameModal(false);
    fetchLeaderboard();
  };

  useEffect(() => {
    if (isOpen) fetchStats();
  }, [isOpen, user?.id, fetchStats]);

  useEffect(() => {
    if (isOpen) fetchLeaderboard();
  }, [isOpen, user?.id, fetchLeaderboard]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const stats = useMemo(() => {
    if (!allStats) return null;
    if (days === 0) return allStats;
    const from = daysAgo(days - 1);
    return allStats.filter((s) => s.date >= from);
  }, [allStats, days]);

  // --- Calculations ---

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

    let daysCount = days;
    if (days === 0) { // All Time
      if (stats.length > 0) {
        const oldest = stats.reduce((min, s) => (s.date < min ? s.date : min), localDate());
        const diffDays = Math.round((Date.parse(localDate()) - Date.parse(oldest)) / 86_400_000) + 1;
        daysCount = Math.max(diffDays, 1);
      } else {
        daysCount = 1;
      }
    }

    return {
      totalSessions,
      totalFocusTime,
      avgSessionsPerDay: totalSessions > 0 ? (totalSessions / daysCount) : 0,
      categoryStats
    };
  }, [stats, days]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Username Modal */}
        {showUsernameModal && (
          <div className={styles.usernameModalOverlay} onClick={(e) => e.stopPropagation()}>
            <div className={styles.usernameModal}>
              <div className={styles.usernameModalHeader}>
                <h3>Display name</h3>
                {(
                  <button
                    onClick={() => setShowUsernameModal(false)}
                    className={styles.closeButton}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className={styles.usernameModalContent}>
                <p>This name is shown on the leaderboard and in chat.</p>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your display name"
                  className={styles.usernameInput}
                  maxLength={40}
                  autoFocus
                />
                {usernameError && <div className={styles.usernameError}>{usernameError}</div>}
              </div>
              <div className={styles.usernameModalActions}>
                <button
                  onClick={updateUsername}
                  className={styles.saveButton}
                  disabled={username.trim().length < 2 || isUpdatingUsername}
                >
                  {isUpdatingUsername ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <BarChart3 size={20} />
            <h2>Statistics</h2>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => {
                fetchStats();
                fetchLeaderboard();
              }}
              className={styles.refreshButton}
              disabled={statsLoading || leaderboardLoading}
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={(statsLoading || leaderboardLoading) ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className={styles.closeButton} aria-label="Close statistics">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {statsLoading ? (
            <div className={styles.loadingContainer}>
              <RefreshCw size={32} className={`${styles.loadingIcon} animate-spin`} />
              <span>Loading stats...</span>
            </div>
          ) : (
            <>
              <div className={styles.timeFilter}>
                <button className={days === 7 ? styles.active : ''} onClick={() => setDays(7)}>Last 7 Days</button>
                <button className={days === 30 ? styles.active : ''} onClick={() => setDays(30)}>Last 30 Days</button>
                <button className={days === 0 ? styles.active : ''} onClick={() => setDays(0)}>All Time</button>
              </div>

              <div className={styles.statsGrid}>
                <StatCard icon={<Trophy size={20} />} label="Total Sessions" value={totalSessions} />
                <StatCard icon={<Clock size={20} />} label="Total Focus Time" value={formatTime(totalFocusTime)} />
                <StatCard icon={<TrendingUp size={20} />} label="Avg. Daily Sessions" value={avgSessionsPerDay.toFixed(1)} />
              </div>

              <div className={styles.mainContent}>
                <div className={styles.detailsContainer}>
                  <div className={styles.categoryBreakdown}>
                    <h3>Category Breakdown</h3>
                    <ul>
                      {Object.entries(categoryStats).length > 0 ? (
                        Object.entries(categoryStats)
                          .sort(([, a], [, b]) => b.sessions - a.sessions)
                          .map(([category, data]) => {
                            const maxSessions = Math.max(...Object.values(categoryStats).map(d => d.sessions), 1);
                            const percentage = (data.sessions / maxSessions) * 100;
                            return (
                              <li key={category}>
                                <div className={styles.categoryRow}>
                                  <div className={styles.categoryHeader}>
                                    <div className={styles.categoryInfo}>
                                      {getCategoryIcon(category)}
                                      <span className={styles.categoryName}>{category}</span>
                                    </div>
                                    <div className={styles.categoryStats}>
                                      <span className={styles.sessionCount}>{data.sessions} sessions</span>
                                      <span className={styles.timeLabel}>{formatTime(data.time)}</span>
                                    </div>
                                  </div>
                                  <div className={styles.categoryBarContainer}>
                                    <div className={styles.categoryBar} style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              </li>
                            );
                          })
                      ) : (
                        <div className={styles.emptyState}>No activity yet</div>
                      )}
                    </ul>
                  </div>

                  <div className={styles.activityHeatmap}>
                    <ActivityHeatmap stats={allStats || []} />
                  </div>
                </div>

                <div className={styles.scoreboardPanel}>
                  <div className={styles.scoreboardHeader}>
                    <h3>Leaderboard</h3>
                    <div className={styles.scoreboardFilters}>
                      <div className={styles.timeRangeFilter}>
                        <button
                          className={leaderboardTimeRange === 7 ? styles.active : ''}
                          onClick={() => setLeaderboardTimeRange(7)}
                          title="Last 7 days"
                        >
                          <Calendar size={12} /> 7d
                        </button>
                        <button
                          className={leaderboardTimeRange === 30 ? styles.active : ''}
                          onClick={() => setLeaderboardTimeRange(30)}
                          title="Last 30 days"
                        >
                          <Calendar size={12} /> 30d
                        </button>
                        <button
                          className={leaderboardTimeRange === 'all' ? styles.active : ''}
                          onClick={() => setLeaderboardTimeRange('all')}
                          title="All time"
                        >
                          <Calendar size={12} /> All
                        </button>
                      </div>
                      <div className={styles.sortFilter}>
                        <button
                          className={leaderboardFilter === 'sessions' ? styles.active : ''}
                          onClick={() => setLeaderboardFilter('sessions')}
                        >
                          Sessions
                        </button>
                        <button
                          className={leaderboardFilter === 'time' ? styles.active : ''}
                          onClick={() => setLeaderboardFilter('time')}
                        >
                          Time
                        </button>
                      </div>
                    </div>
                  </div>

                  {leaderboardLoading ? (
                    <div className={styles.loadingContainer} style={{ padding: '2rem 0' }}>
                      <RefreshCw size={24} className={`${styles.loadingIcon} animate-spin`} />
                      <span>Loading leaderboard...</span>
                    </div>
                  ) : (
                    <ul className={styles.leaderboard}>
                      {leaderboardUsers.length === 0 && (
                        <li className={styles.emptyState}>No sessions in this period yet — be the first!</li>
                      )}
                      {!user && (
                        <li className={styles.emptyState}>
                          <button type="button" className={styles.signInLink} onClick={onSignIn}>
                            Sign in
                          </button>{' '}
                          to appear on the leaderboard.
                        </li>
                      )}
                      {leaderboardUsers.map((leaderboardUser) => (
                        <li
                          key={leaderboardUser.id}
                          className={`${styles.leaderboardItem} ${leaderboardUser.isMe ? styles.currentUser : ''}`}
                        >
                          {leaderboardUser.rank <= 3 ? (
                            <div className={styles[`rank${leaderboardUser.rank}`]}>
                              {leaderboardUser.rank}
                            </div>
                          ) : (
                            <div className={styles.rank}>
                              {leaderboardUser.rank}
                            </div>
                          )}

                          <div
                            className={styles.userInfo}
                            onClick={() => {
                              if (leaderboardUser.isMe) {
                                setUsername(leaderboardUser.name);
                                setShowUsernameModal(true);
                              }
                            }}
                            style={{ cursor: leaderboardUser.isMe ? 'pointer' : 'default' }}
                          >
                            <div className={styles.userName}>
                              {leaderboardUser.name}
                              {leaderboardUser.isMe && (
                                <span className={styles.currentUserTag} title="Click to change your display name">YOU</span>
                              )}
                            </div>
                            <div className={styles.userStats}>
                              <span>{leaderboardUser.totalSessions} sessions</span>
                              <span>•</span>
                              <span>{formatTime(leaderboardUser.totalFocusTime)}</span>
                            </div>
                          </div>

                          <div className={`${styles.scoreValue} ${leaderboardUser.rank <= 3 ? styles.highlight : ''}`}>
                            {leaderboardFilter === 'sessions'
                              ? leaderboardUser.totalSessions
                              : formatTime(leaderboardUser.totalFocusTime)
                            }
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
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
    const perDay = new Map<string, number>();
    stats.forEach(stat => {
      perDay.set(stat.date, (perDay.get(stat.date) || 0) + (stat.pomodoro_count || 0));
    });

    // 30 days ending today, laid out GitHub-style: rows = weekday, columns = week.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    const offset = start.getDay();

    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = localDate(date);
      return {
        date: key,
        count: perDay.get(key) || 0,
        dayOfWeek: date.getDay(),
        column: Math.floor((i + offset) / 7)
      };
    });

    const maxCount = Math.max(4, ...days.map(d => d.count));
    return { days, maxCount };
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
