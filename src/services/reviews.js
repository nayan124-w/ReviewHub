import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { updateCompanyRating } from './companies';
import { doc, deleteDoc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";


const reviewsRef = collection(db, 'reviews');

export const addReview = async (reviewData) => {
  // Check for duplicate review
  const q = query(
    reviewsRef,
    where('companyId', '==', reviewData.companyId),
    where('userId', '==', reviewData.userId)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error('You have already reviewed this company.');
  }

  const docRef = await addDoc(reviewsRef, {
    ...reviewData,
    createdAt: new Date().toISOString(),
    helpful: 0,
  });

  // Update company's average rating
  await updateCompanyRating(reviewData.companyId);

  return { id: docRef.id, ...reviewData };
};

export const getReviewsByCompany = async (companyId) => {
  const q = query(
    reviewsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getReviewsByUser = async (userId) => {
  const q = query(
   reviewsRef,
    where("userId", "==", userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  console.log("FIRESTORE RAW:", snapshot.docs.map(d => d.data())); // 🔥 ADD THIS

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteReview = async (reviewId) => {
  try {
    await deleteDoc(doc(db, "reviews", reviewId));
  } catch (error) {
    console.error("Delete error:", error);
  }
};

export const updateReview = async (reviewId, updatedData) => {
  try {
    await updateDoc(doc(db, "reviews", reviewId), updatedData);
  } catch (error) {
    console.error("Update error:", error);
  }
};
