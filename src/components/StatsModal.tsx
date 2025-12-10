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
  RefreshCw,
  Timer,
  Calendar,
  Settings
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

interface LeaderboardUser {
  id: string;
  email: string;
  username?: string;
  totalSessions: number;
  totalFocusTime: number;
  rank: number;
}

interface UserData {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
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


const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { loadPomodoroStats } = useDataPersistence();
  
  const [stats, setStats] = useState<PomodoroStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'sessions' | 'time'>('sessions');
  const [leaderboardTimeRange, setLeaderboardTimeRange] = useState<7 | 30 | 'all'>(7);
  
  // Username management
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);


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

  const loadLeaderboard = useCallback(async () => {
    if (!user) {
      setLeaderboardUsers([]);
      setLeaderboardLoading(false);
      return;
    }

    setLeaderboardLoading(true);

    try {
      // 1. Fetch stats first (aggregated by user would be better on DB side, but for now we optimize the user fetching)
      let query = supabase
        .from('pomodoro_stats')
        .select('user_id, pomodoro_count, total_focus_time_minutes, date, username');
      
      if (leaderboardTimeRange !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - leaderboardTimeRange);
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      
      const { data: statsData, error: statsError } = await query;

      if (statsError) {
        console.error('[StatsModal] Failed to load leaderboard stats:', statsError);
        setLeaderboardUsers([]);
        return;
      }

      // 2. Process and aggregate the data by user
      const userStatsMap = new Map<string, { 
        id: string; 
        totalSessions: number; 
        totalFocusTime: number;
        username?: string;
      }>();

      interface StatRecord {
        user_id: string;
        pomodoro_count?: number;
        total_focus_time_minutes?: number;
        date?: string;
        username?: string;
      }

      (statsData as StatRecord[]).forEach((record) => {
        const userId = record.user_id;
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            id: userId,
            totalSessions: 0,
            totalFocusTime: 0,
            username: record.username
          });
        }

        const userStats = userStatsMap.get(userId)!;
        userStats.totalSessions += record.pomodoro_count || 0;
        userStats.totalFocusTime += record.total_focus_time_minutes || 0;
        // Keep the username if we have it (latest one ideally, but any is better than none)
        if (record.username && !userStats.username) {
          userStats.username = record.username;
        }
      });

      // 3. Sort and limit to top 50 BEFORE fetching user details
      const sortedStats = Array.from(userStatsMap.values())
        .sort((a, b) => {
          if (leaderboardFilter === 'sessions') {
            return b.totalSessions - a.totalSessions;
          } else {
            return b.totalFocusTime - a.totalFocusTime;
          }
        })
        .slice(0, 50); // Optimization: Only handle top 50 users

      // 4. Fetch user details ONLY for the top users
      const userIds = sortedStats.map(s => s.id);
      
      // Always include current user if not in top 50, so they see themselves
      if (user && !userIds.includes(user.id)) {
        // Check if current user has stats
        const currentUserStats = userStatsMap.get(user.id);
        if (currentUserStats) {
            userIds.push(user.id);
            sortedStats.push(currentUserStats);
        }
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, username')
        .in('id', userIds);
      
      if (usersError) {
        console.error('[StatsModal] Failed to load users:', usersError);
      }

      // Create a map of user IDs to user info
      const userInfoMap = new Map<string, {email: string; name: string; username?: string}>();
      if (usersData) {
        (usersData as UserData[]).forEach((userData) => {
          userInfoMap.set(userData.id, {
            email: userData.email || 'User',
            name: userData.full_name || userData.email?.split('@')[0] || `User #${userData.id.slice(-4)}`,
            username: userData.username
          });
        });
      }

      // 5. Combine and finalize
      const combinedUsers = sortedStats.map((stats) => {
        const userInfo = userInfoMap.get(stats.id) || { 
          email: `User #${stats.id.slice(-4)}`,
          name: `User #${stats.id.slice(-4)}`,
          username: undefined
        };
        return {
          id: stats.id,
          email: userInfo.email,
          // Prioritize username from stats (pomodoro_stats table) over userInfo (users table)
          username: stats.username || userInfo.username,
          totalSessions: stats.totalSessions,
          totalFocusTime: stats.totalFocusTime
        };
      });
      
      // Re-sort because adding current user might have disrupted order if they were appended
      const finalSortedUsers = leaderboardFilter === 'sessions' 
        ? combinedUsers.sort((a, b) => b.totalSessions - a.totalSessions)
        : combinedUsers.sort((a, b) => b.totalFocusTime - a.totalFocusTime);

      // Add rank
      const rankedUsers = finalSortedUsers.map((u, index) => ({
        ...u,
        rank: index + 1
      }));

      setLeaderboardUsers(rankedUsers);
    } catch (error) {
      console.error('[StatsModal] Unexpected error loading leaderboard:', error);
      setLeaderboardUsers([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user, leaderboardFilter, leaderboardTimeRange]);

  // Load stats only once when the modal is opened and user is available
  useEffect(() => {
    if (isOpen && user) {
      loadStats(true);
      loadLeaderboard();
      checkUsername();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, leaderboardFilter, leaderboardTimeRange]);

  // Check if user has a username
  const checkUsername = useCallback(async () => {
    if (!user) return;
    
    try {
      // First check if the username exists in pomodoro_stats
      const { data: pomodoroData, error: pomodoroError } = await supabase
        .from('pomodoro_stats')
        .select('username')
        .eq('user_id', user.id)
        .not('username', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!pomodoroError && pomodoroData?.username) {
        setUsername(pomodoroData.username);
        return;
      }
      
      // If not found in pomodoro_stats, check if the user has a full_name in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('[StatsModal] Failed to check user data:', userError);
        return;
      }
      
      // If user has no username in pomodoro_stats, show modal to set one
      // Default the username field to their full_name or email username part
      if (userData) {
        const defaultUsername = userData.full_name || userData.email?.split('@')[0] || '';
        setUsername(defaultUsername);
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error('[StatsModal] Error checking username:', error);
    }
  }, [user]);

  // Update username
  const updateUsername = async () => {
    if (!user || !username.trim()) return;
    
    setIsUpdatingUsername(true);
    setUsernameError('');
    
    try {
      // Check if username is already taken in pomodoro_stats
      const { data: existingUser, error: checkError } = await supabase
        .from('pomodoro_stats')
        .select('user_id')
        .eq('username', username.trim())
        .neq('user_id', user.id)
        .limit(1)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('[StatsModal] Error checking username availability:', checkError);
        setUsernameError('Error checking username availability');
        return;
      }
      
      if (existingUser) {
        setUsernameError('Username already taken');
        return;
      }
      
      // Update username in pomodoro_stats table for all user's entries
      const { error: statsUpdateError } = await supabase
        .from('pomodoro_stats')
        .update({ username: username.trim() })
        .eq('user_id', user.id);
      
      if (statsUpdateError) {
        console.error('[StatsModal] Failed to update username in stats:', statsUpdateError);
        setUsernameError('Failed to update username');
        return;
      }
      
      // Update successful
      setShowUsernameModal(false);
      loadLeaderboard(); // Refresh leaderboard to show new username
    } catch (error) {
      console.error('[StatsModal] Error updating username:', error);
      setUsernameError('An unexpected error occurred');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

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
  
  // Format time in hours and minutes
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
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
                <h3>{username ? 'Edit Username' : 'Set Username'}</h3>
                {/* Only allow closing if user already has a username */}
                {username && (
                  <button 
                    onClick={() => setShowUsernameModal(false)} 
                    className={styles.closeButton}
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className={styles.usernameModalContent}>
                <p>
                  {username 
                    ? 'Change your display name on the leaderboard.' 
                    : 'Please set a username to appear on the leaderboard.'}
                </p>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className={styles.usernameInput}
                  maxLength={20}
                  autoFocus
                />
                {usernameError && <div className={styles.usernameError}>{usernameError}</div>}
              </div>
              <div className={styles.usernameModalActions}>
                <button 
                  onClick={updateUsername}
                  className={styles.saveButton}
                  disabled={!username.trim() || isUpdatingUsername}
                >
                  {isUpdatingUsername ? 'Saving...' : 'Save Username'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <BarChart3 size={20} />
            <h2>Statistics</h2>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => {
                loadStats(false);
                loadLeaderboard();
              }} 
              className={styles.refreshButton}
              aria-label="Refresh stats"
              disabled={loading || leaderboardLoading}
            >
              <RefreshCw size={16} className={(loading || leaderboardLoading) ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <RefreshCw size={32} className={`${styles.loadingIcon} animate-spin`} />
              <span>Loading stats...</span>
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
                  icon={<Trophy size={20} />}
                  label="Total Sessions"
                  value={totalSessions} 
                />
                <StatCard 
                  icon={<Clock size={20} />}
                  label="Total Focus Time"
                  value={formatTime(totalFocusTime)}
                />
                <StatCard 
                  icon={<TrendingUp size={20} />}
                  label="Avg. Daily Sessions"
                  value={avgSessionsPerDay.toFixed(1)}
                />
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
                                    <div 
                                      className={styles.categoryBar} 
                                      style={{ width: `${percentage}%` }}
                                    />
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
                    <ActivityHeatmap stats={stats || []} />
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
                      {leaderboardUsers.map((leaderboardUser) => (
                        <li 
                          key={leaderboardUser.id} 
                          className={`${styles.leaderboardItem} ${user && leaderboardUser.id === user.id ? styles.currentUser : ''}`}
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
                          
                          <div className={styles.userInfo}>
                            <div className={styles.userName}>
                              {leaderboardUser.username || leaderboardUser.email.split('@')[0]}
                              {user && leaderboardUser.id === user.id && (
                                <>
                                  <span className={styles.currentUserTag}> (You)</span>
                                  <button 
                                    className={styles.settingsButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUsername(leaderboardUser.username || leaderboardUser.email.split('@')[0]);
                                      setShowUsernameModal(true);
                                    }}
                                    aria-label="Edit username"
                                  >
                                    <Settings size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                            <div className={styles.userStats}>
                              <span>
                                <Trophy size={12} /> {leaderboardUser.totalSessions} sessions
                              </span>
                              <span>
                                <Timer size={12} /> {formatTime(leaderboardUser.totalFocusTime)}
                              </span>
                            </div>
                          </div>
                          
                          <div className={styles.scoreValue}>
                            {leaderboardFilter === 'sessions' 
                              ? `${leaderboardUser.totalSessions} 🔥`
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
