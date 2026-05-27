import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../constants/api';
import { getCachedScans, cacheScans } from '../../utils/storage';
import type { ScanResult } from '../../types/scan';

const { width: W } = Dimensions.get('window');

const RISK_COLORS: Record<string, string> = {
  Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Critical: '#EF4444',
};

export default function HistoryScreen() {
  const router = useRouter();

  const { data: scans = [], isLoading, refetch, isRefetching } = useQuery<ScanResult[]>({
    queryKey: ['scans'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/scans`);
        if (!res.ok) throw new Error('Network error');
        const data = (await res.json()) as ScanResult[];
        await cacheScans(data);
        return data;
      } catch {
        return getCachedScans();
      }
    },
    staleTime: 10_000,
  });

  const renderItem = ({ item }: { item: ScanResult }) => (
    <TouchableOpacity
      style={s.item}
      onPress={() => router.push({ pathname: '/result', params: { data: JSON.stringify(item) } })}
      activeOpacity={0.75}
    >
      <Image source={{ uri: `${API_BASE}${item.image_url}` }} style={s.thumb} />
      <View style={s.info}>
        <Text style={s.itemResult} numberOfLines={1}>{item.label ?? item.result ?? 'Unknown'}</Text>
        <Text style={s.itemConf}>{item.confidence ?? 0}% confidence</Text>
        {item.body_location ? (
          <Text style={s.itemMeta}>{item.body_location}</Text>
        ) : null}
        <Text style={s.itemMeta}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
      <View style={[s.chip, { backgroundColor: RISK_COLORS[item.risk_level] ?? '#94A3B8' }]}>
        <Text style={s.chipTxt}>{item.risk_level}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <LinearGradient colors={['#EFF6FF', '#F8FAFC']} style={s.header}>
        <Text style={s.headerTitle}>Scan History</Text>
        <Text style={s.headerSub}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {isLoading ? (
        <View style={s.empty}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.emptyTitle}>Loading…</Text>
        </View>
      ) : scans.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="scan-outline" size={52} color="#CBD5E1" />
          <Text style={s.emptyTitle}>No scans yet</Text>
          <Text style={s.emptySub}>Upload your first skin photo to get started</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#2563EB" />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header:    { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 18 },
  headerTitle:{ fontSize: W < 375 ? 22 : 24, fontWeight: '900', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  list: { padding: 16, gap: 10 },
  item: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 16,
    padding: 12, gap: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  thumb:     { width: W * 0.17, height: W * 0.17, borderRadius: 12 },
  info:      { flex: 1 },
  itemResult:{ fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemConf:  { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemMeta:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  chip:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  chipTxt:   { color: 'white', fontSize: 11, fontWeight: '700' },

  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: '#64748B' },
  emptySub:  { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
