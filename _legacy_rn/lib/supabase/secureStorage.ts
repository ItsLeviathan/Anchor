import * as SecureStore from 'expo-secure-store';

/**
 * Supabase auth sessions are persisted through the device's secure enclave
 * (iOS Keychain / Android Keystore) rather than plain AsyncStorage, per the
 * "secure token storage" requirement in the privacy & security spec.
 *
 * SecureStore has a per-item size ceiling (~2KB) that a full session object
 * (access token + refresh token + user metadata) can exceed, so values are
 * split into chunks on write and reassembled on read.
 */

const CHUNK_SIZE = 1800;

async function chunkCount(key: string): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(`${key}_chunks`);
  return raw ? parseInt(raw, 10) : null;
}

export const ExpoSecureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const count = await chunkCount(key);
    if (count === null) {
      return null;
    }

    let value = '';
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}_${i}`);
      if (part == null) {
        return null;
      }
      value += part;
    }
    return value;
  },

  async setItem(key: string, value: string): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)));
  },

  async removeItem(key: string): Promise<void> {
    const count = await chunkCount(key);
    if (count !== null) {
      await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`))
      );
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
  },
};
