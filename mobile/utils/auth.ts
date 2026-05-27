import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'skinvision_auth_v2';

export interface User {
  name: string;
  email: string;
  provider?: 'email' | 'google';
}

export const getUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? (JSON.parse(data) as User) : null;
  } catch {
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_KEY);
};
