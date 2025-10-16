
import { onUserCreate, onUserUpdate } from 'firebase-functions/v2/identity';
import { getFirestore } from 'firebase-admin/firestore';
import {initializeApp} from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

// Function to update or create a user's ranking document
const updateUserRanking = async (user: any) => {
    const { uid, displayName, photoURL } = user;

    // We need to fetch the user's experience points from their profile
    const userProfileRef = db.collection('users').doc(uid);
    const userProfileSnap = await userProfileRef.get();

    if (!userProfileSnap.exists) {
        console.log(`User profile for ${uid} does not exist yet.`);
        // The profile might be created shortly after the user is created.
        // The onUpdate trigger will handle this case later.
        return;
    }

    const userProfileData = userProfileSnap.data();
    const experiencePoints = userProfileData?.experiencePoints || 0;
    const username = userProfileData?.username || displayName || 'Usuario Anónimo';
    const imageUrl = userProfileData?.imageUrl || photoURL || `https://i.pravatar.cc/150?u=${uid}`;

    const rankingRef = db.collection('rankings').doc(uid);

    console.log(`Updating ranking for user ${uid} with ${experiencePoints} XP.`);

    return rankingRef.set({
        userId: uid,
        username: username,
        experiencePoints: experiencePoints,
        imageUrl: imageUrl,
    }, { merge: true });
};

// Trigger when a user document in the 'users' collection is updated
export const onUserProfileUpdate = onUserUpdate(async (event) => {
    try {
        await updateUserRanking(event.data);
    } catch (error) {
        console.error("Error in onUserProfileUpdate:", error);
    }
});

// Trigger when a new Firebase Authentication user is created
export const onNewUserCreate = onUserCreate(async (event) => {
    try {
        // We call this to create an initial ranking document, 
        // even though XP will be 0. It will be updated later.
        await updateUserRanking(event.data);
    } catch (error) {
        console.error("Error in onNewUserCreate:", error);
    }
});
