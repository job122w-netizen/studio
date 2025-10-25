
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
    initializeApp();
}
const db = getFirestore();

/**
 * Creates or updates a user's public-facing ranking document.
 * This function is robust and handles potentially missing data.
 * @param userId The UID of the user.
 * @param userData The user's profile data.
 */
const updateUserRanking = async (userId: string, userData: any) => {
    const experiencePoints = userData?.experiencePoints || 0;
    const username = userData?.username || 'Usuario Anónimo';
    const imageUrl = userData?.imageUrl || `https://i.pravatar.cc/150?u=${userId}`;

    const rankingRef = db.collection('rankings').doc(userId);

    console.log(`Syncing ranking for user ${userId} with ${experiencePoints} XP, username: ${username}.`);

    return rankingRef.set({
        userId: userId,
        username: username,
        experiencePoints: experiencePoints,
        imageUrl: imageUrl,
    }, { merge: true });
};

/**
 * Triggers when a user's profile is updated to sync to the 'rankings' collection.
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
 * Triggers when a new user profile is created to create an entry in the 'rankings' collection.
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

/**
 * One-time function to sync all existing users to the rankings collection.
 * This can be triggered manually or run once upon deployment.
 */
export const syncAllUsersToRanking = functions.https.onCall(async (data, context) => {
    // Optional: Add authentication check to ensure only authorized users can run this.
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    console.log("Starting batch sync of all users to rankings.");

    try {
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();
        
        usersSnapshot.docs.forEach(doc => {
            const userId = doc.id;
            const userData = doc.data();
            const experiencePoints = userData.experiencePoints || 0;
            const username = userData.username || 'Usuario Anónimo';
            const imageUrl = userData.imageUrl || `https://i.pravatar.cc/150?u=${userId}`;

            const rankingRef = db.collection('rankings').doc(userId);
            batch.set(rankingRef, {
                userId,
                username,
                experiencePoints,
                imageUrl
            }, { merge: true });
        });

        await batch.commit();
        const count = usersSnapshot.size;
        console.log(`Successfully synced ${count} users to rankings.`);
        return { result: `Successfully synced ${count} users.` };

    } catch (error) {
        console.error("Error during batch sync:", error);
        throw new functions.https.HttpsError('internal', 'Failed to sync users to ranking.', error);
    }
});
