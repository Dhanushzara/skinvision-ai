import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Alert,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveUser } from '../utils/auth';

const { height: H } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [focusField, setFocus]    = useState<string | null>(null);

  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to continue.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    await saveUser({ name: name.trim(), email: email.toLowerCase().trim(), provider: 'email' });
    setLoading(false);
    router.replace('/(tabs)');
  };

  const handleGoogle = async () => {
    setGLoading(true);
    await new Promise(r => setTimeout(r, 1300));
    await saveUser({ name: 'Google User', email: 'user@gmail.com', provider: 'google' });
    setGLoading(false);
    router.replace('/(tabs)');
  };

  const iStyle = (field: string) => [
    s.inputRow,
    focusField === field && s.inputRowFocused,
  ];

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#03091A', '#0A0720', '#0D0B2E']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          {/* Brand */}
          <View style={s.brand}>
            <LinearGradient colors={['#7C3AED', '#2563EB']} style={s.logoWrap}>
              <Ionicons name="person-add" size={30} color="white" />
            </LinearGradient>
            <Text style={s.appName}>Create Account</Text>
            <Text style={s.appTagline}>Join 10,000+ users on SkinVision AI</Text>
          </View>

          {/* Form card */}
          <Animated.View style={[s.card, { opacity: op, transform: [{ translateY: ty }] }]}>

            {/* Full Name */}
            <Text style={s.label}>Full Name</Text>
            <View style={iStyle('name')}>
              <Ionicons name="person-outline" size={18} color={focusField === 'name' ? '#7C3AED' : '#94A3B8'} />
              <TextInput
                style={s.input}
                placeholder="Dr. John Smith"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocus('name')}
                onBlur={() => setFocus(null)}
              />
            </View>

            {/* Email */}
            <Text style={s.label}>Email Address</Text>
            <View style={iStyle('email')}>
              <Ionicons name="mail-outline" size={18} color={focusField === 'email' ? '#7C3AED' : '#94A3B8'} />
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
            <View style={iStyle('pass')}>
              <Ionicons name="lock-closed-outline" size={18} color={focusField === 'pass' ? '#7C3AED' : '#94A3B8'} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Minimum 6 characters"
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

            {/* Confirm */}
            <Text style={s.label}>Confirm Password</Text>
            <View style={iStyle('conf')}>
              <Ionicons
                name={confirm && confirm === password ? 'checkmark-circle' : 'lock-closed-outline'}
                size={18}
                color={confirm && confirm === password ? '#10B981' : (focusField === 'conf' ? '#7C3AED' : '#94A3B8')}
              />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Re-enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConf}
                value={confirm}
                onChangeText={setConfirm}
                onFocus={() => setFocus('conf')}
                onBlur={() => setFocus(null)}
              />
              <TouchableOpacity onPress={() => setShowConf(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setAgreed(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, agreed && s.checkboxOn]}>
                {agreed && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text style={s.termsTxt}>
                I agree to the{' '}
                <Text style={s.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={s.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.86}>
              <LinearGradient
                colors={['#7C3AED', '#2563EB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.signInBtn, loading && { opacity: 0.72 }]}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : <>
                      <Ionicons name="person-add-outline" size={18} color="white" />
                      <Text style={s.signInTxt}>Create Account</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or</Text>
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
                    <Text style={s.googleTxt}>Sign up with Google</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Sign In */}
            <View style={s.signUpRow}>
              <Text style={s.signUpQ}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={s.signUpLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  blob:          { position: 'absolute', borderRadius: 999, opacity: 0.15 },
  blob1:         { width: 250, height: 250, backgroundColor: '#7C3AED', top: -60, left: -60 },
  blob2:         { width: 180, height: 180, backgroundColor: '#2563EB', bottom: 60, right: -40 },
  scroll:        { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 20 },

  topBar:        { paddingTop: 52, paddingBottom: 8 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  brand:         { alignItems: 'center', paddingBottom: 28 },
  logoWrap:      { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 10 },
  appName:       { fontSize: 26, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.3, marginBottom: 5 },
  appTagline:    { fontSize: 13, color: '#94A3B8' },

  card:          { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 12 },

  label:         { fontSize: 11, fontWeight: '700', color: '#374151', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  inputRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  inputRowFocused:{ borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
  input:         { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  termsRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: -4 },
  checkbox:      { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn:    { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  termsTxt:      { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 19 },
  termsLink:     { color: '#7C3AED', fontWeight: '600' },

  signInBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 20, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  signInTxt:     { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.3 },

  divRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine:       { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  divTxt:        { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: 'white', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  googleTxt:     { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  signUpRow:     { flexDirection: 'row', justifyContent: 'center' },
  signUpQ:       { fontSize: 13, color: '#64748B' },
  signUpLink:    { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
});
