
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

/**
 * Creates or updates a user's public-facing ranking document.
 * This function is designed to be robust and handle potentially missing data from the user profile.
 * @param userId The UID of the user.
 * @param userData The user's profile data.
 */
const updateUserRanking = async (userId: string, userData: any) => {
    // Ensure that experiencePoints is always a number, defaulting to 0 if missing or not a number.
    const experiencePoints = userData?.experiencePoints || 0;
    
    // Provide a default username if it's missing.
    const username = userData?.username || 'Usuario Anónimo';
    
    // Provide a default avatar image.
    const imageUrl = userData?.imageUrl || `https://i.pravatar.cc/150?u=${userId}`;

    const rankingRef = db.collection('rankings').doc(userId);

    console.log(`Syncing ranking for user ${userId} with ${experiencePoints} XP, username: ${username}.`);

    // Use set with merge:true to create the document if it doesn't exist, or update it if it does.
    return rankingRef.set({
        userId: userId,
        username: username,
        experiencePoints: experiencePoints,
        imageUrl: imageUrl,
    }, { merge: true });
};

/**
 * Cloud Function that triggers when a user's profile document is updated.
 * It syncs the relevant data to the public 'rankings' collection.
 */
export const onUserUpdateSyncRanking = onDocumentUpdated("/users/{userId}", async (event) => {
    try {
        const userId = event.params.userId;
        const newData = event.data?.after.data();
        
        if (newData) {
            await updateUserRanking(userId, newData);
        }
    } catch (error) {
        console.error("Error in onUserUpdateSyncRanking:", error);
    }
});

/**
 * Cloud Function that triggers when a new user profile document is created.
 * It creates the initial entry in the public 'rankings' collection for the new user.
 */
export const onUserCreateSyncRanking = onDocumentCreated("/users/{userId}", async (event) => {
     try {
        const userId = event.params.userId;
        const newData = event.data?.data();
        
        if (newData) {
            await updateUserRanking(userId, newData);
        }
    } catch (error) {
        console.error("Error in onUserCreateSyncRanking:", error);
    }
});
