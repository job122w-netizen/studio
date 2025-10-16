'use client';

import { doc, runTransaction, DocumentReference, FirestoreError } from 'firebase/firestore';
import { firestore } from '@/firebase/client-provider';

/**
 * Atomically updates the casino chips for a user using a Firestore transaction.
 * This function is safe to call even if the current chip value is NaN or not a number.
 *
 * @param userProfileRef Reference to the user's profile document.
 * @param amount The amount to add (can be positive or negative).
 */
export const updateCasinoChips = async (userProfileRef: DocumentReference, amount: number): Promise<void> => {
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userProfileRef);
            if (!userDoc.exists()) {
                throw new Error("User profile does not exist!");
            }

            const userData = userDoc.data();
            let currentChips = userData.casinoChips;

            // Data sanitization: If currentChips is not a valid number, reset it to 0.
            if (typeof currentChips !== 'number' || isNaN(currentChips)) {
                currentChips = 0;
            }

            const newChips = currentChips + amount;
            
            // Ensure the new balance doesn't go below zero
            const finalChips = Math.max(0, newChips);

            transaction.update(userProfileRef, { casinoChips: finalChips });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        // Optionally, you can re-throw or handle the error, e.g., show a toast to the user
        if (error instanceof FirestoreError) {
             // Handle Firestore-specific errors
        } else {
             // Handle generic errors
        }
    }
};
