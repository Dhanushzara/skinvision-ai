import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanResult } from '../types/scan';

const KEY = 'skinvision_scans_v2';

export async function getCachedScans(): Promise<ScanResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScanResult[]) : [];
  } catch {
    return [];
  }
}

export async function cacheScan(scan: ScanResult): Promise<void> {
  try {
    const existing = await getCachedScans();
    const updated = [scan, ...existing.filter((s) => s.id !== scan.id)].slice(0, 50);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // silently ignore storage failures
  }
}

export async function cacheScans(scans: ScanResult[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(scans.slice(0, 50)));
  } catch {
    // silently ignore
  }
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
