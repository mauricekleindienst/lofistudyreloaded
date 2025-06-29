# Supabase Realtime Setup Guide

## 1. Enable Realtime in Supabase Dashboard

### Step 1: Access Realtime Settings
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to the **Realtime** section

### Step 2: Enable Realtime Replication
For each table you want to sync in realtime, you need to enable replication:

1. Go to **Database** → **Replication**
2. Find these tables and toggle **Realtime** to ON:
   - `todos`
   - `pomodoro_sessions`
   - `pomodoro_stats` 
   - `users`

Alternatively, you can run this SQL in the **SQL Editor**:

```sql
-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
```

### Step 3: Verify Realtime is Working
1. Go to **API Docs** → **JavaScript**
2. Check that realtime examples show your tables

## 2. Database Fixes

Run the `database_fixes_final.sql` script to fix RLS policies and permissions:

```bash
# In your Supabase SQL Editor, paste and run the contents of:
# database_fixes_final.sql
```

## 3. Test Realtime Features

### What's Included in the App:

#### ✅ **TodoList with Realtime**
- Live updates when todos are added/updated/deleted
- Works across multiple browser tabs/devices
- Automatic sync with database changes

#### ✅ **PomodoroTimer with Realtime Sessions**
- Real-time session tracking
- Live stats updates
- Session counts sync across devices

#### ✅ **StatsModal with Live Data**
- Real-time pomodoro statistics
- Live session history updates
- Automatic recalculation when data changes

#### ✅ **Realtime Status Indicator**
- Shows connection status in bottom bar
- Displays active channel count
- Visual feedback for realtime connectivity

### Testing Steps:

1. **Test Todo Sync:**
   - Open the app in two browser tabs
   - Add a todo in one tab
   - Watch it appear instantly in the other tab

2. **Test Pomodoro Sync:**
   - Complete a pomodoro session
   - Open Stats modal to see live updates
   - Check session count updates in real-time

3. **Test Connection Status:**
   - Look for the realtime indicator in the bottom bar
   - Should show "Live (X channels)" when connected
   - Will show "Reconnecting..." if connection is lost

## 4. Code Integration

The following components now use realtime:

- `src/components/apps/TodoList.tsx` - Uses `useRealtimeTodos()`
- `src/components/apps/PomodoroTimer.tsx` - Uses `useRealtimePomodoroSessions()`  
- `src/components/StatsModal.tsx` - Uses both realtime hooks
- `src/components/RealtimeStatusIndicator.tsx` - Shows connection status

## 5. Hooks Available

```typescript
// Import realtime hooks
import { 
  useRealtimeTodos,
  useRealtimePomodoroSessions, 
  useRealtimePomodoroStats,
  useRealtimeData // Combined hook
} from '../hooks/useRealtime';

// Usage examples:
const { todos, isLoading, refresh } = useRealtimeTodos();
const { sessions, isLoading } = useRealtimePomodoroSessions();
const { stats, isLoading } = useRealtimePomodoroStats();

// Or get all data at once:
const { todos, sessions, stats, isLoading } = useRealtimeData();
```

## 6. Troubleshooting

### If realtime isn't working:

1. **Check Database Policies:**
   - Ensure RLS policies allow your operations
   - Run the database fixes SQL

2. **Verify Table Replication:**
   - Check Supabase dashboard → Database → Replication
   - Make sure tables are enabled for realtime

3. **Check Console Logs:**
   - Look for "Realtime [table] change:" messages
   - Verify subscription status logs

4. **Connection Issues:**
   - Check network connectivity
   - Verify Supabase project URL and anon key
   - Look at realtime status indicator

### Common Issues:

- **"Row Level Security policy violation"** → Run database fixes SQL
- **"Not authorized to listen"** → Check RLS policies and grants
- **Changes not syncing** → Verify table replication is enabled
- **Connection not showing as live** → Check internet connection and Supabase status

## 7. Next Steps

After setup, your app will have:
- ✅ Real-time todo synchronization
- ✅ Live pomodoro session tracking  
- ✅ Instant stats updates
- ✅ Multi-device sync
- ✅ Connection status monitoring
- ✅ Offline/online mode handling

The app automatically falls back to local storage when not authenticated, and seamlessly upgrades to realtime sync when users sign in.
