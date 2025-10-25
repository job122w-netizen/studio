'use client';

import { initializeFirebase } from '.';
import { getFirestore, runTransaction } from 'firebase/firestore';

// Initialize Firebase and export the necessary services.
// This ensures that Firebase is initialized only once on the client-side.
export const { auth, firebaseApp } = initializeFirebase();

// We need a separate, client-side instance of firestore for transactions
// to avoid context issues with the one provided by the provider.
const firestore = getFirestore(firebaseApp);
export { firestore };
