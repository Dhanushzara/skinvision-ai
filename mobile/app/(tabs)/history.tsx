import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../../constants/api';
import { getCachedScans, cacheScans } from '../../utils/storage';
import type { ScanResult } from '../../types/scan';

const { width: W } = Dimensions.get('window');

const RISK_COLORS: Record<string, [string, string]> = {
  Low:      ['#10B981', '#059669'],
  Medium:   ['#F59E0B', '#D97706'],
  High:     ['#F97316', '#EA580C'],
  Critical: ['#EF4444', '#DC2626'],
};

const RISK_BG: Record<string, string> = {
  Low: '#F0FDF4', Medium: '#FFFBEB', High: '#FFF7ED', Critical: '#FEF2F2',
};

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <View style={e.wrap}>
      <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={e.iconCircle}>
        <Ionicons name="scan" size={40} color="#2563EB" />
      </LinearGradient>
      <Text style={e.title}>No Scans Yet</Text>
      <Text style={e.sub}>
        Upload or take a photo of your skin to get your first AI-powered analysis report.
      </Text>
      <TouchableOpacity onPress={onScan} activeOpacity={0.85}>
        <LinearGradient colors={['#2563EB', '#0D9488']} style={e.btn}>
          <Ionicons name="camera" size={16} color="white" />
          <Text style={e.btnTxt}>Start First Scan</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Tips */}
      <View style={e.tipsCard}>
        <Text style={e.tipsTitle}>📸 Scan Tips</Text>
        {[
          'Use good lighting — natural daylight is best',
          'Keep the camera steady, 10–15 cm from skin',
          'Fill the frame with the area of concern',
          'Clean the skin before scanning for accuracy',
        ].map((tip, i) => (
          <View key={i} style={e.tipRow}>
            <View style={e.tipDot} />
            <Text style={e.tipTxt}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  wrap:       { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  iconCircle: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  sub:        { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  btnTxt:     { color: 'white', fontWeight: '800', fontSize: 15 },
  tipsCard:   { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 18, padding: 16, marginTop: 28, borderWidth: 1, borderColor: '#E2E8F0' },
  tipsTitle:  { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  tipRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', marginTop: 5 },
  tipTxt:     { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 17 },
});

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

  const renderItem = ({ item, index }: { item: ScanResult; index: number }) => {
    const risk = item.risk_level ?? 'Low';
    const colors = RISK_COLORS[risk] ?? ['#94A3B8', '#64748B'];
    const bg = RISK_BG[risk] ?? '#F8FAFC';
    return (
      <TouchableOpacity
        style={[s.item, { borderLeftColor: colors[0], backgroundColor: 'white' }]}
        onPress={() => router.push({ pathname: '/result', params: { data: JSON.stringify(item) } })}
        activeOpacity={0.78}
      >
        {/* Thumbnail */}
        <View style={s.thumbWrap}>
          <Image source={{ uri: `${API_BASE}${item.image_url}` }} style={s.thumb} />
          <View style={[s.indexBadge, { backgroundColor: colors[0] }]}>
            <Text style={s.indexTxt}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.itemResult} numberOfLines={1}>
            {item.label ?? item.result ?? 'Unknown'}
          </Text>
          <View style={s.confRow}>
            <View style={s.confBar}>
              <View style={[s.confFill, { width: `${item.confidence ?? 0}%` as any, backgroundColor: colors[0] }]} />
            </View>
            <Text style={s.confTxt}>{item.confidence ?? 0}%</Text>
          </View>
          <View style={s.metaRow}>
            {item.body_location ? (
              <View style={s.metaChip}>
                <Ionicons name="body-outline" size={10} color="#64748B" />
                <Text style={s.metaChipTxt}>{item.body_location}</Text>
              </View>
            ) : null}
            <Text style={s.dateTxt}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
            </Text>
          </View>
        </View>

        {/* Risk badge */}
        <LinearGradient colors={colors} style={s.riskBadge}>
          <Text style={s.riskTxt}>{risk}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.header}>
        <Text style={s.headerTitle}>Scan History</Text>
        <Text style={s.headerSub}>
          {scans.length > 0
            ? `${scans.length} scan${scans.length !== 1 ? 's' : ''} · Tap any to view full report`
            : 'Your scan reports will appear here'}
        </Text>
        {scans.length > 0 && (
          <View style={s.summaryRow}>
            {(['Low', 'Medium', 'High', 'Critical'] as const).map(r => {
              const count = scans.filter((sc: ScanResult) => sc.risk_level === r).length;
              const colors = RISK_COLORS[r];
              return (
                <View key={r} style={s.summaryChip}>
                  <View style={[s.summaryDot, { backgroundColor: colors[0] }]} />
                  <Text style={s.summaryTxt}>{r}: {count}</Text>
                </View>
              );
            })}
          </View>
        )}
      </LinearGradient>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.loadingTxt}>Loading your scans…</Text>
        </View>
      ) : scans.length === 0 ? (
        <EmptyState onScan={() => router.push('/')} />
      ) : (
        <FlatList
          data={scans}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F1F5F9' },

  header:       { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 22 },
  headerTitle:  { fontSize: W < 375 ? 22 : 24, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.3 },
  headerSub:    { fontSize: 13, color: '#94A3B8', marginTop: 3, lineHeight: 18 },
  summaryRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  summaryChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  summaryDot:   { width: 7, height: 7, borderRadius: 4 },
  summaryTxt:   { fontSize: 11, color: '#CBD5E1', fontWeight: '600' },

  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:   { fontSize: 14, color: '#64748B', fontWeight: '500' },

  list:         { padding: 14, gap: 10, paddingBottom: 32 },
  item:         {
    flexDirection: 'row', borderRadius: 18, padding: 12, gap: 12, alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  thumbWrap:    { position: 'relative' },
  thumb:        { width: W * 0.18, height: W * 0.18, borderRadius: 12 },
  indexBadge:   { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  indexTxt:     { fontSize: 9, fontWeight: '900', color: 'white' },

  info:         { flex: 1 },
  itemResult:   { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  confRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  confBar:      { flex: 1, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  confFill:     { height: '100%', borderRadius: 2 },
  confTxt:      { fontSize: 11, fontWeight: '700', color: '#475569', width: 32 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metaChipTxt:  { fontSize: 10, color: '#64748B', fontWeight: '500' },
  dateTxt:      { fontSize: 10, color: '#94A3B8' },

  riskBadge:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  riskTxt:      { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
