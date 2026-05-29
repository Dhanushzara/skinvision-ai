import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Alert, ActivityIndicator, StyleSheet, Animated, Dimensions, Modal, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { API_BASE } from '../../constants/api';
import { cacheScan } from '../../utils/storage';
import { getUser, logout } from '../../utils/auth';
import type { ScanResult } from '../../types/scan';

const { width: W } = Dimensions.get('window');

const BODY_LOCATIONS = [
  'Face', 'Neck', 'Chest', 'Back',
  'Left Arm', 'Right Arm', 'Abdomen', 'Left Leg', 'Right Leg', 'Hand', 'Foot',
];

const BODY_PARTS = [
  { key: 'Face',      icon: 'happy-outline' as const,        label: 'Face',      hint: 'Forehead, cheeks, nose, chin' },
  { key: 'Scalp',     icon: 'person-outline' as const,       label: 'Scalp',     hint: 'Top of head, hairline' },
  { key: 'Neck',      icon: 'body-outline' as const,         label: 'Neck',      hint: 'Front & sides of neck' },
  { key: 'Chest',     icon: 'heart-outline' as const,        label: 'Chest',     hint: 'Front torso, breast area' },
  { key: 'Back',      icon: 'arrow-back-outline' as const,   label: 'Back',      hint: 'Upper & lower back' },
  { key: 'Left Arm',  icon: 'hand-left-outline' as const,    label: 'Left Arm',  hint: 'Shoulder to wrist' },
  { key: 'Right Arm', icon: 'hand-right-outline' as const,   label: 'Right Arm', hint: 'Shoulder to wrist' },
  { key: 'Hand',      icon: 'hand-left-outline' as const,    label: 'Hand',      hint: 'Palm, fingers, back of hand' },
  { key: 'Abdomen',   icon: 'fitness-outline' as const,      label: 'Abdomen',   hint: 'Stomach & sides' },
  { key: 'Left Leg',  icon: 'walk-outline' as const,         label: 'Left Leg',  hint: 'Thigh, knee, shin, calf' },
  { key: 'Right Leg', icon: 'walk-outline' as const,         label: 'Right Leg', hint: 'Thigh, knee, shin, calf' },
  { key: 'Foot',      icon: 'footsteps-outline' as const,    label: 'Foot',      hint: 'Sole, toes, ankle' },
];

const DETECTIONS = [
  {
    icon: 'body' as const,
    label: 'Melanoma\nDetection',
    desc: 'Moles & melanocytic lesions with ABCDE analysis',
    colors: ['#EF4444', '#DC2626'] as [string, string],
    bg: '#FEF2F2',
    border: '#FECACA',
    titleColor: '#991B1B',
  },
  {
    icon: 'bandage' as const,
    label: 'Skin Lesion\nAnalysis',
    desc: 'Keratosis, dermatofibroma & vascular lesions',
    colors: ['#F59E0B', '#D97706'] as [string, string],
    bg: '#FFFBEB',
    border: '#FDE68A',
    titleColor: '#92400E',
  },
  {
    icon: 'water' as const,
    label: 'Acne\nClassification',
    desc: 'Inflammatory & non-inflammatory acne types',
    colors: ['#F97316', '#EA580C'] as [string, string],
    bg: '#FFF7ED',
    border: '#FED7AA',
    titleColor: '#9A3412',
  },
  {
    icon: 'checkmark-circle' as const,
    label: 'Healthy Skin\nConfirmation',
    desc: 'No pathological finding — normal tissue confirmed',
    colors: ['#10B981', '#059669'] as [string, string],
    bg: '#F0FDF4',
    border: '#BBF7D0',
    titleColor: '#065F46',
  },
];

const STATS = [
  { value: '10K+', label: 'Scans Done' },
  { value: '95%',  label: 'Accuracy' },
  { value: '4',    label: 'Conditions' },
  { value: '<2s',  label: 'Speed' },
];

