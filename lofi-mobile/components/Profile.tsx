import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { User, Mail, LogOut, Shield, FileText, ExternalLink } from 'lucide-react-native';

// --- Sub-Components ---

const ProfileHeader = memo(({ user }: { user: any }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user.full_name || user.email)}</Text>
          </View>
        )}
      </View>
      <View style={styles.nameContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.full_name || 'Anonymous User'}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </View>
  );
});

const DetailRow = memo(({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Icon size={20} color={theme.colors.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">{value}</Text>
  </View>
));

// --- Main Component ---

export default function Profile() {
  const { user, signOut } = useAuth();
  
  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <User size={24} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutIcon}>
          <LogOut size={20} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 100 }}>
        <ProfileHeader user={user} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
            <DetailRow icon={Mail} label="Email" value={user.email} />
            <View style={styles.divider} />
            <DetailRow icon={User} label="User ID" value={user.id} />
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
            <TouchableOpacity onPress={() => Linking.openURL('https://lo-fi.study/privacy')}>
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Shield size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.detailLabel}>Privacy Policy</Text>
                </View>
                <ExternalLink size={16} color={theme.colors.textSecondary} /> 
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => Linking.openURL('https://lo-fi.study/legal')}>
              <View style={styles.detailRow}>
                 <View style={styles.detailLeft}>
                  <FileText size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.detailLabel}>Terms of Service</Text>
                </View>
                <ExternalLink size={16} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </BlurView>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <LogOut size={20} color={theme.colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  signOutIcon: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.colors.accent },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  nameContainer: { alignItems: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary },
  email: { fontSize: 14, color: theme.colors.textSecondary },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 16, marginLeft: 4 },
  detailsCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailLabel: { fontSize: 16, color: theme.colors.textPrimary },
  detailValue: { fontSize: 14, color: theme.colors.textSecondary, maxWidth: '50%' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 48 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 16, gap: 8, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  signOutText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.danger },
  versionText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, opacity: 0.5 },
});
