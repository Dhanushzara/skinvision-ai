import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY  = 'skinvision_session_v1';
const ACCOUNTS_KEY = 'skinvision_accounts_v1';
const MEDICAL_KEY  = 'skinvision_medical_v1';

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface User {
  name: string;
  email: string;
  provider?: 'email' | 'google';
}

export interface MedicalProfile {
  age: string;
  gender: string;
  bloodGroup: string;
  skinType: string;
  knownConditions: string;
  allergies: string;
  emergencyContact: string;
}

interface StoredAccount {
  name: string;
  email: string;
  password: string;
}

// ── Session ───────────────────────────────────────────────────────────────────
export const getUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? (JSON.parse(data) as User) : null;
  } catch {
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
};

// ── Account Storage ───────────────────────────────────────────────────────────
const getAccounts = async (): Promise<StoredAccount[]> => {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return data ? (JSON.parse(data) as StoredAccount[]) : [];
  } catch {
    return [];
  }
};

const saveAccounts = async (accounts: StoredAccount[]): Promise<void> => {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> => {
  const accounts = await getAccounts();
  const exists = accounts.find(
    a => a.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (exists) {
    return {
      success: false,
      error: 'An account with this email already exists.\nPlease sign in instead.',
    };
  }
  const account: StoredAccount = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  };
  await saveAccounts([...accounts, account]);
  await saveUser({ name: account.name, email: account.email, provider: 'email' });
  return { success: true };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> => {
  const accounts = await getAccounts();
  const account = accounts.find(
    a => a.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (!account) {
    return {
      success: false,
      error: 'No account found with this email.\nPlease create an account first.',
    };
  }
  if (account.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
  await saveUser({ name: account.name, email: account.email, provider: 'email' });
  return { success: true };
};

// ── Medical Profile ───────────────────────────────────────────────────────────
export const getMedicalProfile = async (): Promise<MedicalProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(MEDICAL_KEY);
    return data ? (JSON.parse(data) as MedicalProfile) : null;
  } catch {
    return null;
  }
};

export const saveMedicalProfile = async (profile: MedicalProfile): Promise<void> => {
  await AsyncStorage.setItem(MEDICAL_KEY, JSON.stringify(profile));
};
