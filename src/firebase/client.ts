'use client';

import { initializeFirebase } from '.';

// Initialize Firebase and export the necessary services.
// This ensures that Firebase is initialized only once on the client-side.
export const { firestore, auth, firebaseApp } = initializeFirebase();
