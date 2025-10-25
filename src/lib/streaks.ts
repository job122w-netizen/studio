'use client';

import { doc, DocumentReference, getDoc, increment, writeBatch } from "firebase/firestore";
import { firestore } from "@/firebase/client"; // Corrected import
import { format, subDays, isSameDay } from 'date-fns';

type StreakUpdateResult = {
    updated: boolean;
    newStreak: number;
}

/**
 * Updates the user's activity streak.
 *
 * @param userProfileRef Reference to the user's profile document.
 * @returns An object indicating if the streak was updated and the new streak value.
 */
export const updateUserStreak = async (userProfileRef: DocumentReference): Promise<StreakUpdateResult> => {
    try {
        const userDoc = await getDoc(userProfileRef);
        if (!userDoc.exists()) {
            console.log("User profile does not exist, cannot update streak.");
            return { updated: false, newStreak: 0 };
        }

        const userData = userDoc.data();
        const lastActivityDateStr = userData.lastActivityDate;
        const currentStreak = userData.currentStreak || 0;
        
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        // If last activity was today, do nothing.
        if (lastActivityDateStr === todayStr) {
            return { updated: false, newStreak: currentStreak };
        }

        const batch = writeBatch(firestore);
        let newStreak = currentStreak;
        let streakUpdated = false;

        // If there was a last activity date, check it.
        if (lastActivityDateStr) {
            const lastActivityDate = new Date(lastActivityDateStr);
            const yesterday = subDays(today, 1);
            
            // If last activity was yesterday, increment streak.
            if (isSameDay(lastActivityDate, yesterday)) {
                newStreak = currentStreak + 1;
                batch.update(userProfileRef, { 
                    currentStreak: increment(1),
                    lastActivityDate: todayStr,
                });
                streakUpdated = true;
            } else {
                // If it wasn't yesterday, the streak is broken. Reset to 1.
                newStreak = 1;
                batch.update(userProfileRef, { 
                    currentStreak: 1,
                    lastActivityDate: todayStr,
                });
                streakUpdated = true;
            }
        } else {
            // No last activity date, start a new streak.
            newStreak = 1;
            batch.update(userProfileRef, { 
                currentStreak: 1,
                lastActivityDate: todayStr
            });
            streakUpdated = true;
        }
        
        await batch.commit();

        return { updated: streakUpdated, newStreak: newStreak };

    } catch (error) {
        console.error("Error updating user streak:", error);
        return { updated: false, newStreak: 0 };
    }
};
