import * as Crypto from 'expo-crypto';

/**
 * Every offline-capable entity gets its permanent id here, on the device,
 * at creation time. That id is used locally immediately and, once the
 * sync engine pushes the row, becomes the row's id on the server too -
 * there's no separate "local id" that later needs remapping to a "server
 * id". This is the single biggest simplification in Anchor's offline
 * architecture.
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
