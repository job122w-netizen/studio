'use client';

import { doc, DocumentReference, getDoc, increment, writeBatch } from "firebase/firestore";
import { firestore } from "@/firebase/client"; // Corrected import
import { format, subDays, isSameDay } from 'date-fns';

/**
 * Updates the user's activity streak.
 *
 * @param userProfileRef Reference to the user's profile document.
 */
export const updateUserStreak = async (userProfileRef: DocumentReference) => {
    try {
        const userDoc = await getDoc(userProfileRef);
        if (!userDoc.exists()) {
            console.log("User profile does not exist, cannot update streak.");
            return;
        }

        const userData = userDoc.data();
        const lastActivityDateStr = userData.lastActivityDate;
        const currentStreak = userData.currentStreak || 0;
        
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        // If last activity was today, do nothing.
        if (lastActivityDateStr === todayStr) {
            return;
        }

        const batch = writeBatch(firestore);

        // If there was a last activity date, check it.
        if (lastActivityDateStr) {
            const lastActivityDate = new Date(lastActivityDateStr);
            const yesterday = subDays(today, 1);
            
            // If last activity was yesterday, increment streak.
            if (isSameDay(lastActivityDate, yesterday)) {
                batch.update(userProfileRef, { 
                    currentStreak: increment(1),
                    lastActivityDate: todayStr,
                });
            } else {
                // If it wasn't yesterday, the streak is broken. Reset to 1.
                batch.update(userProfileRef, { 
                    currentStreak: 1,
                    lastActivityDate: todayStr,
                });
            }
        } else {
            // No last activity date, start a new streak.
            batch.update(userProfileRef, { 
                currentStreak: 1,
                lastActivityDate: todayStr
            });
        }
        
        await batch.commit();

    } catch (error) {
        console.error("Error updating user streak:", error);
    }
};
