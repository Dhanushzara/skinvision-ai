import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../constants/api';
import type { ScanResult } from '../types/scan';

const { width: W } = Dimensions.get('window');

const RISK_THEME = {
  Low:      { bg: '#F0FDF4', text: '#15803D', bar: '#22C55E' },
  Medium:   { bg: '#FFFBEB', text: '#B45309', bar: '#F59E0B' },
  High:     { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  Critical: { bg: '#FEF2F2', text: '#B91C1C', bar: '#EF4444' },
} as const;
type RK = keyof typeof RISK_THEME;

function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: object }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const scan = (JSON.parse(data ?? '{}') as Partial<ScanResult>);

  const riskKey = (scan.risk_level && scan.risk_level in RISK_THEME ? scan.risk_level : 'Low') as RK;
  const t = RISK_THEME[riskKey];
  const riskPct = Math.min(100, Math.max(0, scan.risk_score ?? 0));

  const handleShare = async () => {
    await Share.share({
      message: `SkinVision AI: ${scan.label ?? 'Unknown'} — ${scan.confidence ?? 0}% confidence. Risk: ${scan.risk_level ?? 'N/A'}.\n\n${scan.advice ?? ''}`,
      title: 'My SkinVision Scan',
    });
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.hTitle}>Analysis Result</Text>
        <TouchableOpacity onPress={() => void handleShare()} style={s.hBtn}>
          <Ionicons name="share-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Scan image */}
      <FadeIn delay={0} style={s.imgWrap}>
        {scan.image_url ? (
          <Image source={{ uri: `${API_BASE}${scan.image_url}` }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={[s.img, s.imgPlaceholder]}>
            <Ionicons name="image-outline" size={44} color="#CBD5E1" />
          </View>
        )}
        <View style={[s.imgBadge, { backgroundColor: scan.color ?? '#64748B' }]}>
          <Text style={s.imgBadgeTxt}>{scan.emoji ?? '●'} {scan.risk_level ?? 'N/A'}</Text>
        </View>
      </FadeIn>

      {/* Main result */}
      <FadeIn delay={80} style={s.card}>
        <View style={s.resultRow}>
          <Text style={s.emoji}>{scan.emoji ?? '●'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{scan.label ?? 'Unknown'}</Text>
            <Text style={s.conf}>{scan.confidence ?? 0}% confidence</Text>
            {scan.body_location ? <Text style={s.meta}>{scan.body_location}</Text> : null}
          </View>
        </View>
        <Text style={s.explanation}>{scan.explanation ?? ''}</Text>
      </FadeIn>

      {/* Risk gauge */}
      <FadeIn delay={140} style={[s.card, { backgroundColor: t.bg }]}>
        <View style={s.riskRow}>
          <Text style={s.riskTitle}>Risk Assessment</Text>
          <Text style={[s.riskLevel, { color: t.text }]}>{scan.risk_level ?? 'N/A'}</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${riskPct}%`, backgroundColor: t.bar }]} />
        </View>
        <Text style={[s.riskScore, { color: t.text }]}>{scan.risk_score ?? 0} / 100</Text>
      </FadeIn>

      {/* ABCDE — moles only */}
      {scan.class_name === 'mole' && scan.abcde_scores && (
        <FadeIn delay={200} style={s.card}>
          <Text style={s.cardTitle}>ABCDE Analysis</Text>
          {(Object.entries(scan.abcde_scores) as [string, number][]).map(([k, v]) => (
            <View key={k} style={s.abcdeRow}>
              <Text style={s.abcdeKey}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.min(100, v * 10)}%`, backgroundColor: v > 6 ? '#EF4444' : '#2563EB' }]} />
              </View>
              <Text style={s.abcdeVal}>{v.toFixed(1)}/10</Text>
            </View>
          ))}
        </FadeIn>
      )}

      {/* Probabilities */}
      {scan.all_probabilities && Object.keys(scan.all_probabilities).length > 0 && (
        <FadeIn delay={250} style={s.card}>
          <Text style={s.cardTitle}>Classification Breakdown</Text>
          {(Object.entries(scan.all_probabilities) as [string, number][]).map(([cls, p]) => (
            <View key={cls} style={s.abcdeRow}>
              <Text style={s.probLabel}>{cls.replace('_', ' ').toUpperCase()}</Text>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.min(100, p)}%`, backgroundColor: '#2563EB' }]} />
              </View>
              <Text style={s.abcdeVal}>{p.toFixed(1)}%</Text>
            </View>
          ))}
        </FadeIn>
      )}

      {/* Advice */}
      <FadeIn delay={300} style={[s.card, { backgroundColor: '#EFF6FF' }]}>
        <View style={s.adviceRow}>
          <Ionicons name="medkit" size={16} color="#2563EB" />
          <Text style={s.adviceTitle}>Medical Guidance</Text>
        </View>
        <Text style={s.adviceTxt}>{scan.advice ?? ''}</Text>
      </FadeIn>

      {/* New scan */}
      <View style={s.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <LinearGradient
            colors={['#2563EB', '#0D9488']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.newScanBtn}
          >
            <Ionicons name="scan" size={17} color="white" />
            <Text style={s.newScanTxt}>New Scan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const IMG = W - 32;

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 52, paddingBottom: 14, gap: 10 },
  hBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  hTitle:       { flex: 1, fontSize: 16, fontWeight: '900', color: '#0F172A', textAlign: 'center' },

  imgWrap:      { marginHorizontal: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  img:          { width: IMG, height: IMG },
  imgPlaceholder:{ backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  imgBadge:     { position: 'absolute', bottom: 14, right: 14, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  imgBadgeTxt:  { color: 'white', fontWeight: '700', fontSize: 13 },

  card:         { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  resultRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  emoji:        { fontSize: 36 },
  label:        { fontSize: W < 375 ? 15 : 17, fontWeight: '700', color: '#0F172A' },
  conf:         { fontSize: 13, color: '#64748B', marginTop: 2 },
  meta:         { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  explanation:  { fontSize: 12, color: '#64748B', lineHeight: 19 },

  riskRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riskTitle:    { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  riskLevel:    { fontSize: 13, fontWeight: '900' },
  track:        { flex: 1, height: 9, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 9, overflow: 'hidden', marginBottom: 5 },
  fill:         { height: '100%', borderRadius: 9 },
  riskScore:    { fontSize: 12, fontWeight: '600', textAlign: 'right' },

  cardTitle:    { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  abcdeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  abcdeKey:     { width: 70, fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'capitalize' },
  abcdeVal:     { width: 36, fontSize: 11, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  probLabel:    { width: 76, fontSize: 10, fontWeight: '700', color: '#64748B' },

  adviceRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  adviceTitle:  { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  adviceTxt:    { fontSize: 12, color: '#3730A3', lineHeight: 19 },

  footer:       { marginHorizontal: 16, marginTop: 4 },
  newScanBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  newScanTxt:   { color: 'white', fontSize: 15, fontWeight: '700' },
});