function FadeSlide({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: object;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ── Scan progress stages ────────────────────────────────────────────────────
const SCAN_STAGES = [
  { pct: 8,  label: 'Uploading image…',        icon: 'cloud-upload-outline'   },
  { pct: 22, label: 'Validating skin…',         icon: 'checkmark-circle-outline'},
  { pct: 40, label: 'Extracting features…',     icon: 'layers-outline'         },
  { pct: 58, label: 'Running AI model…',        icon: 'hardware-chip-outline'  },
  { pct: 74, label: 'Detecting conditions…',    icon: 'search-outline'         },
  { pct: 88, label: 'Calculating risk score…',  icon: 'stats-chart-outline'    },
  { pct: 96, label: 'Generating report…',       icon: 'document-text-outline'  },
];

function ScanProgressOverlay({ visible }: { visible: boolean }) {
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const barAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) { setProgress(0); setStageIdx(0); barAnim.setValue(0); return; }

    // Fade in overlay
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Progress animation — simulate stages
    let currentPct = 0;
    const timings = [400, 600, 700, 900, 700, 800, 500]; // ms per stage
    SCAN_STAGES.forEach((stage, i) => {
      const delay = timings.slice(0, i).reduce((a, b) => a + b, 0);
      setTimeout(() => {
        setStageIdx(i);
        const targetPct = stage.pct;
        const steps = targetPct - currentPct;
        for (let s = 1; s <= steps; s++) {
          setTimeout(() => {
            setProgress(prev => Math.min(prev + 1, targetPct));
            Animated.timing(barAnim, {
              toValue: targetPct / 100,
              duration: timings[i],
              useNativeDriver: false,
            }).start();
          }, (timings[i] / steps) * s);
        }
        currentPct = targetPct;
      }, delay);
    });
  }, [visible]);

  if (!visible) return null;
  const stage = SCAN_STAGES[stageIdx];
  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[sp.overlay, { opacity: fadeAnim }]}>
      <View style={sp.card}>
        {/* Pulsing icon */}
        <Animated.View style={[sp.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['#2563EB', '#0D9488']} style={sp.iconGrad}>
            <Ionicons name={stage.icon as any} size={36} color="white" />
          </LinearGradient>
        </Animated.View>

        <Text style={sp.title}>Analysing Skin</Text>
        <Text style={sp.subtitle}>{stage.label}</Text>

        {/* Progress bar */}
        <View style={sp.barTrack}>
          <Animated.View style={[sp.barFill, { width: barWidth }]} />
        </View>

        {/* Percentage */}
        <Text style={sp.pct}>{progress}%</Text>

        {/* Stage dots */}
        <View style={sp.dots}>
          {SCAN_STAGES.map((_, i) => (
            <View key={i} style={[sp.dot, i <= stageIdx && sp.dotActive]} />
          ))}
        </View>

        <Text style={sp.note}>Do not close the app</Text>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bodyLocation, setBodyLocation] = useState('');
  const [userName, setUserName] = useState('');
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [liveStats, setLiveStats] = useState({ total_scans: 0, accuracy: '…', conditions_count: 4, avg_speed: '<2s' });
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getUser().then(u => { if (u) setUserName(u.name.split(' ')[0]); });
    // Fetch real stats from backend
    fetch(`${API_BASE}/api/stats`)
      .then(r => r.json())
      .then(d => setLiveStats(d))
      .catch(() => {}); // silently keep defaults if backend offline
  }, []);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1.0, useNativeDriver: true }).start();

  const analyzeMutation = useMutation<ScanResult, Error, void>({
    mutationFn: async () => {
      if (!imageFile) throw new Error('No image selected');
      const form = new FormData();
      form.append('file', {
        uri: imageFile.uri,
        type: imageFile.mimeType ?? 'image/jpeg',
        name: imageFile.fileName ?? 'scan.jpg',
      } as unknown as Blob);
      if (bodyLocation) form.append('body_location', bodyLocation);

      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: form,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as {
          detail?: { code?: string; message?: string } | string;
        };
        const d = err.detail;
        if (d && typeof d === 'object' && d.code === 'INVALID_SKIN_IMAGE') {
          throw new Error(`No valid skin detected.\n\n${d.message}`);
        }
        throw new Error(typeof d === 'string' ? d : 'Analysis failed. Please try again.');
      }
      return res.json() as Promise<ScanResult>;
    },
    onSuccess: async (data) => {
      await cacheScan(data);
      router.push({ pathname: '/result', params: { data: JSON.stringify(data) } });
      setSelectedImage(null);
      setImageFile(null);
      setBodyLocation('');
    },
    onError: (e) => Alert.alert('Analysis Failed', e.message),
  });

  const pickImage = async (cam: boolean, presetPart?: string) => {
    if (cam) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access needed.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Gallery access needed.'); return; }
    }
    const res = cam
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1.0,                          // max quality
          allowsEditing: true,
          aspect: [1, 1],
          cameraType: ImagePicker.CameraType.back, // force back camera (higher resolution)
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1.0,
          allowsEditing: true,
          aspect: [1, 1],
        });
    if (!res.canceled && res.assets[0]) {
      setSelectedImage(res.assets[0].uri);
      setImageFile(res.assets[0]);
      if (presetPart) setBodyLocation(presetPart);
    }
  };

  const handleCameraPress = () => setShowBodyModal(true);

  const selectBodyAndScan = (partKey: string) => {
    // Set body location immediately, close modal
    setBodyLocation(partKey);
    setShowBodyModal(false);
    // On native: auto-open camera right away (no setTimeout — keeps user gesture alive)
    // On web: just close modal; body location is set; user taps Camera button again
    if (Platform.OS !== 'web') {
      void pickImage(true, partKey);
    }
  };

  const handleLogout = async () => {
    // Alert.alert callbacks are unreliable on React Native Web — use platform-safe confirm
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (!confirm('Sign out of SkinVision AI?')) return;
      await logout();
      router.replace('/login');
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: async () => { await logout(); router.replace('/login'); },
        },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Animated scan progress overlay */}
      <ScanProgressOverlay visible={analyzeMutation.isPending} />

    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Header ── */}
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.hero}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.brandRow}>
            <LinearGradient colors={['#2563EB', '#0D9488']} style={s.miniLogo}>
              <Ionicons name="shield-checkmark" size={14} color="white" />
            </LinearGradient>
            <Text style={s.brandName}>SkinVision AI</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <FadeSlide delay={0}>
          <View style={s.clinicalBadge}>
            <View style={s.clinicalDot} />
            <Text style={s.clinicalTxt}>CLINICAL AI ANALYSIS</Text>
          </View>
          <Text style={s.heroTitle}>
            {userName ? `Hello, ${userName}` + '\n' : ''}
            <Text style={s.heroAccent}>Intelligent Skin{'\n'}Analysis</Text>
          </Text>
          <Text style={s.heroSub}>
            Upload a photo for AI-powered skin condition detection
          </Text>
        </FadeSlide>

        {/* Stats row — real data from backend */}
        <FadeSlide delay={120} style={s.statsRow}>
          {[
            { value: liveStats.total_scans > 0 ? `${liveStats.total_scans.toLocaleString()}` : '—', label: 'Scans Done' },
            { value: liveStats.accuracy,            label: 'Accuracy'   },
            { value: String(liveStats.conditions_count), label: 'Conditions' },
            { value: liveStats.avg_speed,           label: 'Speed'      },
          ].map((st, i, arr) => (
            <View key={i} style={[s.statItem, i < arr.length - 1 && s.statDivider]}>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </FadeSlide>
      </LinearGradient>

      {/* ── Upload / Analyze Card ── */}
      <FadeSlide delay={200} style={s.uploadCard}>
        {!selectedImage ? (
          <View>
            {/* Drop zone */}
            <TouchableOpacity
              style={s.dropZone}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={s.dropInner}>
                <LinearGradient colors={['#2563EB', '#0D9488']} style={s.dropIcon}>
                  <Ionicons name="scan" size={28} color="white" />
                </LinearGradient>
                <Text style={s.dropTitle}>Upload Skin Image</Text>
                <Text style={s.dropSub}>JPG, PNG, WebP · Max 10 MB</Text>
                <Text style={s.dropNote}>Only real human skin is accepted</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnPrimary} onPress={() => pickImage(false)} activeOpacity={0.85}>
                <LinearGradient colors={['#2563EB', '#1D4ED8']} style={s.btnGrad}>
                  <Ionicons name="images" size={16} color="white" />
                  <Text style={s.btnPrimaryTxt}>From Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSecondary} onPress={handleCameraPress} activeOpacity={0.85}>
                <Ionicons name="camera" size={16} color="#2563EB" />
                <Text style={s.btnSecondaryTxt}>Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Camera tip */}
            <View style={s.cameraTip}>
              <Ionicons name="information-circle" size={13} color="#0D9488" />
              <Text style={s.cameraTipTxt}>
                Use <Text style={{ fontWeight: '700' }}>back camera</Text> · hold <Text style={{ fontWeight: '700' }}>6–8 inches</Text> from skin · good lighting
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {/* Preview */}
            <View style={s.previewWrap}>
              <Image source={{ uri: selectedImage }} style={s.previewImg} />
              <TouchableOpacity
                style={s.removeBtn}
                onPress={() => { setSelectedImage(null); setImageFile(null); }}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
              <View style={s.previewBadge}>
                <Ionicons name="checkmark-circle" size={12} color="white" />
                <Text style={s.previewBadgeTxt}>Ready to scan</Text>
              </View>
            </View>

            {/* Body location */}
            <Text style={s.locLabel}>Body Location (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {BODY_LOCATIONS.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[s.pill, bodyLocation === loc && s.pillActive]}
                  onPress={() => setBodyLocation(bodyLocation === loc ? '' : loc)}
                >
                  <Text style={[s.pillTxt, bodyLocation === loc && s.pillTxtActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Analyze button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                disabled={analyzeMutation.isPending}
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={() => analyzeMutation.mutate()}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={['#2563EB', '#0D9488']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.analyzeBtn, analyzeMutation.isPending && { opacity: 0.75 }]}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={s.analyzeTxt}>Analysing with AI…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="flash" size={20} color="white" />
                      <Text style={s.analyzeTxt}>Analyse Skin Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </FadeSlide>

      {/* ── What We Detect ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Detection Capabilities</Text>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeTxt}>AI-Powered</Text>
          </View>
        </View>
        <Text style={s.sectionSub}>
          Our EfficientNetB3 model analyses 4 clinical skin conditions with high confidence
        </Text>

        <View style={s.detectGrid}>
          {DETECTIONS.map((d, i) => (
            <FadeSlide key={i} delay={320 + i * 60} style={[s.detectCard, { backgroundColor: d.bg, borderColor: d.border }]}>
              <LinearGradient colors={d.colors} style={s.detectIconWrap}>
                <Ionicons name={d.icon} size={20} color="white" />
              </LinearGradient>
              <Text style={[s.detectLabel, { color: d.titleColor }]}>{d.label}</Text>
              <Text style={s.detectDesc}>{d.desc}</Text>
            </FadeSlide>
          ))}
        </View>
      </View>

      {/* ── How it works ── */}
      <View style={s.howSection}>
        <Text style={s.sectionTitle}>How It Works</Text>
        {[
          { step: '01', icon: 'cloud-upload', title: 'Upload Image', desc: 'Take or upload a clear photo of your skin concern' },
          { step: '02', icon: 'flask',         title: 'AI Analysis',  desc: 'EfficientNetB3 model analyses 4 skin condition classes' },
          { step: '03', icon: 'bar-chart',     title: 'ABCDE Score',  desc: 'Asymmetry, Border, Color, Diameter & Evolution scored' },
          { step: '04', icon: 'document-text', title: 'Full Report',  desc: 'Risk level, confidence score & clinical advice provided' },
        ].map((h, i) => (
          <View key={i} style={s.howRow}>
            <LinearGradient colors={['#1E1B4B', '#2563EB']} style={s.howNum}>
              <Text style={s.howNumTxt}>{h.step}</Text>
            </LinearGradient>
            <View style={s.howIconWrap}>
              <Ionicons name={h.icon as any} size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.howTitle}>{h.title}</Text>
              <Text style={s.howDesc}>{h.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Ionicons name="information-circle-outline" size={13} color="#94A3B8" />
        <Text style={s.disclaimerTxt}>
          For educational awareness only. Not a substitute for professional medical diagnosis.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>

    {/* ── Body Part Selection Modal ── */}
    <Modal
      visible={showBodyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBodyModal(false)}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          {/* Handle */}
          <View style={s.modalHandle} />

          {/* Title */}
          <View style={s.modalHeader}>
            <LinearGradient colors={['#2563EB', '#0D9488']} style={s.modalIcon}>
              <Ionicons name="body" size={18} color="white" />
            </LinearGradient>
            <View>
              <Text style={s.modalTitle}>Select Body Area</Text>
              <Text style={s.modalSub}>Choose the area you want to scan</Text>
            </View>
            <TouchableOpacity onPress={() => setShowBodyModal(false)} style={s.modalClose}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body part grid */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            <View style={s.partGrid}>
              {BODY_PARTS.map(part => (
                <TouchableOpacity
                  key={part.key}
                  style={s.partCard}
                  onPress={() => selectBodyAndScan(part.key)}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={s.partIconWrap}>
                    <Ionicons name={part.icon} size={22} color="#2563EB" />
                  </LinearGradient>
                  <Text style={s.partLabel}>{part.label}</Text>
                  <Text style={s.partHint} numberOfLines={1}>{part.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Skip — just open camera */}
          <TouchableOpacity
            style={s.skipBtn}
            onPress={() => { setShowBodyModal(false); setTimeout(() => pickImage(true), 200); }}
          >
            <Ionicons name="camera" size={16} color="#64748B" />
            <Text style={s.skipTxt}>Skip — Just Open Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F1F5F9' },

  hero:            { paddingHorizontal: 20, paddingBottom: 24 },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 20 },
  brandRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLogo:        { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandName:       { fontSize: 15, fontWeight: '800', color: '#F1F5F9', letterSpacing: 0.2 },
  logoutBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  clinicalBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: 'rgba(37,99,235,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clinicalDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA' },
  clinicalTxt:     { fontSize: 10, fontWeight: '800', color: '#93C5FD', letterSpacing: 1.2 },
  heroTitle:       { fontSize: W < 375 ? 24 : 27, fontWeight: '900', color: '#F8FAFC', lineHeight: W < 375 ? 31 : 35, marginBottom: 10, letterSpacing: -0.5 },
  heroAccent:      { color: '#60A5FA' },
  heroSub:         { fontSize: 13, color: '#94A3B8', lineHeight: 19, marginBottom: 20 },

  statsRow:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' },
  statItem:        { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider:     { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  statVal:         { fontSize: 17, fontWeight: '900', color: '#F1F5F9', letterSpacing: -0.3 },
  statLbl:         { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '500' },

  uploadCard:      { marginHorizontal: 16, marginTop: -2, marginBottom: 10, backgroundColor: 'white', borderRadius: 22, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  dropZone:        { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  dropInner:       { alignItems: 'center', paddingVertical: 28, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#BFDBFE' },
  dropIcon:        { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  dropTitle:       { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  dropSub:         { fontSize: 12, color: '#64748B', marginBottom: 3 },
  dropNote:        { fontSize: 11, color: '#94A3B8' },

  btnRow:          { flexDirection: 'row', gap: 10 },
  cameraTip:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDFA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginTop: 8, borderWidth: 1, borderColor: '#99F6E4' },
  cameraTipTxt:    { fontSize: 11, color: '#0F766E', flex: 1, lineHeight: 16 },

  btnPrimary:      { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnGrad:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  btnPrimaryTxt:   { color: 'white', fontWeight: '700', fontSize: 14 },
  btnSecondary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EFF6FF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#BFDBFE' },
  btnSecondaryTxt: { color: '#2563EB', fontWeight: '700', fontSize: 14 },

  previewWrap:     { position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14, height: W - 32 - 32 },
  previewImg:      { width: '100%', height: '100%' },
  removeBtn:       { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  previewBadge:    { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  previewBadgeTxt: { color: 'white', fontSize: 11, fontWeight: '700' },

  locLabel:        { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  pill:            { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: 'white', marginRight: 8 },
  pillActive:      { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillTxt:         { fontSize: 12, fontWeight: '500', color: '#64748B' },
  pillTxtActive:   { color: 'white', fontWeight: '700' },

  analyzeBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  analyzeTxt:      { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  section:         { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sectionTitle:    { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 },
  sectionBadge:    { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sectionBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#2563EB', letterSpacing: 0.5 },
  sectionSub:      { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 14 },

  detectGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detectCard:      { width: (W - 32 - 10) / 2, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  detectIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  detectLabel:     { fontSize: 13, fontWeight: '800', lineHeight: 18, marginBottom: 4, letterSpacing: -0.2 },
  detectDesc:      { fontSize: 11, color: '#64748B', lineHeight: 15 },

  howSection:      { marginHorizontal: 16, marginTop: 14, backgroundColor: 'white', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 10 },
  howRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  howNum:          { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  howNumTxt:       { fontSize: 11, fontWeight: '900', color: 'white' },
  howIconWrap:     { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  howTitle:        { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  howDesc:         { fontSize: 12, color: '#64748B', lineHeight: 17 },

  disclaimer:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4, alignItems: 'flex-start' },
  disclaimerTxt:   { fontSize: 11, color: '#94A3B8', lineHeight: 16, flex: 1 },

  // Body Part Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },
  modalHandle:     { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIcon:       { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle:      { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub:        { fontSize: 12, color: '#64748B', marginTop: 1 },
  modalClose:      { marginLeft: 'auto' as any, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  partGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  partCard:        { width: (W - 32 - 20) / 3, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  partIconWrap:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  partLabel:       { fontSize: 12, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  partHint:        { fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2 },

  skipBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  skipTxt:         { fontSize: 13, fontWeight: '600', color: '#64748B' },
});

// ── Scan Progress Overlay Styles ────────────────────────────────────────────
const sp = StyleSheet.create({
  overlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,15,30,0.92)', zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  card:      { width: W - 48, backgroundColor: 'white', borderRadius: 28, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  iconWrap:  { marginBottom: 20 },
  iconGrad:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 6, letterSpacing: -0.5 },
  subtitle:  { fontSize: 14, color: '#64748B', marginBottom: 24, textAlign: 'center', minHeight: 20 },
  barTrack:  { width: '100%', height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  barFill:   { height: '100%', borderRadius: 5, backgroundColor: '#2563EB' },
  pct:       { fontSize: 32, fontWeight: '900', color: '#2563EB', marginBottom: 20, letterSpacing: -1 },
  dots:      { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: '#2563EB', width: 18 },
  note:      { fontSize: 11, color: '#94A3B8' },
});
