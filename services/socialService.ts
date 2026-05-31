
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  where,
  getDocs,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { handleFirestoreError, OperationType } from './errorService';

export const followUser = async (currentUid: string, targetUid: string) => {
  if (currentUid === targetUid) return;

  const followRef = doc(db, 'follows', `${currentUid}_${targetUid}`);
  const followerRef = doc(db, 'users', targetUid, 'followers', currentUid);
  const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
  
  const batch = writeBatch(db);
  
  batch.set(followRef, {
    followerId: currentUid,
    followingId: targetUid,
    timestamp: serverTimestamp()
  });
  
  batch.set(followerRef, { timestamp: serverTimestamp() });
  batch.set(followingRef, { timestamp: serverTimestamp() });
  
  // Update counts
  const targetPublicRef = doc(db, 'public_users', targetUid);
  const currentPublicRef = doc(db, 'public_users', currentUid);
  const targetStatsRef = doc(db, 'users', targetUid, 'stats', 'current');
  const currentStatsRef = doc(db, 'users', currentUid, 'stats', 'current');
  
  batch.update(targetPublicRef, { followersCount: increment(1) });
  batch.update(currentPublicRef, { followingCount: increment(1) });
  batch.update(targetStatsRef, { followersCount: increment(1) });
  batch.update(currentStatsRef, { followingCount: increment(1) });
  
  try {
    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'batch_follow');
  }
};

export const unfollowUser = async (currentUid: string, targetUid: string) => {
  const followRef = doc(db, 'follows', `${currentUid}_${targetUid}`);
  const followerRef = doc(db, 'users', targetUid, 'followers', currentUid);
  const followingRef = doc(db, 'users', currentUid, 'following', targetUid);

  const batch = writeBatch(db);
  
  batch.delete(followRef);
  batch.delete(followerRef);
  batch.delete(followingRef);
  
  // Update counts
  const targetPublicRef = doc(db, 'public_users', targetUid);
  const currentPublicRef = doc(db, 'public_users', currentUid);
  const targetStatsRef = doc(db, 'users', targetUid, 'stats', 'current');
  const currentStatsRef = doc(db, 'users', currentUid, 'stats', 'current');
  
  batch.update(targetPublicRef, { followersCount: increment(-1) });
  batch.update(currentPublicRef, { followingCount: increment(-1) });
  batch.update(targetStatsRef, { followersCount: increment(-1) });
  batch.update(currentStatsRef, { followingCount: increment(-1) });
  
  try {
    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'batch_unfollow');
  }
};

export const isFollowing = async (currentUid: string, targetUid: string): Promise<boolean> => {
  const followRef = doc(db, 'follows', `${currentUid}_${targetUid}`);
  try {
    const snap = await getDoc(followRef);
    return snap.exists();
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, followRef.path);
    return false;
  }
};

export const getFollowers = (uid: string, callback: (followers: string[]) => void) => {
  const followersRef = collection(db, 'users', uid, 'followers');
  return onSnapshot(followersRef, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.id));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, followersRef.path);
  });
};

export const getFollowing = (uid: string, callback: (following: string[]) => void) => {
  const followingRef = collection(db, 'users', uid, 'following');
  return onSnapshot(followingRef, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.id));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, followingRef.path);
  });
};

export const createPost = async (uid: string, name: string, head: number, content: string, type: 'text' | 'song' | 'car' = 'text', meta?: any) => {
  const postsRef = collection(db, 'posts');
  
  const postData = {
    authorId: uid,
    authorName: name,
    authorHead: head,
    content,
    timestamp: serverTimestamp(),
    type,
    meta: meta || {}
  };

  try {
    await addDoc(postsRef, postData);
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, postsRef.path);
  }
};
