"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Clock, 
  Target, 
  Calendar,
  TrendingUp,
  Award,
  Users,
  BarChart3,
  Activity,
  Flame,
  CheckCircle,
  BookOpen,
  Code,
  PenTool,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDataPersistence } from '../hooks/useDataPersistence';
import styles from '../../styles/StatsModal.module.css';

interface StatsData {
  totalSessions: number;
  totalFocusTime: number; // in minutes
  streakDays: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
  categorySplit: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    sessions: number;
    focusTime: number;
  }>;
}

interface LeaderboardEntry {
  email: string;
  totalSessions: number;
  totalFocusTime: number;
  rank: number;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'studying':
      return <BookOpen size={16} />;
    case 'coding':
      return <Code size={16} />;
    case 'writing':
      return <PenTool size={16} />;
    case 'working':
      return <Briefcase size={16} />;
    default:
      return <MoreHorizontal size={16} />;
  }
};

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    loadPomodoroSessions, 
    loadPomodoroStats,
    loadLeaderboard 
  } = useDataPersistence();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'leaderboard'>('overview');
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user?.email) {
      loadStats();
    }
  }, [isOpen, user?.email]);

  const loadStats = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Load user sessions and stats
      const [sessions, stats, leaderboardData] = await Promise.all([
        loadPomodoroSessions(),
        loadPomodoroStats(),
        loadLeaderboard()
      ]);

      // Calculate comprehensive stats
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      // Filter sessions
      const completedSessions = sessions.filter(s => s.completed);
      const todaySessions = completedSessions.filter(s => 
        s.completed_at?.startsWith(today)
      );
      const weekSessions = completedSessions.filter(s => 
        s.completed_at && new Date(s.completed_at) >= weekAgo
      );
      const monthSessions = completedSessions.filter(s => 
        s.completed_at && new Date(s.completed_at) >= monthAgo
      );

      // Calculate category split
      const categorySplit: Record<string, number> = {};
      completedSessions.forEach(session => {
        const category = session.category || 'Other';
        categorySplit[category] = (categorySplit[category] || 0) + 1;
      });

      // Calculate daily activity for last 30 days
      const dailyActivity: Array<{ date: string; sessions: number; focusTime: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const daySessions = completedSessions.filter(s => 
          s.completed_at?.startsWith(dateStr)
        );
        
        dailyActivity.push({
          date: dateStr,
          sessions: daySessions.length,
          focusTime: daySessions.reduce((total, s) => total + (s.duration || 0), 0) / 60 // convert to minutes
        });
      }

      // Calculate streak
      let streakDays = 0;
      let checkDate = new Date(now);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasSessions = completedSessions.some(s => 
          s.completed_at?.startsWith(dateStr)
        );
        
        if (hasSessions) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStatsData({
        totalSessions: completedSessions.length,
        totalFocusTime: completedSessions.reduce((total, s) => total + (s.duration || 0), 0) / 60,
        streakDays,
        todaySessions: todaySessions.length,
        weekSessions: weekSessions.length,
        monthSessions: monthSessions.length,
        categorySplit,
        dailyActivity
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Study Statistics</h2>
              <p className={styles.modalSubtitle}>Your productivity insights</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your statistics...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && statsData && (
                <div className={styles.overviewContent}>
                  {/* Quick Stats */}
                  <div className={styles.quickStats}>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <CheckCircle size={20} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{statsData.totalSessions}</div>
                        <div className={styles.statLabel}>Total Sessions</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <Clock size={20} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{formatTime(statsData.totalFocusTime)}</div>
                        <div className={styles.statLabel}>Focus Time</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <Flame size={20} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{statsData.streakDays}</div>
                        <div className={styles.statLabel}>Day Streak</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <Target size={20} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{statsData.todaySessions}</div>
                        <div className={styles.statLabel}>Today</div>
                      </div>
                    </div>
                  </div>

                  {/* Period Comparison */}
                  <div className={styles.periodStats}>
                    <h3>Performance Overview</h3>
                    <div className={styles.periodGrid}>
                      <div className={styles.periodCard}>
                        <div className={styles.periodLabel}>This Week</div>
                        <div className={styles.periodValue}>{statsData.weekSessions} sessions</div>
                        <div className={styles.periodTime}>
                          {formatTime(statsData.dailyActivity.slice(-7).reduce((sum, day) => sum + day.focusTime, 0))}
                        </div>
                      </div>
                      <div className={styles.periodCard}>
                        <div className={styles.periodLabel}>This Month</div>
                        <div className={styles.periodValue}>{statsData.monthSessions} sessions</div>
                        <div className={styles.periodTime}>
                          {formatTime(statsData.dailyActivity.reduce((sum, day) => sum + day.focusTime, 0))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className={styles.categoryBreakdown}>
                    <h3>Study Categories</h3>
                    <div className={styles.categoryList}>
                      {Object.entries(statsData.categorySplit).map(([category, count]) => {
                        const percentage = (count / statsData.totalSessions) * 100;
                        return (
                          <div key={category} className={styles.categoryItem}>
                            <div className={styles.categoryHeader}>
                              <div className={styles.categoryName}>
                                {getCategoryIcon(category)}
                                <span>{category}</span>
                              </div>
                              <div className={styles.categoryCount}>{count} sessions</div>
                            </div>
                            <div className={styles.categoryProgress}>
                              <div 
                                className={styles.categoryBar}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className={styles.categoryPercentage}>{Math.round(percentage)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && statsData && (
                <div className={styles.analyticsContent}>
                  <h3>30-Day Activity Chart</h3>
                  <div className={styles.activityChart}>
                    <div className={styles.chartGrid}>
                      {statsData.dailyActivity.map((day, index) => {
                        const maxSessions = Math.max(...statsData.dailyActivity.map(d => d.sessions));
                        const intensity = maxSessions > 0 ? day.sessions / maxSessions : 0;
                        const dayOfWeek = new Date(day.date).getDay();
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        
                        return (
                          <div
                            key={day.date}
                            className={styles.chartDay}
                            style={{
                              backgroundColor: intensity > 0 
                                ? `rgba(255, 123, 0, ${0.2 + intensity * 0.8})` 
                                : 'rgba(255, 255, 255, 0.05)'
                            }}
                            title={`${day.date}: ${day.sessions} sessions, ${formatTime(day.focusTime)}`}
                          >
                            {index < 7 && (
                              <div className={styles.dayLabel}>{dayNames[dayOfWeek]}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.chartLegend}>
                      <span>Less</span>
                      <div className={styles.legendScale}>
                        {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
                          <div
                            key={intensity}
                            className={styles.legendSquare}
                            style={{
                              backgroundColor: intensity > 0 
                                ? `rgba(255, 123, 0, ${0.2 + intensity * 0.8})` 
                                : 'rgba(255, 255, 255, 0.05)'
                            }}
                          />
                        ))}
                      </div>
                      <span>More</span>
                    </div>
                  </div>

                  {/* Weekly Pattern */}
                  <div className={styles.weeklyPattern}>
                    <h3>Weekly Pattern</h3>
                    <div className={styles.weeklyChart}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const dayData = statsData.dailyActivity.filter(d => 
                          new Date(d.date).getDay() === (index + 1) % 7
                        );
                        const avgSessions = dayData.length > 0 
                          ? dayData.reduce((sum, d) => sum + d.sessions, 0) / dayData.length 
                          : 0;
                        const maxAvg = 5; // Assume max 5 sessions per day on average
                        const height = Math.min((avgSessions / maxAvg) * 100, 100);
                        
                        return (
                          <div key={day} className={styles.weeklyBar}>
                            <div 
                              className={styles.barFill}
                              style={{ height: `${height}%` }}
                            />
                            <div className={styles.barLabel}>{day}</div>
                            <div className={styles.barValue}>{avgSessions.toFixed(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className={styles.leaderboardContent}>
                  <div className={styles.leaderboardHeader}>
                    <h3>Global Leaderboard</h3>
                    <p>See how you rank among other focused learners</p>
                  </div>

                  {leaderboard.length > 0 ? (
                    <div className={styles.leaderboardList}>
                      {leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.email === user?.email;
                        return (
                          <div 
                            key={entry.email} 
                            className={`${styles.leaderboardItem} ${isCurrentUser ? styles.currentUser : ''}`}
                          >
                            <div className={styles.rank}>
                              {index < 3 ? (
                                <div className={`${styles.medal} ${styles[`medal${index + 1}`]}`}>
                                  <Award size={20} />
                                </div>
                              ) : (
                                <span className={styles.rankNumber}>#{index + 1}</span>
                              )}
                            </div>
                            <div className={styles.userInfo}>
                              <div className={styles.userName}>
                                {isCurrentUser ? 'You' : entry.email.split('@')[0]}
                              </div>
                              <div className={styles.userStats}>
                                {entry.totalSessions} sessions • {formatTime(entry.totalFocusTime)}
                              </div>
                            </div>
                            {isCurrentUser && (
                              <div className={styles.currentUserBadge}>You</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Users size={48} />
                      <h4>No leaderboard data yet</h4>
                      <p>Complete some focus sessions to see rankings!</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
