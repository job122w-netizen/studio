'use client';

import { doc, DocumentReference, getDoc, increment, writeBatch, arrayRemove } from "firebase/firestore";
import { firestore } from "@/firebase/client"; 
import { format, subDays, isSameDay } from 'date-fns';
import { toast } from "@/hooks/use-toast";

type StreakUpdateResult = {
    updated: boolean;
    newStreak: number;
}

// The ID of the streak shield item in the store
const STREAK_SHIELD_ID = 4;

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

        if (lastActivityDateStr) {
            const lastActivityDate = new Date(lastActivityDateStr);
            const yesterday = subDays(today, 1);
            
            if (isSameDay(lastActivityDate, yesterday)) {
                // Last activity was yesterday, increment streak.
                newStreak = currentStreak + 1;
                batch.update(userProfileRef, { 
                    currentStreak: increment(1),
                    lastActivityDate: todayStr,
                });
                streakUpdated = true;
            } else {
                // Streak is broken, check for a shield.
                const userItems = userData.userItems || [];
                const streakShield = userItems.find((item: any) => item.itemId === STREAK_SHIELD_ID);

                if (streakShield) {
                    // Shield found! Consume it and save the streak.
                    newStreak = currentStreak; // Streak does not increase, but it's not reset.
                    batch.update(userProfileRef, {
                        userItems: arrayRemove(streakShield),
                        lastActivityDate: todayStr, // Update date to consume shield for today
                    });
                    
                    toast({
                        title: "¡Racha Protegida!",
                        description: "Tu Escudo Protector ha sido utilizado para salvar tu racha.",
                    });
                    streakUpdated = true; // Technically updated to consume the shield
                } else {
                    // No shield, reset the streak.
                    newStreak = 1;
                    batch.update(userProfileRef, { 
                        currentStreak: 1,
                        lastActivityDate: todayStr,
                    });
                    streakUpdated = true;
                }
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