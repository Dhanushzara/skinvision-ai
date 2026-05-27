import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { API_BASE } from '../../constants/api';
import { cacheScan } from '../../utils/storage';
import type { ScanResult } from '../../types/scan';

const { width: W } = Dimensions.get('window');
const s16 = W * 0.042;   // ~16 on 375px
const s20 = W * 0.053;
const s24 = W * 0.064;

const BODY_LOCATIONS = [
  'Face','Neck','Chest','Back','Left Arm','Right Arm',
  'Abdomen','Left Leg','Right Leg','Hand','Foot',
];
const DETECT = [
  { emoji: '🔴', label: 'Moles',   desc: 'Melanocytic lesions & melanoma', bg: '#FEF2F2' },
  { emoji: '🟡', label: 'Lesions', desc: 'Non-mole benign & malignant',    bg: '#FFFBEB' },
  { emoji: '🟠', label: 'Pimples', desc: 'Acne vulgaris classification',   bg: '#FFF7ED' },
  { emoji: '🟢', label: 'Healthy', desc: 'No significant finding',         bg: '#F0FDF4' },
];

/** Simple RN-Animated fade+slide wrapper — no Reanimated required */
function FadeSlide({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bodyLocation, setBodyLocation] = useState('');
  const btnScale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

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
        const err = await res.json().catch(() => ({})) as { detail?: { code?: string; message?: string } | string };
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
      setSelectedImage(null); setImageFile(null); setBodyLocation('');
    },
    onError: (e) => Alert.alert('Analysis Failed', e.message, [{ text: 'OK' }]),
  });

  const pickImage = async (cam: boolean) => {
    if (cam) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access needed.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Gallery access needed.'); return; }
    }
    const res = cam
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets[0]) { setSelectedImage(res.assets[0].uri); setImageFile(res.assets[0]); }
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#EFF6FF', '#F0FDFA']} style={s.hero}>
        <FadeSlide delay={0}>
          <View style={s.badge}>
            <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
            <Text style={s.badgeTxt}>AI-Powered Skin Analysis</Text>
          </View>
          <Text style={s.heroTitle}>
            Detect skin{'\n'}<Text style={s.heroAccent}>conditions with AI</Text>
          </Text>
          <Text style={s.heroSub}>Moles · Pimples · Lesions{'\n'}Real ML detection</Text>
        </FadeSlide>
      </LinearGradient>

      {/* Upload card */}
      <FadeSlide delay={180} style={s.card}>
        {!selectedImage ? (
          <View style={s.dropZone}>
            <View style={s.dropIcon}><Ionicons name="scan" size={s20 * 1.7} color="#94A3B8" /></View>
            <Text style={s.dropTitle}>Upload or take a photo</Text>
            <Text style={s.dropSub}>Only real human skin accepted{'\n'}Drawings & cartoons rejected</Text>
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnBlue} onPress={() => pickImage(false)}>
                <Ionicons name="images" size={s16} color="white" />
                <Text style={s.btnBlueTxt}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnOutline} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={s16} color="#2563EB" />
                <Text style={s.btnOutlineTxt}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={s.preview}>
              <Image source={{ uri: selectedImage }} style={s.previewImg} />
              <TouchableOpacity style={s.removeBtn} onPress={() => { setSelectedImage(null); setImageFile(null); }}>
                <Ionicons name="close" size={15} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={s.locLabel}>Body Location (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s16 }}>
              {BODY_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[s.pill, bodyLocation === loc && s.pillActive]}
                  onPress={() => setBodyLocation(bodyLocation === loc ? '' : loc)}
                >
                  <Text style={[s.pillTxt, bodyLocation === loc && s.pillTxtActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                disabled={analyzeMutation.isPending}
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={() => analyzeMutation.mutate()}
              >
                <LinearGradient
                  colors={['#2563EB', '#0D9488']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.analyzeBtn, analyzeMutation.isPending && { opacity: 0.72 }]}
                >
                  {analyzeMutation.isPending
                    ? <><ActivityIndicator color="white" size="small" /><Text style={s.analyzeTxt}>Analyzing…</Text></>
                    : <><Ionicons name="flash" size={s20} color="white" /><Text style={s.analyzeTxt}>Analyze Skin</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </FadeSlide>

      {/* Detection grid */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>What we detect</Text>
        <View style={s.grid}>
          {DETECT.map((d, i) => (
            <FadeSlide key={d.label} delay={300 + i * 70} style={[s.detCard, { backgroundColor: d.bg }]}>
              <Text style={s.detEmoji}>{d.emoji}</Text>
              <Text style={s.detLabel}>{d.label}</Text>
              <Text style={s.detDesc}>{d.desc}</Text>
            </FadeSlide>
          ))}
        </View>
      </View>

      <View style={s.disclaimer}>
        <Ionicons name="information-circle-outline" size={13} color="#94A3B8" />
        <Text style={s.disclaimerTxt}>For educational purposes only. Not a substitute for professional medical advice.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  hero:         { paddingHorizontal: s24, paddingTop: s24 * 2.2, paddingBottom: s24 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 14 },
  badgeTxt:     { color: '#2563EB', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle:    { fontSize: W < 375 ? 23 : 26, fontWeight: '900', color: '#0F172A', lineHeight: W < 375 ? 30 : 34, marginBottom: 8 },
  heroAccent:   { color: '#2563EB' },
  heroSub:      { color: '#64748B', fontSize: 13, lineHeight: 21 },

  card:         { marginHorizontal: s16, marginTop: 8, marginBottom: 8, backgroundColor: 'white', borderRadius: 20, padding: s20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  dropZone:     { alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#E2E8F0', borderRadius: 16, padding: s24 },
  dropIcon:     { width: s24 * 2.8, height: s24 * 2.8, borderRadius: s24 * 0.7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: s16 },
  dropTitle:    { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  dropSub:      { fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: s24 },
  btnRow:       { flexDirection: 'row', gap: 10 },
  btnBlue:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', paddingHorizontal: s20, paddingVertical: 13, borderRadius: 50 },
  btnBlueTxt:   { color: 'white', fontWeight: '700', fontSize: 14 },
  btnOutline:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', paddingHorizontal: s20, paddingVertical: 13, borderRadius: 50, borderWidth: 1, borderColor: '#BFDBFE' },
  btnOutlineTxt:{ color: '#2563EB', fontWeight: '700', fontSize: 14 },

  preview:      { borderRadius: 16, overflow: 'hidden', width: W - s16 * 2 - s20 * 2, height: W - s16 * 2 - s20 * 2, alignSelf: 'center', marginBottom: s16, position: 'relative' },
  previewImg:   { width: '100%', height: '100%' },
  removeBtn:    { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  locLabel:     { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  pill:         { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'white', marginRight: 8 },
  pillActive:   { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillTxt:      { fontSize: 12, fontWeight: '500', color: '#64748B' },
  pillTxtActive:{ color: 'white', fontWeight: '700' },

  analyzeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  analyzeTxt:   { color: 'white', fontSize: 16, fontWeight: '700' },

  section:      { paddingHorizontal: s16, paddingVertical: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detCard:      { width: (W - s16 * 2 - 10) / 2, padding: s16, borderRadius: 16 },
  detEmoji:     { fontSize: 22, marginBottom: 6 },
  detLabel:     { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  detDesc:      { fontSize: 11, color: '#64748B', lineHeight: 15 },

  disclaimer:   { flexDirection: 'row', gap: 8, padding: s16, paddingBottom: 36, alignItems: 'flex-start' },
  disclaimerTxt:{ fontSize: 11, color: '#94A3B8', lineHeight: 16, flex: 1 },
});
