import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '../../constants/api';

const { width: W } = Dimensions.get('window');

type HealthResponse = { status: string; model_loaded: boolean; version: string };

const SECTIONS = [
  {
    title: 'What we detect',
    items: [
      { icon: 'radio-button-on' as const, color: '#EF4444', label: 'Moles / Melanocytic Lesions', desc: 'Benign nevi & potential melanoma — includes ABCDE analysis' },
      { icon: 'radio-button-on' as const, color: '#F59E0B', label: 'Non-Mole Lesions',            desc: 'Keratosis, dermatofibroma, vascular lesions' },
      { icon: 'radio-button-on' as const, color: '#F97316', label: 'Acne / Pimples',              desc: 'Inflammatory & non-inflammatory acne vulgaris' },
      { icon: 'radio-button-on' as const, color: '#22C55E', label: 'Healthy Skin',                desc: 'No significant finding detected' },
    ],
  },
  {
    title: 'How it works',
    items: [
      { icon: 'camera-outline' as const,        color: '#2563EB', label: 'Step 1 — Capture',    desc: 'Take or upload a close-up photo of the skin area' },
      { icon: 'shield-checkmark-outline' as const, color: '#2563EB', label: 'Step 2 — Validate', desc: 'Skin authenticity check rejects drawings & cartoons' },
      { icon: 'hardware-chip-outline' as const,  color: '#2563EB', label: 'Step 3 — AI Analyse', desc: 'EfficientNetB3 model classifies the condition' },
      { icon: 'document-text-outline' as const,  color: '#2563EB', label: 'Step 4 — Results',   desc: 'Risk score, ABCDE breakdown, and medical guidance' },
    ],
  },
];

export default function ProfileScreen() {
  const { data: health, isLoading } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/health`);
      if (!r.ok) throw new Error('offline');
      return r.json() as Promise<HealthResponse>;
    },
    retry: 1,
    staleTime: 30_000,
  });

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open link', 'Please try manually in your browser.')
    );
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#2563EB', '#0D9488']} style={s.header}>
        <View style={s.avatarCircle}>
          <Ionicons name="medical" size={36} color="white" />
        </View>
        <Text style={s.appName}>SkinVision AI</Text>
        <Text style={s.appVersion}>Version 2.0.0</Text>

        {/* Backend status pill */}
        <View style={[s.statusPill, { backgroundColor: health?.status === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)' }]}>
          <View style={[s.statusDot, { backgroundColor: health?.status === 'ok' ? '#22C55E' : '#EF4444' }]} />
          <Text style={s.statusTxt}>
            {isLoading
              ? 'Checking server…'
              : health?.status === 'ok'
                ? `Server online · AI ${health.model_loaded ? 'ready' : 'demo mode'}`
                : 'Server offline'}
          </Text>
        </View>
      </LinearGradient>

      {/* Info sections */}
      {SECTIONS.map((sec) => (
        <View key={sec.title} style={s.section}>
          <Text style={s.sectionTitle}>{sec.title}</Text>
          {sec.items.map((item) => (
            <View key={item.label} style={s.row}>
              <View style={[s.iconBox, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Ionicons name="warning-outline" size={16} color="#F59E0B" />
        <Text style={s.disclaimerTxt}>
          SkinVision AI is for <Text style={{ fontWeight: '700' }}>educational and informational purposes only</Text>.
          It is NOT a substitute for professional medical diagnosis or treatment. Always consult a qualified
          dermatologist for medical advice.
        </Text>
      </View>

      {/* Links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Resources</Text>
        {[
          { icon: 'globe-outline' as const,        label: 'American Academy of Dermatology', url: 'https://www.aad.org' },
          { icon: 'shield-outline' as const,        label: 'Skin Cancer Foundation',          url: 'https://www.skincancer.org' },
          { icon: 'logo-github' as const,           label: 'Source on GitHub',                url: 'https://github.com' },
        ].map((link) => (
          <TouchableOpacity key={link.label} style={s.link} onPress={() => openLink(link.url)} activeOpacity={0.7}>
            <Ionicons name={link.icon} size={18} color="#2563EB" />
            <Text style={s.linkTxt}>{link.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>Built with EfficientNetB3 · FastAPI · Expo SDK 51</Text>
        <Text style={s.footerTxt}>© 2025 SkinVision AI</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },

  header:       { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, gap: 6 },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName:      { fontSize: W < 375 ? 22 : 26, fontWeight: '900', color: 'white' },
  appVersion:   { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusTxt:    { color: 'white', fontSize: 12, fontWeight: '600' },

  section:      { marginHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  iconBox:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText:      { flex: 1 },
  rowLabel:     { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  rowDesc:      { fontSize: 11, color: '#64748B', lineHeight: 16 },

  disclaimer:   { margin: 16, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#FDE68A' },
  disclaimerTxt:{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  link:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  linkTxt:      { flex: 1, fontSize: 14, fontWeight: '600', color: '#2563EB' },

  footer:       { alignItems: 'center', gap: 4, paddingVertical: 24 },
  footerTxt:    { fontSize: 11, color: '#94A3B8' },
});
