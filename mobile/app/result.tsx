import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Share, Animated, Dimensions, Alert,
  TextInput, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, G, Polygon, Text as SvgText } from 'react-native-svg';
import { API_BASE } from '../constants/api';
import type { ScanResult, DoctorSuggestion } from '../types/scan';

const { width: W } = Dimensions.get('window');

const RISK_THEME = {
  Low:      { bg: '#F0FDF4', text: '#15803D', bar: '#22C55E' },
  Medium:   { bg: '#FFFBEB', text: '#B45309', bar: '#F59E0B' },
  High:     { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  Critical: { bg: '#FEF2F2', text: '#B91C1C', bar: '#EF4444' },
} as const;
type RK = keyof typeof RISK_THEME;

const BAR_COLORS: Record<string, string> = {
  melanoma:     '#EF4444',
  non_melanoma: '#F97316',
  acne:         '#F59E0B',
  healthy:      '#10B981',
  // legacy keys
  mole:         '#EF4444',
  non_mole:     '#F97316',
  pimple:       '#F59E0B',
};

// ── Fade-in wrapper ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: object;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ── SVG Risk Gauge ───────────────────────────────────────────────────────────
function RiskGauge({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const arcTotal = 251;
  const arcLen   = (pct / 100) * arcTotal;
  const needleAngle = (pct / 100) * 180 - 90;
  return (
    <Svg viewBox="0 0 200 120" width={200} height={120}>
      <Path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round" />
      <Path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${arcTotal + 2}`} />
      <G rotation={needleAngle} origin="100, 100">
        <Line x1="100" y1="100" x2="100" y2="32" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      </G>
      <Circle cx="100" cy="100" r="7" fill="#0F172A" />
      <Circle cx="100" cy="100" r="4" fill="white" />
      <SvgText x="16"  y="116" textAnchor="middle" fontSize="9" fill="#94A3B8">0</SvgText>
      <SvgText x="100" y="18"  textAnchor="middle" fontSize="9" fill="#94A3B8">50</SvgText>
      <SvgText x="184" y="116" textAnchor="middle" fontSize="9" fill="#94A3B8">100</SvgText>
    </Svg>
  );
}

// ── SVG ABCDE Radar ──────────────────────────────────────────────────────────
function ABCDERadar({ scores }: { scores: Record<string, number> }) {
  const KEYS   = ['asymmetry', 'border', 'color', 'diameter', 'evolution'];
  const LABELS = ['Asym', 'Border', 'Color', 'Diam', 'Evol'];
  const CX = 85, CY = 85, R = 62;
  const ANGLES = [0, 1, 2, 3, 4].map(i => ((i * 72 - 90) * Math.PI) / 180);
  const gridPts = (f: number) =>
    ANGLES.map(a => `${(CX + Math.cos(a) * R * f).toFixed(1)},${(CY + Math.sin(a) * R * f).toFixed(1)}`).join(' ');
  const dataPts = KEYS.map((k, i) => {
    const v = Math.min(10, Math.max(0, scores[k] ?? 5));
    return { x: CX + Math.cos(ANGLES[i]) * (v / 10) * R, y: CY + Math.sin(ANGLES[i]) * (v / 10) * R };
  });
  const dataStr   = dataPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const labelPos  = ANGLES.map((a, i) => ({
    x: CX + Math.cos(a) * (R + 16), y: CY + Math.sin(a) * (R + 16), label: LABELS[i],
  }));
  return (
    <Svg viewBox="0 0 170 170" width={170} height={170}>
      {[0.25, 0.5, 0.75, 1.0].map((f, gi) => (
        <Polygon key={gi} points={gridPts(f)} fill="none" stroke="#E2E8F0" strokeWidth="1" />
      ))}
      {ANGLES.map((a, ai) => (
        <Line key={ai} x1={CX} y1={CY}
          x2={(CX + Math.cos(a) * R).toFixed(1)} y2={(CY + Math.sin(a) * R).toFixed(1)}
          stroke="#CBD5E1" strokeWidth="1" />
      ))}
      <Polygon points={dataStr} fill="rgba(37,99,235,0.18)" stroke="#2563EB" strokeWidth="2" />
      {dataPts.map((p, di) => (
        <Circle key={di} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#2563EB" />
      ))}
      {labelPos.map((lp, li) => (
        <SvgText key={li} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
          textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="600">
          {lp.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ── Animated classification bar ──────────────────────────────────────────────
function ClassBar({ label, value, color, delay }: {
  label: string; value: number; color: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 700, delay, useNativeDriver: false }).start();
  }, []);
  const animW = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <View style={cb.row}>
      <Text style={cb.label}>{displayLabel}</Text>
      <View style={cb.track}>
        <Animated.View style={[cb.fill, { width: animW, backgroundColor: color }]} />
      </View>
      <Text style={cb.val}>{value.toFixed(1)}%</Text>
    </View>
  );
}
const cb = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  label: { width: 90, fontSize: 11, fontWeight: '600', color: '#64748B' },
  track: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 8 },
  val:   { width: 40, fontSize: 11, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
});

// ── Collapsible Section ──────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={sc.wrap}>
      <TouchableOpacity style={sc.header} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={sc.titleRow}>
          <Ionicons name={icon as any} size={15} color="#2563EB" />
          <Text style={sc.title}>{title}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
      </TouchableOpacity>
      {open && <View style={sc.body}>{children}</View>}
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:     { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:    { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  body:     { paddingHorizontal: 16, paddingBottom: 16 },
});

// ── Demo Mode Banner ────────────────────────────────────────────────────────
function DemoModeBanner() {
  return (
    <View style={dm.wrap}>
      <Ionicons name="flask" size={16} color="#92400E" />
      <View style={{ flex: 1 }}>
        <Text style={dm.title}>Demo Mode — Results Not Real</Text>
        <Text style={dm.sub}>
          No trained model loaded. Results are simulated.{'\n'}
          Train with your own images for accurate detection.
        </Text>
      </View>
    </View>
  );
}
const dm = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginBottom: 10, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#FCD34D' },
  title: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  sub:   { fontSize: 11, color: '#B45309', lineHeight: 16 },
});

// ── Doctor Suggestion Card ───────────────────────────────────────────────────
function DoctorSuggestionCard({ suggestion }: { suggestion: DoctorSuggestion }) {
  if (!suggestion || suggestion.urgency_level === 'NONE') return null;

  const isUrgent = suggestion.urgency_level === 'URGENT';
  const isHigh   = suggestion.urgency_level === 'HIGH';
  const isMod    = suggestion.urgency_level === 'MODERATE';
  const isLow    = suggestion.urgency_level === 'LOW';

  const bgColors: [string, string] = isUrgent
    ? ['#FEF2F2', '#FFF5F5']
    : isHigh
    ? ['#FFF7ED', '#FFFBEB']
    : isMod
    ? ['#FFFBEB', '#FFF7ED']
    : ['#EFF6FF', '#F0FDFA'];

  const headerLabel = isUrgent
    ? '🚨  URGENT — See Doctor Today'
    : isHigh
    ? '⚠️  See Doctor This Week'
    : isMod
    ? '⚡  Doctor Recommended'
    : '💊  Optional Consultation';

  return (
    <View style={ds.wrap}>
      <LinearGradient colors={bgColors} style={ds.grad}>
        {/* Header row */}
        <View style={[ds.headerRow, { borderLeftColor: suggestion.color }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ds.headerLabel, { color: suggestion.color }]}>{headerLabel}</Text>
            {suggestion.stage ? (
              <View style={[ds.stagePill, { backgroundColor: suggestion.color + '22' }]}>
                <Text style={[ds.stageText, { color: suggestion.color }]}>
                  {suggestion.stage === 'Advanced' ? '🔴' : suggestion.stage === 'Moderate' ? '🟠' : '🟡'}
                  {'  Stage: ' + suggestion.stage}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Message */}
        <Text style={ds.message}>{suggestion.message}</Text>

        {/* Doctor type */}
        {suggestion.doctor_type ? (
          <View style={ds.infoRow}>
            <View style={[ds.iconCircle, { backgroundColor: suggestion.color + '20' }]}>
              <Ionicons name="medical" size={14} color={suggestion.color} />
            </View>
            <View>
              <Text style={ds.infoLabel}>Consult</Text>
              <Text style={[ds.infoValue, { color: suggestion.color }]}>{suggestion.doctor_type}</Text>
            </View>
          </View>
        ) : null}

        {/* Department */}
        {suggestion.department ? (
          <View style={ds.infoRow}>
            <View style={[ds.iconCircle, { backgroundColor: '#64748B20' }]}>
              <Ionicons name="business" size={14} color="#64748B" />
            </View>
            <View>
              <Text style={ds.infoLabel}>Department</Text>
              <Text style={ds.infoValue}>{suggestion.department}</Text>
            </View>
          </View>
        ) : null}

        {/* Timeline */}
        {suggestion.timeline ? (
          <View style={ds.infoRow}>
            <View style={[ds.iconCircle, { backgroundColor: '#64748B20' }]}>
              <Ionicons name="time" size={14} color="#64748B" />
            </View>
            <View>
              <Text style={ds.infoLabel}>Timeline</Text>
              <Text style={ds.infoValue}>{suggestion.timeline}</Text>
            </View>
          </View>
        ) : null}

        {/* Find doctor button */}
        {suggestion.search_query ? (
          <TouchableOpacity
            style={[ds.findBtn, { backgroundColor: suggestion.color }]}
            activeOpacity={0.85}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/${encodeURIComponent(suggestion.search_query!)}`
              )
            }
          >
            <Ionicons name="location" size={15} color="white" />
            <Text style={ds.findBtnTxt}>{suggestion.action ?? 'Find Near Me'}</Text>
          </TouchableOpacity>
        ) : null}
      </LinearGradient>
    </View>
  );
}
const ds = StyleSheet.create({
  wrap:       { marginHorizontal: 16, marginBottom: 10, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  grad:       { padding: 18 },
  headerRow:  { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 12 },
  headerLabel:{ fontSize: 14, fontWeight: '800', marginBottom: 6 },
  stagePill:  { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageText:  { fontSize: 12, fontWeight: '700' },
  message:    { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 14 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  infoLabel:  { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:  { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  findBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, marginTop: 4 },
  findBtnTxt: { color: 'white', fontSize: 14, fontWeight: '700' },
});

// ── Result Screen ─────────────────────────────────────────────────────────────
export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const scan = JSON.parse(data ?? '{}') as Partial<ScanResult>;

  const riskKey = (scan.risk_level && scan.risk_level in RISK_THEME
    ? scan.risk_level : 'Low') as RK;
  const t        = RISK_THEME[riskKey];
  const riskPct  = Math.min(100, Math.max(0, scan.risk_score ?? 0));
  const isHighRisk = riskKey === 'High' || riskKey === 'Critical';

  // Show ABCDE for melanoma + non_melanoma (any suspicious skin lesion)
  const showABCDE = scan.class_name === 'melanoma'
    || scan.class_name === 'non_melanoma'
    || (scan.class_name as string) === 'mole';   // legacy class name from older scans

  const docSuggestion  = scan.doctor_suggestion as DoctorSuggestion | undefined;
  const isDemoMode     = scan.is_demo_mode === true;

  const [gradcamUri,  setGradcamUri]  = useState<string | null>(null);
  const [gradcamLoading, setGradcamLoading] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [docMessage,  setDocMessage]  = useState('');
  const [shareLink,   setShareLink]   = useState('');
  const [sharing,     setSharing]     = useState(false);

  const loadGradcam = async () => {
    if (!scan.id || gradcamUri) return;
    setGradcamLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gradcam/${scan.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        setGradcamUri(url);
      }
    } catch {
      // Grad-CAM unavailable in demo mode — silently ignore
    } finally {
      setGradcamLoading(false);
    }
  };

  const handleQuickShare = async () => {
    await Share.share({
      message: `SkinVision AI: ${scan.label ?? 'Unknown'} — ${scan.confidence ?? 0}% confidence\nRisk: ${scan.risk_level ?? 'N/A'}\n\n${scan.advice ?? ''}`,
      title: 'My SkinVision Report',
    });
  };

  const handleTeleDerm = async () => {
    if (!scan.id) { Alert.alert('Error', 'Scan ID not found.'); return; }
    setSharing(true);
    try {
      const fd = new FormData();
      fd.append('scan_id',      String(scan.id));
      fd.append('doctor_email', doctorEmail);
      fd.append('message',      docMessage);
      const res = await fetch(`${API_BASE}/api/consultations`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const resp = await res.json();
      const link = `${API_BASE}/api/shared/${resp.share_token}`;
      setShareLink(link);
      await Share.share({ message: `SkinVision Doctor Report:\n${link}`, title: 'Share with Doctor' });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create consultation.');
    } finally {
      setSharing(false);
    }
  };

  const classBars = scan.all_probabilities
    ? Object.entries(scan.all_probabilities as Record<string, number>).sort((a, b) => b[1] - a[1])
    : [];

  const IMG_H = (W - 32) * 0.65;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.hTitle}>Analysis Result</Text>
        <TouchableOpacity onPress={() => void handleQuickShare()} style={s.hBtn}>
          <Ionicons name="share-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Scan Image ── */}
      <FadeIn delay={0} style={[s.imgWrap, { height: IMG_H }]}>
        {scan.image_url ? (
          <Image source={{ uri: `${API_BASE}${scan.image_url}` }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={[s.img, s.imgPlaceholder]}>
            <Ionicons name="image-outline" size={44} color="#CBD5E1" />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={s.imgGrad}>
          <View style={[s.riskBadge, { backgroundColor: t.bar }]}>
            <Text style={s.riskBadgeTxt}>{scan.emoji ?? '●'}  {scan.risk_level ?? 'N/A'} Risk</Text>
          </View>
        </LinearGradient>
      </FadeIn>

      {/* ── Summary card ── */}
      <FadeIn delay={80} style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.bigEmoji}>{scan.emoji ?? '●'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.diagLabel}>{scan.label ?? 'Unknown'}</Text>
            <Text style={s.diagConf}>{scan.confidence ?? 0}% confidence</Text>
            {scan.body_location ? <Text style={s.diagMeta}>{scan.body_location}</Text> : null}
          </View>
          <View style={[s.urgencyBadge, { backgroundColor: t.bg }]}>
            <Text style={[s.urgencyTxt, { color: t.text }]}>{scan.urgency ?? ''}</Text>
          </View>
        </View>
      </FadeIn>

      {/* ── Demo Mode Warning ── */}
      {isDemoMode && (
        <FadeIn delay={100}>
          <DemoModeBanner />
        </FadeIn>
      )}

      {/* ── Doctor Suggestion Card (shown if suggestion exists) ── */}
      {!isDemoMode && docSuggestion && docSuggestion.urgency_level !== 'NONE' && (
        <FadeIn delay={120}>
          <DoctorSuggestionCard suggestion={docSuggestion} />
        </FadeIn>
      )}

      {/* ── Risk Gauge ── */}
      <FadeIn delay={160}>
        <Section title="Risk Assessment" icon="alert-circle">
          <View style={s.gaugeWrap}>
            <RiskGauge score={riskPct} color={t.bar} />
            <Text style={[s.gaugeLbl, { color: t.text }]}>{riskKey} Risk — {riskPct} / 100</Text>
          </View>
        </Section>
      </FadeIn>

      {/* ── Detection Breakdown ── */}
      {classBars.length > 0 && (
        <FadeIn delay={220}>
          <Section title="Detection Breakdown" icon="analytics">
            {classBars.map(([cls, prob], i) => (
              <ClassBar key={cls} label={cls} value={prob} color={BAR_COLORS[cls] ?? '#2563EB'} delay={i * 80} />
            ))}
          </Section>
        </FadeIn>
      )}

      {/* ── ABCDE Analysis (melanoma + non_melanoma) ── */}
      {showABCDE && scan.abcde_scores && (
        <FadeIn delay={280}>
          <Section title="ABCDE Dermoscopy Analysis" icon="body">
            <Text style={s.abcdeIntro}>
              ABCDE criteria help evaluate suspicious skin lesions for signs of melanoma.
              Scores above 6 indicate elevated concern.
            </Text>
            <View style={s.radarWrap}>
              <ABCDERadar scores={scan.abcde_scores as unknown as Record<string, number>} />
            </View>
            {(Object.entries(scan.abcde_scores as unknown as Record<string, number>)).map(([k, v]) => (
              <View key={k} style={s.abRow}>
                <Text style={s.abKey}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                <View style={s.abTrack}>
                  <View style={[s.abFill, {
                    width: `${Math.min(100, v * 10)}%` as any,
                    backgroundColor: v > 6 ? '#EF4444' : v > 3 ? '#F59E0B' : '#10B981',
                  }]} />
                </View>
                <Text style={[s.abVal, { color: v > 6 ? '#EF4444' : '#0F172A' }]}>{v.toFixed(1)}</Text>
              </View>
            ))}
            <Text style={s.abcdeNote}>Score / 10 — above 6 indicates elevated concern</Text>
          </Section>
        </FadeIn>
      )}

      {/* ── Grad-CAM Heatmap (Explainable AI) ── */}
      {!isDemoMode && scan.id && (
        <FadeIn delay={300}>
          <Section title="Explainable AI — Heatmap" icon="eye" defaultOpen={false}>
            <Text style={s.explainTxt}>
              Grad-CAM shows which region of the image influenced the AI prediction.
              Red/yellow = high concern area. Blue = low concern.
            </Text>
            {gradcamUri ? (
              <View style={gc.imgWrap}>
                <Image source={{ uri: gradcamUri }} style={gc.img} resizeMode="contain" />
                <View style={gc.legend}>
                  <Text style={gc.legendTxt}>Low concern</Text>
                  <View style={gc.legendBar} />
                  <Text style={gc.legendTxt}>High concern</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={gc.loadBtn}
                onPress={loadGradcam}
                disabled={gradcamLoading}
                activeOpacity={0.8}
              >
                <Ionicons name={gradcamLoading ? 'hourglass' : 'eye'} size={16} color="white" />
                <Text style={gc.loadBtnTxt}>
                  {gradcamLoading ? 'Generating heatmap…' : 'Show AI Heatmap'}
                </Text>
              </TouchableOpacity>
            )}
          </Section>
        </FadeIn>
      )}

      {/* ── AI Explanation ── */}
      <FadeIn delay={320}>
        <Section title="AI Explanation" icon="chatbubble-ellipses" defaultOpen={false}>
          <Text style={s.explainTxt}>{scan.explanation ?? ''}</Text>
          <View style={s.adviceBox}>
            <Ionicons name="medkit" size={14} color="#2563EB" />
            <Text style={s.adviceTxt}>{scan.advice ?? ''}</Text>
          </View>
        </Section>
      </FadeIn>

      {/* ── Share with Doctor ── */}
      <FadeIn delay={360}>
        <Section title="Share with Doctor (TeleDerm)" icon="videocam" defaultOpen={false}>
          <Text style={s.teleSubtitle}>
            Generate a secure link to share this report with a dermatologist.
          </Text>
          <TextInput
            style={s.input}
            placeholder="Doctor's email (optional)"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={doctorEmail}
            onChangeText={setDoctorEmail}
          />
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Message to doctor (optional)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={docMessage}
            onChangeText={setDocMessage}
          />
          {shareLink ? (
            <View style={s.linkBox}>
              <Ionicons name="link" size={14} color="#2563EB" />
              <Text style={s.linkTxt} numberOfLines={2}>{shareLink}</Text>
              <TouchableOpacity onPress={() => Share.share({ message: shareLink })}>
                <Ionicons name="copy-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity onPress={handleTeleDerm} disabled={sharing} activeOpacity={0.8}>
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.teleBtn}
            >
              <Ionicons name={sharing ? 'hourglass' : 'share-social'} size={16} color="white" />
              <Text style={s.teleBtnTxt}>{sharing ? 'Generating…' : 'Generate Share Link'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Section>
      </FadeIn>

      {/* ── CTA card ── */}
      <FadeIn delay={400} style={{ marginHorizontal: 16, marginBottom: 10 }}>
        <LinearGradient
          colors={isHighRisk ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.ctaCard}
        >
          <View style={s.ctaContent}>
            <Ionicons name={isHighRisk ? 'medical' : 'leaf'} size={28} color="white" />
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>
                {isHighRisk ? 'Professional Evaluation Needed' : 'Self Care Tips'}
              </Text>
              <Text style={s.ctaSub}>
                {isHighRisk
                  ? 'Your risk level requires professional medical evaluation.'
                  : 'Maintain healthy skin with daily care routines.'}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </View>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => {
              if (isHighRisk) {
                Linking.openURL('https://www.google.com/maps/search/dermatologist+near+me');
              } else {
                router.push('/(tabs)/more' as any);
              }
            }}
          >
            <Text style={s.ctaBtnTxt}>
              {isHighRisk ? 'Find Dermatologist Near Me' : 'View Self Care Guide'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </FadeIn>

      {/* ── New Scan ── */}
      <View style={s.footer}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.newScanBtn}
          >
            <Ionicons name="scan" size={17} color="white" />
            <Text style={s.newScanTxt}>New Scan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, gap: 8 },
  hBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  hTitle:       { flex: 1, fontSize: 16, fontWeight: '900', color: '#0F172A', textAlign: 'center' },

  imgWrap:      { marginHorizontal: 16, marginBottom: 10, borderRadius: 20, overflow: 'hidden' },
  img:          { width: '100%', height: '100%' },
  imgPlaceholder:{ backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  imgGrad:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 88, justifyContent: 'flex-end', padding: 14 },
  riskBadge:    { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  riskBadgeTxt: { color: 'white', fontWeight: '700', fontSize: 13 },

  summaryCard:  { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigEmoji:     { fontSize: 38 },
  diagLabel:    { fontSize: 16, fontWeight: '800', color: '#0F172A', flexWrap: 'wrap' },
  diagConf:     { fontSize: 13, color: '#64748B', marginTop: 2 },
  diagMeta:     { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  urgencyTxt:   { fontSize: 11, fontWeight: '700' },

  gaugeWrap:    { alignItems: 'center', paddingTop: 4, paddingBottom: 6 },
  gaugeLbl:     { fontSize: 15, fontWeight: '800', marginTop: 2 },

  abcdeIntro:   { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 12 },
  radarWrap:    { alignItems: 'center', paddingVertical: 4 },
  abRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  abKey:        { width: 74, fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  abTrack:      { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' },
  abFill:       { height: '100%', borderRadius: 8 },
  abVal:        { width: 28, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  abcdeNote:    { marginTop: 8, fontSize: 11, color: '#94A3B8', textAlign: 'center' },

  explainTxt:   { fontSize: 13, color: '#475569', lineHeight: 21 },
  adviceBox:    { flexDirection: 'row', gap: 8, marginTop: 12, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  adviceTxt:    { flex: 1, fontSize: 12, color: '#1D4ED8', lineHeight: 18 },

  teleSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 18 },
  input:        { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: '#0F172A', marginBottom: 10, backgroundColor: '#F8FAFC' },
  textArea:     { height: 80, textAlignVertical: 'top' },
  linkBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 10 },
  linkTxt:      { flex: 1, fontSize: 11, color: '#2563EB', fontWeight: '600' },
  teleBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14 },
  teleBtnTxt:   { color: 'white', fontSize: 14, fontWeight: '700' },

  ctaCard:      { borderRadius: 20, padding: 18, marginBottom: 10 },
  ctaContent:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  ctaTitle:     { fontSize: 15, fontWeight: '800', color: 'white', marginBottom: 3 },
  ctaSub:       { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
  ctaBtn:       { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaBtnTxt:    { color: 'white', fontSize: 14, fontWeight: '700' },

  footer:       { marginHorizontal: 16, marginTop: 4 },
  newScanBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  newScanTxt:   { color: 'white', fontSize: 15, fontWeight: '700' },
});

const gc = StyleSheet.create({
  imgWrap:   { marginTop: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A' },
  img:       { width: '100%', height: 220 },
  legend:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  legendBar: { flex: 1, height: 8, marginHorizontal: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  legendTxt: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  loadBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingVertical: 13, borderRadius: 12, backgroundColor: '#1E293B' },
  loadBtnTxt:{ color: 'white', fontSize: 13, fontWeight: '700' },
});
