import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Alert,
  ScrollView, ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { loginUser, registerUser, saveUser } from '../utils/auth';

const { width: W, height: H } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [focusField, setFocus]  = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  const logoOp = useRef(new Animated.Value(0)).current;
  const logoY  = useRef(new Animated.Value(-24)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY  = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(logoY,  { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardY,  { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password to continue.');
      return;
    }
    setLoginError(null);
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (!result.success) {
      setLoginError(result.error ?? 'Login failed.');
      return;
    }
    router.replace('/(tabs)');
  };

  const handleGoogle = () => {
    setGoogleName('');
    setGoogleEmail('');
    setShowGoogleModal(true);
  };

  const confirmGoogle = async () => {
    if (!googleName.trim() || !googleEmail.trim()) {
      Alert.alert('Required', 'Please enter your name and email.');
      return;
    }
    if (!googleEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setShowGoogleModal(false);
    setGLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // Register or update the account linked to Google
    await registerUser(googleName.trim(), googleEmail.trim(), '__google__');
    await saveUser({ name: googleName.trim(), email: googleEmail.toLowerCase().trim(), provider: 'google' });
    setGLoading(false);
    router.replace('/(tabs)');
  };

  const inputStyle = (field: string) => [
    s.inputRow,
    focusField === field && s.inputRowFocused,
  ];

  return (
    <View style={s.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#03091A', '#080E2A', '#0D0B2E']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative blobs */}
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ── */}
          <Animated.View style={[s.brand, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
            <LinearGradient colors={['#2563EB', '#0D9488']} style={s.logoWrap}>
              <Ionicons name="shield-checkmark" size={34} color="white" />
            </LinearGradient>
            <Text style={s.appName}>SkinVision AI</Text>
            <Text style={s.appTagline}>Clinical-Grade Skin Cancer Detection</Text>

            <View style={s.badgeRow}>
              {['256-bit SSL', 'HIPAA Ready', 'AI Validated'].map((b, i) => (
                <View key={i} style={s.badge}>
                  <Ionicons name="checkmark-circle" size={10} color="#6EE7B7" />
                  <Text style={s.badgeTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Form Card ── */}
          <Animated.View style={[s.card, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
            <Text style={s.cardTitle}>Welcome Back</Text>
            <Text style={s.cardSub}>Sign in to continue your skin health journey</Text>

            {/* Email */}
            <Text style={s.label}>Email Address</Text>
            <View style={inputStyle('email')}>
              <Ionicons name="mail-outline" size={18} color={focusField === 'email' ? '#2563EB' : '#94A3B8'} />
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
              />
            </View>

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <View style={inputStyle('pass')}>
              <Ionicons name="lock-closed-outline" size={18} color={focusField === 'pass' ? '#2563EB' : '#94A3B8'} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocus('pass')}
                onBlur={() => setFocus(null)}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Error message */}
            {loginError ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.errorTxt}>{loginError}</Text>
              </View>
            ) : null}

            {/* Forgot */}
            <TouchableOpacity
              style={s.forgotRow}
              onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your registered email address.')}
            >
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.86}>
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.signInBtn, loading && { opacity: 0.72 }]}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : <>
                      <Ionicons name="log-in-outline" size={18} color="white" />
                      <Text style={s.signInTxt}>Sign In</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or continue with</Text>
              <View style={s.divLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={handleGoogle}
              disabled={gLoading}
              activeOpacity={0.86}
            >
              {gLoading
                ? <ActivityIndicator color="#4285F4" size="small" />
                : <>
                    <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                    <Text style={s.googleTxt}>Continue with Google</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Sign Up */}
            <View style={s.signUpRow}>
              <Text style={s.signUpQ}>New to SkinVision? </Text>
              <TouchableOpacity onPress={() => router.push('/register' as any)}>
                <Text style={s.signUpLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Text style={s.footer}>
            By signing in you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Google Account Modal ── */}
      <Modal visible={showGoogleModal} transparent animationType="slide" onRequestClose={() => setShowGoogleModal(false)}>
        <View style={s.gOverlay}>
          <View style={s.gSheet}>
            <View style={s.gHandle} />
            {/* Google header */}
            <View style={s.gHeader}>
              <MaterialCommunityIcons name="google" size={28} color="#4285F4" />
              <View style={{ flex: 1 }}>
                <Text style={s.gTitle}>Sign in with Google</Text>
                <Text style={s.gSub}>Enter your Google account details</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)} style={s.gClose}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Name input */}
            <Text style={s.gLabel}>Full Name</Text>
            <View style={s.gInput}>
              <Ionicons name="person-outline" size={16} color="#94A3B8" />
              <TextInput
                style={s.gTxt}
                placeholder="Your full name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                value={googleName}
                onChangeText={setGoogleName}
              />
            </View>

            {/* Email input */}
            <Text style={s.gLabel}>Google Email</Text>
            <View style={s.gInput}>
              <MaterialCommunityIcons name="google" size={16} color="#94A3B8" />
              <TextInput
                style={s.gTxt}
                placeholder="yourname@gmail.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={googleEmail}
                onChangeText={setGoogleEmail}
              />
            </View>

            {/* Continue button */}
            <TouchableOpacity onPress={confirmGoogle} activeOpacity={0.85}>
              <LinearGradient colors={['#4285F4', '#1967D2']} style={s.gBtn}>
                <MaterialCommunityIcons name="google" size={18} color="white" />
                <Text style={s.gBtnTxt}>Continue with Google</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  blob:         { position: 'absolute', borderRadius: 999, opacity: 0.18 },
  blob1:        { width: 280, height: 280, backgroundColor: '#2563EB', top: -80, right: -80 },
  blob2:        { width: 200, height: 200, backgroundColor: '#7C3AED', bottom: 100, left: -60 },
  scroll:       { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 20 },

  brand:        { alignItems: 'center', paddingTop: H * 0.1, paddingBottom: 32 },
  logoWrap:     { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  appName:      { fontSize: 30, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.5, marginBottom: 6 },
  appTagline:   { fontSize: 13, color: '#94A3B8', letterSpacing: 0.3, marginBottom: 16 },
  badgeRow:     { flexDirection: 'row', gap: 10 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(110,231,183,0.12)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  badgeTxt:     { fontSize: 10, fontWeight: '600', color: '#6EE7B7', letterSpacing: 0.3 },

  card:         { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 12 },
  cardTitle:    { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3, marginBottom: 6 },
  cardSub:      { fontSize: 13, color: '#64748B', marginBottom: 22, lineHeight: 19 },

  label:        { fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.4, marginBottom: 8, textTransform: 'uppercase' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  inputRowFocused:{ borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  input:        { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  forgotRow:    { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotTxt:    { fontSize: 13, fontWeight: '600', color: '#2563EB' },

  signInBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 20, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  signInTxt:    { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.3 },

  divRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine:      { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  divTxt:       { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: 'white', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  googleTxt:    { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  signUpRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpQ:      { fontSize: 13, color: '#64748B' },
  signUpLink:   { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  footer:       { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 20, lineHeight: 16, opacity: 0.7 },

  errorBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorTxt:     { flex: 1, fontSize: 13, color: '#DC2626', lineHeight: 18 },

  // Google modal
  gOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  gSheet:       { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  gHandle:      { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  gHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  gTitle:       { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  gSub:         { fontSize: 12, color: '#64748B', marginTop: 1 },
  gClose:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  gLabel:       { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  gInput:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  gTxt:         { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  gBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 4 },
  gBtnTxt:      { fontSize: 15, fontWeight: '800', color: 'white', letterSpacing: 0.2 },
});
