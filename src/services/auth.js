import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from './firebase';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Register a new user with optional college field.
 */
export const registerUser = async (email, password, displayName, college = '') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, 'users', user.uid), {
    userId: user.uid,
    email: user.email,
    displayName,
    college: college || '',
    createdAt: serverTimestamp(),
    reviewCount: 0,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
};

/**
 * Fetch all unique college names from the users collection.
 * Used for the "Filter by College" dropdown in Browse Reviews.
 */
export const getUniqueColleges = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  const colleges = new Set();
  snapshot.docs.forEach((doc) => {
    const college = doc.data().college;
    if (college && college.trim()) {
      colleges.add(college.trim());
    }
  });
  return Array.from(colleges).sort();
};
