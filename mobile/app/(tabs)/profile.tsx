import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getUser, logout, getMedicalProfile, saveMedicalProfile,
  type User, type MedicalProfile,
} from '../../utils/auth';

const { width: W } = Dimensions.get('window');

const GENDERS    = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_GRPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'];
const SKIN_TYPES = ['Type I (Very fair)', 'Type II (Fair)', 'Type III (Medium)', 'Type IV (Olive)', 'Type V (Brown)', 'Type VI (Dark)'];

const EMPTY: MedicalProfile = {
  age: '', gender: '', bloodGroup: '', skinType: '',
  knownConditions: '', allergies: '', emergencyContact: '',
};

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <LinearGradient colors={['#7C3AED', '#2563EB']} style={av.circle}>
      <Text style={av.txt}>{initials || '?'}</Text>
    </LinearGradient>
  );
}

const av = StyleSheet.create({
  circle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  txt:    { fontSize: 30, fontWeight: '900', color: 'white' },
});

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<MedicalProfile>(EMPTY);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [draft, setDraft]       = useState<MedicalProfile>(EMPTY);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      const mp = await getMedicalProfile();
      if (mp) { setProfile(mp); setDraft(mp); }
    })();
  }, []);

  const startEdit = () => { setDraft({ ...profile }); setEditing(true); };

  const cancelEdit = () => { setDraft({ ...profile }); setEditing(false); };

  const saveEdit = async () => {
    setSaving(true);
    await saveMedicalProfile(draft);
    setProfile({ ...draft });
    setSaving(false);
    setEditing(false);
    Alert.alert('Saved', 'Your medical profile has been updated.');
  };

  const handleLogout = async () => {
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

  const set = (field: keyof MedicalProfile) => (val: string) =>
    setDraft(d => ({ ...d, [field]: val }));

  const ProfileField = useCallback(({
    label, field, placeholder, multiline = false,
  }: { label: string; field: keyof MedicalProfile; placeholder: string; multiline?: boolean }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={[s.fieldInput, multiline && { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
          value={draft[field]}
          onChangeText={set(field)}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
        />
      ) : (
        <Text style={[s.fieldValue, !profile[field] && s.fieldEmpty]}>
          {profile[field] || '—'}
        </Text>
      )}
    </View>
  ), [editing, draft, profile]);

  const ChipSelect = useCallback(({
    label, field, options,
  }: { label: string; field: keyof MedicalProfile; options: string[] }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {editing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.chip, draft[field] === opt && s.chipActive]}
              onPress={() => setDraft(d => ({ ...d, [field]: opt }))}
            >
              <Text style={[s.chipTxt, draft[field] === opt && s.chipTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={[s.fieldValue, !profile[field] && s.fieldEmpty]}>
          {profile[field] || '—'}
        </Text>
      )}
    </View>
  ), [editing, draft, profile]);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* ── Header gradient ── */}
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            {user && <InitialsAvatar name={user.name} />}
            <Text style={s.userName}>{user?.name ?? '—'}</Text>
            <Text style={s.userEmail}>{user?.email ?? ''}</Text>
            <View style={s.memberBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#6EE7B7" />
              <Text style={s.memberTxt}>SkinVision Member</Text>
            </View>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
            <Text style={s.logoutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Medical Profile Card ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.cardTitleRow}>
            <LinearGradient colors={['#7C3AED', '#2563EB']} style={s.cardIcon}>
              <Ionicons name="medical" size={16} color="white" />
            </LinearGradient>
            <Text style={s.cardTitle}>Medical Profile</Text>
          </View>
          {!editing ? (
            <TouchableOpacity style={s.editBtn} onPress={startEdit}>
              <Ionicons name="pencil" size={14} color="#2563EB" />
              <Text style={s.editBtnTxt}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveEdit} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={s.saveBtnTxt}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={s.cardNote}>
          Your medical details help personalise scan reports and doctor consultations.
        </Text>

        <ProfileField label="Age" field="age" placeholder="e.g. 28" />
        <ChipSelect label="Gender" field="gender" options={GENDERS} />
        <ChipSelect label="Blood Group" field="bloodGroup" options={BLOOD_GRPS} />
        <ChipSelect label="Fitzpatrick Skin Type" field="skinType" options={SKIN_TYPES} />
        <ProfileField label="Known Skin Conditions" field="knownConditions" placeholder="e.g. Eczema, Psoriasis" multiline />
        <ProfileField label="Allergies" field="allergies" placeholder="e.g. Nickel, Latex, Fragrances" multiline />
        <ProfileField label="Emergency Contact" field="emergencyContact" placeholder="Name · Phone number" />
      </View>

      {/* ── Scan Stats ── */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <LinearGradient colors={['#0D9488', '#2563EB']} style={s.cardIcon}>
            <Ionicons name="stats-chart" size={16} color="white" />
          </LinearGradient>
          <Text style={s.cardTitle}>Your Scan Summary</Text>
        </View>
        <View style={s.statsRow}>
          {[
            { label: 'Total Scans', value: '—', icon: 'scan-outline' as const, color: '#2563EB' },
            { label: 'This Month',  value: '—', icon: 'calendar-outline' as const, color: '#7C3AED' },
            { label: 'High Risk',   value: '—', icon: 'warning-outline' as const,  color: '#EF4444' },
          ].map((st, i) => (
            <View key={i} style={s.statBox}>
              <Ionicons name={st.icon} size={20} color={st.color} />
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Privacy Note ── */}
      <View style={s.privacyBox}>
        <Ionicons name="lock-closed" size={14} color="#2563EB" />
        <Text style={s.privacyTxt}>
          Your data is stored <Text style={{ fontWeight: '700' }}>locally on your device only</Text>.
          Nothing is shared with third parties without your consent.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  header:        { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  headerRow:     { flexDirection: 'row', alignItems: 'flex-start' },
  userName:      { fontSize: 22, fontWeight: '900', color: '#F8FAFC', marginTop: 12, letterSpacing: -0.3 },
  userEmail:     { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  memberBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(110,231,183,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10 },
  memberTxt:     { fontSize: 10, fontWeight: '700', color: '#6EE7B7', letterSpacing: 0.3 },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  logoutTxt:     { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  // Cards
  card:          { backgroundColor: 'white', borderRadius: 20, marginHorizontal: 16, marginTop: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:      { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle:     { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardNote:      { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#E2E8F0', paddingLeft: 10 },

  // Edit controls
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  editBtnTxt:    { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  editActions:   { flexDirection: 'row', gap: 8 },
  cancelBtn:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnTxt:  { fontSize: 12, fontWeight: '600', color: '#64748B' },
  saveBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#2563EB', minWidth: 54, alignItems: 'center' },
  saveBtnTxt:    { fontSize: 12, fontWeight: '700', color: 'white' },

  // Fields
  fieldWrap:     { marginBottom: 14 },
  fieldLabel:    { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldValue:    { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  fieldEmpty:    { color: '#CBD5E1', fontStyle: 'italic' },
  fieldInput:    { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A' },

  // Chip selector
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', marginRight: 8, marginBottom: 4 },
  chipActive:    { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  chipTxt:       { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTxtActive: { color: '#2563EB', fontWeight: '700' },

  // Stats
  statsRow:      { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  statBox:       { alignItems: 'center', gap: 4 },
  statVal:       { fontSize: 20, fontWeight: '900' },
  statLbl:       { fontSize: 11, color: '#64748B', textAlign: 'center' },

  // Privacy
  privacyBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  privacyTxt:    { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 },
});
