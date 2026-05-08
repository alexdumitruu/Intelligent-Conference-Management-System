import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiClient from '../api/client';
import { deleteToken } from '../utils/storage';
import type {
  Conference,
  Paper,
  PaperStatus,
  RootStackParamList,
  User,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// ── Status badge colour map ────────────────────────────────
const STATUS_THEME: Record<string, { bg: string; fg: string; label: string }> = {
  DRAFT:        { bg: '#F3F4F6', fg: '#6B7280', label: 'Draft' },
  SUBMITTED:    { bg: '#EFF6FF', fg: '#0055FF', label: 'Submitted' },
  BIDDING:      { bg: '#EFF6FF', fg: '#0055FF', label: 'Bidding' },
  UNDER_REVIEW: { bg: '#F5F3FF', fg: '#7C3AED', label: 'Under Review' },
  DISCUSSION:   { bg: '#FFFBEB', fg: '#D97706', label: 'Discussion' },
  ACCEPTED:     { bg: '#ECFDF5', fg: '#059669', label: 'Accepted' },
  REJECTED:     { bg: '#FEF2F2', fg: '#DC2626', label: 'Rejected' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardScreen({ navigation }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch all author data ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError('');

      // 1. Get user profile
      const { data: profile } = await apiClient.get<User>('/users/profile');
      setUser(profile);

      // 2. Get all conferences
      const { data: confs } = await apiClient.get<Conference[]>('/conferences');
      setConferences(confs);

      // 3. For each conference, fetch the author's papers
      const allPapers: Paper[] = [];
      for (const conf of confs) {
        try {
          const { data: confPapers } = await apiClient.get<Paper[]>(
            `/conferences/${conf.id}/papers/mine`,
          );
          // Tag each paper with conference info for display
          allPapers.push(...confPapers);
        } catch {
          // Author may not have papers in every conference — skip silently
        }
      }
      setPapers(allPapers);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await deleteToken();
        navigation.replace('Login');
        return;
      }
      setError('Failed to load data. Pull to retry.');
    }
  }, [navigation]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    })();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await deleteToken();
    navigation.replace('Login');
  };

  // ── Helper: resolve conference title from conferenceId ────
  const getConferenceTitle = (conferenceId: number): string => {
    const conf = conferences.find((c) => c.id === conferenceId);
    return conf?.title ?? `Conference #${conferenceId}`;
  };

  // ── Render a single paper card ────────────────────────────
  const renderPaper = ({ item }: { item: Paper }) => {
    const theme = STATUS_THEME[item.status] ?? STATUS_THEME.DRAFT;

    return (
      <View style={styles.card}>
        {/* Conference label */}
        <Text style={styles.confLabel} numberOfLines={1}>
          {getConferenceTitle(item.conferenceId)}
        </Text>

        {/* Title */}
        <Text style={styles.paperTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Status badge + date row */}
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: theme.bg }]}>
            <Text style={[styles.badgeText, { color: theme.fg }]}>
              {theme.label}
            </Text>
          </View>

          <Text style={styles.date}>
            {formatDate(item.updatedAt)}
          </Text>
        </View>
      </View>
    );
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0055FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top bar ──────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            {user ? `${user.firstName} ${user.lastName}` : 'Author'}
          </Text>
          <Text style={styles.role}>Author Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logout}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Papers list ──────────────────────────── */}
      {error !== '' ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={papers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPaper}
          contentContainerStyle={
            papers.length === 0 ? styles.emptyContainer : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0055FF"
              colors={['#0055FF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No Papers Yet</Text>
              <Text style={styles.emptyBody}>
                Papers you submit to conferences will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Styles: Editorial Minimalist ───────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  role: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logout: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── List ──
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    // ABSOLUTELY NO SHADOWS
    elevation: 0,
    shadowOpacity: 0,
  },
  confLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // ── Empty state ──
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Error ──
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
});
