import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function MoreScreen() {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const SELF_CARE = [
    {
      icon: 'sunny',
      title: 'Daily Sun Protection',
      color: '#F59E0B',
      tips: [
        'Apply SPF 30+ sunscreen every morning, even on cloudy days.',
        'Reapply every 2 hours when outdoors or sweating.',
        'Wear protective clothing, UV-blocking sunglasses, and wide-brimmed hats.',
        'Avoid peak UV hours between 10 AM and 4 PM.',
      ],
    },
    {
      icon: 'water',
      title: 'Hydration & Moisturising',
      color: '#06B6D4',
      tips: [
        'Drink at least 8 glasses of water daily.',
        'Apply moisturiser within 3 minutes of bathing to lock in moisture.',
        'Use a humidifier in air-conditioned or dry environments.',
        'Choose fragrance-free products for sensitive or reactive skin.',
      ],
    },
    {
      icon: 'nutrition',
      title: 'Diet for Healthy Skin',
      color: '#10B981',
      tips: [
        'Eat antioxidant-rich foods: berries, spinach, broccoli, tomatoes.',
        'Include omega-3 fatty acids: salmon, walnuts, chia seeds.',
        'Reduce sugar and processed foods — they can accelerate skin ageing.',
        'Vitamin C boosts collagen; Vitamin E protects against UV damage.',
      ],
    },
    {
      icon: 'moon',
      title: 'Sleep & Stress',
      color: '#8B5CF6',
      tips: [
        'Get 7–9 hours of sleep — skin repairs and regenerates at night.',
        'Manage stress through exercise, meditation, or deep breathing.',
        'High cortisol levels can trigger acne, eczema, and psoriasis flares.',
        'Maintain a consistent sleep schedule for circadian rhythm balance.',
      ],
    },
    {
      icon: 'scan-circle',
      title: 'Regular Self-Checks',
      color: '#2563EB',
      tips: [
        'Perform a full-body skin check once a month.',
        'Use a hand mirror to examine your back and scalp.',
        'Watch for new moles or changes using ABCDE criteria.',
        'Photograph areas of concern to track changes over time.',
      ],
    },
    {
      icon: 'flask',
      title: 'Skincare Routine',
      color: '#EC4899',
      tips: [
        'Cleanse gently twice a day — avoid harsh soaps that strip the skin.',
        'Use a broad-spectrum SPF in the morning as the last step.',
        'Retinol (at night) helps with texture, lines, and hyperpigmentation.',
        'Patch-test new products before full application.',
      ],
    },
  ];

  const WHEN_TO_SEE = [
    { icon: 'warning',          color: '#EF4444', text: 'A mole or spot changes shape, size, or colour' },
    { icon: 'warning',          color: '#EF4444', text: 'A sore or lesion that does not heal within 2 weeks' },
    { icon: 'alert-circle',     color: '#F97316', text: 'Itching, bleeding, or oozing from any lesion' },
    { icon: 'alert-circle',     color: '#F97316', text: 'Skin appears red, warm, or swollen (possible infection)' },
    { icon: 'information-circle', color: '#F59E0B', text: 'Family history of melanoma or skin cancer' },
    { icon: 'information-circle', color: '#F59E0B', text: 'Severe acne not responding to over-the-counter treatment' },
    { icon: 'checkmark-circle', color: '#10B981', text: 'Routine annual skin check with a dermatologist' },
  ];

  const UV_LEVELS = [
    { range: '0–2',  label: 'Low',       color: '#10B981', advice: 'Safe to be outside. Wear SPF as a habit.' },
    { range: '3–5',  label: 'Moderate',  color: '#F59E0B', advice: 'Wear SPF 30+, hat, and UV-blocking sunglasses.' },
    { range: '6–7',  label: 'High',      color: '#F97316', advice: 'Seek shade near midday; reapply SPF every 2 hrs.' },
    { range: '8–10', label: 'Very High', color: '#EF4444', advice: 'Minimize exposure 10 AM–4 PM. Long sleeves recommended.' },
    { range: '11+',  label: 'Extreme',   color: '#7C3AED', advice: 'Avoid outdoors during peak hours if possible.' },
  ];

  return (
    <ScrollView style={m.container} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <LinearGradient colors={['#0D9488', '#059669']} style={m.header}>
        <Ionicons name="leaf" size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: 6 }} />
        <Text style={m.headerTitle}>Care & Resources</Text>
        <Text style={m.headerSub}>Self-care tips, doctor finder and skin health guide</Text>
      </LinearGradient>

      {/* ── Find Dermatologist ── */}
      <View style={m.card}>
        <Text style={m.cardTitle}>Find a Dermatologist</Text>
        <Text style={m.cardSub}>Locate certified skin specialists near you.</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.google.com/maps/search/dermatologist+near+me')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={m.findBtn}
          >
            <Ionicons name="location" size={18} color="white" />
            <Text style={m.findBtnTxt}>Find Dermatologist Near Me</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={m.altRow}>
          <TouchableOpacity
            style={m.altBtn}
            onPress={() => Linking.openURL('https://www.aad.org/find-a-derm')}
          >
            <Ionicons name="globe-outline" size={14} color="#2563EB" />
            <Text style={m.altBtnTxt}>AAD Finder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={m.altBtn}
            onPress={() => Linking.openURL('https://www.practo.com/dermatologist')}
          >
            <Ionicons name="calendar-outline" size={14} color="#2563EB" />
            <Text style={m.altBtnTxt}>Book Online</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={m.altBtn}
            onPress={() => Linking.openURL('https://www.doctorspring.com/specialty/dermatologist')}
          >
            <Ionicons name="videocam-outline" size={14} color="#2563EB" />
            <Text style={m.altBtnTxt}>Teleconsult</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── When to See a Doctor ── */}
      <View style={m.card}>
        <Text style={m.cardTitle}>When to See a Doctor</Text>
        {WHEN_TO_SEE.map((item, i) => (
          <View key={i} style={m.warningRow}>
            <Ionicons name={item.icon as any} size={18} color={item.color} />
            <Text style={m.warningTxt}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* ── UV Index Guide ── */}
      <View style={[m.card, { backgroundColor: '#FFF7ED' }]}>
        <View style={m.uvHeader}>
          <Ionicons name="sunny" size={20} color="#F97316" />
          <Text style={[m.cardTitle, { color: '#C2410C', marginBottom: 0 }]}>UV Index Guide</Text>
        </View>
        {UV_LEVELS.map((uv, i) => (
          <View key={i} style={m.uvRow}>
            <View style={[m.uvBadge, { backgroundColor: uv.color }]}>
              <Text style={m.uvBadgeTxt}>{uv.range}</Text>
            </View>
            <Text style={m.uvLabel}>{uv.label}</Text>
            <Text style={m.uvAdvice}>{uv.advice}</Text>
          </View>
        ))}
      </View>

      {/* ── Self Care Tips (collapsible) ── */}
      <View style={{ marginHorizontal: 16 }}>
        <Text style={m.sectionHeading}>Self Care Tips</Text>
      </View>
      {SELF_CARE.map((cat, i) => (
        <TouchableOpacity
          key={i}
          style={m.tipCard}
          onPress={() => setExpandedTip(expandedTip === i ? null : i)}
          activeOpacity={0.8}
        >
          <View style={m.tipHeader}>
            <View style={[m.tipIconWrap, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <Text style={m.tipTitle}>{cat.title}</Text>
            <Ionicons
              name={expandedTip === i ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#94A3B8"
            />
          </View>
          {expandedTip === i && (
            <View style={m.tipBody}>
              {cat.tips.map((tip, j) => (
                <View key={j} style={m.tipRow}>
                  <View style={[m.tipDot, { backgroundColor: cat.color }]} />
                  <Text style={m.tipTxt}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* ── Research Roadmap ── */}
      <View style={{ marginHorizontal: 16, marginTop: 14 }}>
        <Text style={m.sectionHeading}>Research Roadmap</Text>
        <Text style={[m.cardSub, { marginBottom: 10 }]}>Current capabilities & planned future features</Text>
      </View>
      {([
        { num: '01', status: 'live',    icon: 'scan',         title: 'Multi-Class Detection',     desc: 'Melanoma, skin lesions, acne & healthy skin — EfficientNetB3 model', color: '#10B981' },
        { num: '02', status: 'live',    icon: 'bar-chart',    title: 'Risk Score Prediction',     desc: 'Low/Medium/High/Critical risk scoring with ABCDE criteria',            color: '#10B981' },
        { num: '03', status: 'live',    icon: 'phone-portrait',title: 'Mobile App Integration',  desc: 'Android/iOS app with camera, history & TeleDerm sharing',              color: '#10B981' },
        { num: '04', status: 'live',    icon: 'time',         title: 'Patient History Tracking',  desc: 'Lesion changes tracked over time — early progression detection',        color: '#10B981' },
        { num: '05', status: 'live',    icon: 'videocam',     title: 'Tele-Dermatology',          desc: 'Secure report sharing with dermatologists via encrypted links',         color: '#10B981' },
        { num: '06', status: 'planned', icon: 'layers',       title: 'Explainable AI (XAI)',      desc: 'Grad-CAM heatmaps explaining why the model made each decision',        color: '#F59E0B' },
        { num: '07', status: 'planned', icon: 'cloud',        title: 'Cloud & Hospital System',   desc: 'FHIR-compliant integration with hospital systems & rural clinics',      color: '#F59E0B' },
      ] as const).map((item, i) => (
        <View key={i} style={m.roadmapCard}>
          <LinearGradient
            colors={item.status === 'live' ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
            style={m.roadmapNum}
          >
            <Text style={m.roadmapNumTxt}>{item.num}</Text>
          </LinearGradient>
          <View style={m.roadmapIconWrap}>
            <Ionicons name={item.icon as any} size={17} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <Text style={m.roadmapTitle}>{item.title}</Text>
              <View style={[m.statusBadge, { backgroundColor: item.status === 'live' ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[m.statusTxt, { color: item.status === 'live' ? '#15803D' : '#92400E' }]}>
                  {item.status === 'live' ? '✓ Live' : '⏳ Soon'}
                </Text>
              </View>
            </View>
            <Text style={m.roadmapDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}

      {/* ── Disclaimer ── */}
      <View style={[m.card, { backgroundColor: '#FFF7ED', marginTop: 14, marginBottom: 32 }]}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Ionicons name="warning" size={16} color="#D97706" style={{ marginTop: 1 }} />
          <Text style={m.disclaimerTxt}>
            SkinVision AI is a screening aid only and does not replace professional medical diagnosis.
            Always consult a qualified dermatologist for any skin concerns.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const m = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  header:         { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28 },
  headerTitle:    { fontSize: 26, fontWeight: '900', color: 'white' },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 5, lineHeight: 18 },

  card:           { marginHorizontal: 16, marginTop: 14, backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle:      { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  cardSub:        { fontSize: 12, color: '#64748B', marginBottom: 14 },

  findBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 12 },
  findBtnTxt:     { color: 'white', fontSize: 15, fontWeight: '700' },
  altRow:         { flexDirection: 'row', gap: 8 },
  altBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 10 },
  altBtnTxt:      { fontSize: 11, fontWeight: '700', color: '#2563EB' },

  warningRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  warningTxt:     { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  uvHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  uvRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  uvBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, minWidth: 40, alignItems: 'center', marginTop: 1 },
  uvBadgeTxt:     { fontSize: 11, fontWeight: '700', color: 'white' },
  uvLabel:        { width: 58, fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 2 },
  uvAdvice:       { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },

  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 6, marginBottom: 4 },

  tipCard:        { marginHorizontal: 16, marginTop: 10, backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tipHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  tipIconWrap:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipTitle:       { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },
  tipBody:        { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2 },
  tipRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot:         { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipTxt:         { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19 },

  disclaimerTxt:  { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  roadmapCard:    { marginHorizontal: 16, marginTop: 10, backgroundColor: 'white', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  roadmapNum:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roadmapNumTxt:  { fontSize: 10, fontWeight: '900', color: 'white' },
  roadmapIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  roadmapTitle:   { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  roadmapDesc:    { fontSize: 12, color: '#64748B', lineHeight: 17 },
  statusBadge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusTxt:      { fontSize: 10, fontWeight: '700' },
});
