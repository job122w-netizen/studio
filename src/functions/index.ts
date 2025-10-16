
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

// This function is no longer the primary mechanism for ranking,
// but can be kept for future administrative tasks or a separate, more complex ranking system.
// For now, the client reads directly from the 'users' collection.
const updateUserRanking = async (userId: string, userData: any) => {
    const experiencePoints = userData?.experiencePoints || 0;
    const username = userData?.username || 'Usuario Anónimo';
    const imageUrl = userData?.imageUrl || `https://i.pravatar.cc/150?u=${userId}`;

    const rankingRef = db.collection('rankings').doc(userId);

    console.log(`Updating ranking for user ${userId} with ${experiencePoints} XP.`);

    return rankingRef.set({
        userId: userId,
        username: username,
        experiencePoints: experiencePoints,
        imageUrl: imageUrl,
    }, { merge: true });
};

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
