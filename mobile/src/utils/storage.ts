import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'jwt_token';

/**
 * Persist the JWT access token in encrypted device storage.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Retrieve the stored JWT, or null if none exists.
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Remove the stored JWT (logout).
 */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
