import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Share, Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE, ENDPOINTS } from '../../constants/api';
import type { ScanResult } from '../../types/scan';

export default function TeleDermScreen() {
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  const [doctorEmail, setDoctorEmail]   = useState('');
  const [message, setMessage]           = useState('');
  const [shareLink, setShareLink]       = useState('');
  const [sending, setSending]           = useState(false);

  const { data: scans, isLoading } = useQuery<ScanResult[]>({
    queryKey: ['scans'],
    queryFn: async () => {
      const res = await fetch(ENDPOINTS.scans);
      if (!res.ok) throw new Error('Failed to load scans');
      return res.json();
    },
  });

  const handleGenerate = async () => {
    if (!selectedScan) {
      Alert.alert('Select a Scan', 'Please select a scan from the list below first.');
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('scan_id', String(selectedScan.id));
      fd.append('doctor_email', doctorEmail);
      fd.append('message', message);
      const res = await fetch(`${API_BASE}/api/consultations`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const link = `${API_BASE}/api/shared/${data.share_token}`;
      setShareLink(link);
      await Share.share({ message: `SkinVision Doctor Report:\n${link}`, title: 'Share with Doctor' });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create consultation link.');
    } finally {
      setSending(false);
    }
  };

  const STEPS = [
    { icon: 'camera',     text: 'Scan your skin condition using the Scan tab' },
    { icon: 'list',       text: 'Select the scan you want to share below' },
    { icon: 'mail',       text: 'Enter doctor email and an optional message' },
    { icon: 'link',       text: 'Generate a secure, shareable report link' },
  ];

  const RISK_COLOR: Record<string, string> = {
    Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Critical: '#EF4444',
  };

  return (
    <ScrollView
      style={st.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={st.header}>
        <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: 6 }} />
        <Text style={st.headerTitle}>TeleDermatology</Text>
        <Text style={st.headerSub}>Share your scan with a remote dermatologist securely</Text>
      </LinearGradient>

      {/* ── How it works ── */}
      <View style={st.card}>
        <Text style={st.cardTitle}>How It Works</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={st.stepRow}>
            <View style={st.stepNum}>
              <Text style={st.stepNumTxt}>{i + 1}</Text>
            </View>
            <View style={[st.stepIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name={step.icon as any} size={16} color="#4F46E5" />
            </View>
            <Text style={st.stepTxt}>{step.text}</Text>
          </View>
        ))}
      </View>

      {/* ── Scan Selector ── */}
      <View style={st.card}>
        <Text style={st.cardTitle}>Select a Scan</Text>
        {isLoading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginVertical: 16 }} />
        ) : !scans?.length ? (
          <View style={st.emptyBox}>
            <Ionicons name="camera-outline" size={36} color="#CBD5E1" />
            <Text style={st.emptyTxt}>No scans yet.{'\n'}Go to the Scan tab to add one.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 4 }}
            >
              {(scans ?? []).slice(0, 12).map((scan: ScanResult) => {
                const isSelected = selectedScan?.id === scan.id;
                return (
                  <TouchableOpacity
                    key={scan.id}
                    onPress={() => setSelectedScan(scan)}
                    style={[st.scanThumb, isSelected && st.scanThumbSel]}
                    activeOpacity={0.8}
                  >
                    {scan.image_url ? (
                      <Image
                        source={{ uri: `${API_BASE}${scan.image_url}` }}
                        style={st.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[st.thumbImg, st.thumbPlaceholder]}>
                        <Ionicons name="image-outline" size={20} color="#CBD5E1" />
                      </View>
                    )}
                    {/* Risk dot */}
                    <View style={[st.riskDot, { backgroundColor: RISK_COLOR[scan.risk_level ?? ''] ?? '#94A3B8' }]} />
                    <Text style={st.thumbLabel} numberOfLines={1}>
                      {(scan.result ?? scan.label ?? 'Scan').replace('_', ' ')}
                    </Text>
                    {isSelected && (
                      <View style={st.thumbCheck}>
                        <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedScan ? (
              <View style={st.selectedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                <Text style={st.selectedTxt} numberOfLines={1}>
                  Selected: {(selectedScan.result ?? selectedScan.label ?? 'Scan').replace('_', ' ')}
                  {'  '}•{'  '}Risk: {selectedScan.risk_level}
                  {'  '}•{'  '}{selectedScan.confidence}% confidence
                </Text>
              </View>
            ) : (
              <Text style={st.noSelTxt}>Tap a scan to select it</Text>
            )}
          </>
        )}
      </View>

      {/* ── Consultation Form ── */}
      <View style={st.card}>
        <Text style={st.cardTitle}>Consultation Details</Text>
        <Text style={st.inputLabel}>Doctor's Email</Text>
        <TextInput
          style={st.input}
          placeholder="doctor@clinic.com (optional)"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={doctorEmail}
          onChangeText={setDoctorEmail}
        />
        <Text style={st.inputLabel}>Your Message</Text>
        <TextInput
          style={[st.input, st.textArea]}
          placeholder="Describe your concern or symptoms in detail…"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />
      </View>

      {/* ── Generated Link ── */}
      {shareLink ? (
        <View style={[st.card, { backgroundColor: '#F0FDF4' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <Text style={[st.cardTitle, { color: '#15803D', marginBottom: 0 }]}>Report Link Generated!</Text>
          </View>
          <View style={st.linkBox}>
            <Ionicons name="link" size={13} color="#15803D" />
            <Text style={st.linkTxt} numberOfLines={3}>{shareLink}</Text>
          </View>
          <TouchableOpacity
            style={st.copyBtn}
            onPress={() => Share.share({ message: shareLink, title: 'Doctor Report Link' })}
          >
            <Ionicons name="copy-outline" size={16} color="#15803D" />
            <Text style={st.copyBtnTxt}>Copy &amp; Share Link</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Generate Button ── */}
      <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
        <TouchableOpacity onPress={handleGenerate} disabled={sending} activeOpacity={0.85}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[st.genBtn, sending && { opacity: 0.7 }]}
          >
            <Ionicons name={sending ? 'hourglass' : 'share-social'} size={18} color="white" />
            <Text style={st.genBtnTxt}>
              {sending ? 'Generating Secure Link…' : 'Generate Doctor Report Link'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={st.disclaimer}>
          Reports are encrypted. Only accessible via the unique link — never stored publicly.
        </Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F8FAFC' },
  header:          { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, alignItems: 'flex-start' },
  headerTitle:     { fontSize: 26, fontWeight: '900', color: 'white' },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 5, lineHeight: 18 },

  card:            { marginHorizontal: 16, marginTop: 14, backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle:       { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 14 },

  stepRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepNum:         { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  stepNumTxt:      { fontSize: 11, fontWeight: '900', color: '#4F46E5' },
  stepIconWrap:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepTxt:         { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },

  emptyBox:        { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyTxt:        { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  scanThumb:       { width: 90, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#F1F5F9', position: 'relative' },
  scanThumbSel:    { borderColor: '#4F46E5', borderWidth: 2.5 },
  thumbImg:        { width: 90, height: 90 },
  thumbPlaceholder:{ backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  riskDot:         { position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'white' },
  thumbLabel:      { fontSize: 10, fontWeight: '600', color: '#64748B', padding: 5, textAlign: 'center', backgroundColor: 'white' },
  thumbCheck:      { position: 'absolute', top: 4, right: 4, backgroundColor: 'white', borderRadius: 11 },

  selectedBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 10 },
  selectedTxt:     { flex: 1, fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  noSelTxt:        { marginTop: 10, fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  inputLabel:      { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input:           { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: '#0F172A', marginBottom: 14, backgroundColor: '#F8FAFC' },
  textArea:        { height: 100, textAlignVertical: 'top' },

  linkBox:         { backgroundColor: '#DCFCE7', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  linkTxt:         { flex: 1, fontSize: 12, color: '#15803D', fontWeight: '600', lineHeight: 18 },
  copyBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 12 },
  copyBtnTxt:      { fontSize: 13, fontWeight: '700', color: '#15803D' },

  genBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  genBtnTxt:       { color: 'white', fontSize: 15, fontWeight: '700' },
  disclaimer:      { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
