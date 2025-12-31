import React, { useEffect, useState, memo, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Trophy, Clock, Medal, Flame, Target } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

// --- Types ---
interface LeaderboardEntry {
  id: string;
  username: string;
  total_focus_time_minutes: number;
  pomodoro_count: number;
  rank: number;
}

interface PersonalStatsData {
  totalTime: number;
  sessions: number;
  streak: number;
}

// --- Sub-Components ---

const PersonalStats = memo(({ stats }: { stats: PersonalStatsData }) => {
  const totalHours = (stats.totalTime / 60).toFixed(1);
  
  return (
    <View style={styles.personalStatsContainer}>
      <Text style={styles.sectionTitle}>My Progress (All Time)</Text>
      <BlurView intensity={30} tint="dark" style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.accent}33` }]}>
            <Clock size={20} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Focus Time</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.success}33` }]}>
            <Flame size={20} color={theme.colors.success} />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.statItem}>
           <View style={[styles.iconCircle, { backgroundColor: '#3b82f633' }]}>
            <Target size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.sessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>
      </BlurView>
    </View>
  );
});

const LeaderboardItem = memo(({ item, isMe }: { item: LeaderboardEntry; isMe: boolean }) => (
  <BlurView intensity={20} tint="dark" style={[styles.rowContainer, isMe && styles.myRow]}>
    <View style={styles.row}>
      <View style={styles.rankContainer}>
        {item.rank <= 3 ? (
          <Medal size={24} color={item.rank === 1 ? '#fbbf24' : item.rank === 2 ? '#94a3b8' : '#b45309'} />
        ) : (
          <Text style={styles.rankText}>{item.rank}</Text>
        )}
      </View>
      
      <View style={styles.userContainer}>
        <Text style={[styles.username, isMe && styles.myUsername]} numberOfLines={1}>
          {item.username} {isMe && '(You)'}
        </Text>
        <Text style={styles.subtext}>{item.pomodoro_count} sessions</Text>
      </View>

      <View style={styles.timeContainer}>
        <Clock size={14} color={isMe ? '#fff' : theme.colors.accent} style={{ marginRight: 4 }} />
        <Text style={[styles.timeText, isMe && { color: '#fff' }]}>
          {(item.total_focus_time_minutes / 60).toFixed(1)}h
        </Text>
      </View>
    </View>
  </BlurView>
));

// --- Main Component ---

export default function Stats() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 'all'>(7);
  const [personalStats, setPersonalStats] = useState<PersonalStatsData>({ totalTime: 0, sessions: 0, streak: 0 });

  const fetchStats = async () => {
    try {
      // 1. Fetch Leaderboard Data
      let query = supabase.from('pomodoro_stats').select('user_id, pomodoro_count, total_focus_time_minutes, date, username');

      if (timeRange !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      const { data: statsData, error } = await query;
      if (error) throw error;

      // Aggregation Logic
      const userStatsMap = new Map<string, { id: string; username: string; totalSessions: number; totalFocusTime: number; }>();

      statsData?.forEach((record: any) => {
        const userId = record.user_id;
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            id: userId,
            username: record.username || `User #${userId.slice(0, 4)}`,
            totalSessions: 0,
            totalFocusTime: 0,
          });
        }
        const stats = userStatsMap.get(userId)!;
        stats.totalSessions += record.pomodoro_count || 0;
        stats.totalFocusTime += record.total_focus_time_minutes || 0;
        
        if (record.username && stats.username.startsWith('User #')) {
          stats.username = record.username;
        }
      });

      const sorted = Array.from(userStatsMap.values())
        .sort((a, b) => b.totalFocusTime - a.totalFocusTime)
        .slice(0, 50)
        .map((item, index) => ({
          id: item.id,
          username: item.username,
          total_focus_time_minutes: item.totalFocusTime,
          pomodoro_count: item.totalSessions,
          rank: index + 1,
        }));

      setLeaderboard(sorted);

      // 2. Fetch Personal Stats (All Time)
      if (user) {
        const { data: myData } = await supabase
          .from('pomodoro_stats')
          .select('total_focus_time_minutes, pomodoro_count')
          .eq('user_id', user.id);

        const { data: myProfile } = await supabase
          .from('users')
          .select('streak_count')
          .eq('id', user.id)
          .single();

        if (myData) {
          const totalMinutes = myData.reduce((acc, curr) => acc + (curr.total_focus_time_minutes || 0), 0);
          const totalSessions = myData.reduce((acc, curr) => acc + (curr.pomodoro_count || 0), 0);

          setPersonalStats({
            totalTime: totalMinutes,
            sessions: totalSessions,
            streak: myProfile?.streak_count || 0
          });
        }
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Trophy size={24} color={theme.colors.accent} />
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>
    </View>
  ), []);

  const renderFilter = useMemo(() => (
    <View style={styles.filterContainer}>
      {[7, 30, 'all'].map((range) => (
        <Text
          key={range}
          onPress={() => setTimeRange(range as any)}
          style={[styles.filterText, timeRange === range && styles.activeFilter]}
        >
          {range === 'all' ? 'All Time' : `${range} Days`}
        </Text>
      ))}
    </View>
  ), [timeRange]);

  return (
    <View style={styles.container}>
      {renderHeader}
      <View style={styles.body}>
        {user && <PersonalStats stats={personalStats} />}
        {renderFilter}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={leaderboard}
            renderItem={({ item }) => <LeaderboardItem item={item} isMe={user?.id === item.id} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No stats available</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  personalStatsContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', borderRadius: 16, padding: 16, gap: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' },
  filterContainer: { flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.md },
  filterText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
  activeFilter: { color: theme.colors.accent, textDecorationLine: 'underline' },
  listContent: { paddingBottom: 20, gap: 8 },
  rowContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(45, 55, 72, 0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  myRow: { backgroundColor: `${theme.colors.accent}1A`, borderColor: theme.colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md },
  rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textSecondary },
  userContainer: { flex: 1, marginLeft: theme.spacing.sm },
  username: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  myUsername: { color: theme.colors.accent },
  subtext: { fontSize: 12, color: theme.colors.textSecondary },
  timeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  timeText: { color: theme.colors.accent, fontWeight: '600' },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 },
});
