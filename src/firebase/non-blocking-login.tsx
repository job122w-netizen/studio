'use client';
import {
  Auth,
  signInAnonymously,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

// Functions initiateEmailSignUp and initiateEmailSignIn are removed as they are now handled directly in auth/page.tsx
