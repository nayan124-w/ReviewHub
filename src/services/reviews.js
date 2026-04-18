import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { updateCompanyStats } from './companies';

const reviewsRef = collection(db, 'reviews');

/* ──────────────────────────────────────────────
   VALIDATION — check for duplicate review
   ────────────────────────────────────────────── */
export const hasUserReviewedCompany = async (userId, companyId) => {
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    where('companyId', '==', companyId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/* ──────────────────────────────────────────────
   CREATE
   ────────────────────────────────────────────── */
export const addReview = async (reviewData) => {
  // Enforce one review per user per company
  const alreadyReviewed = await hasUserReviewedCompany(
    reviewData.userId,
    reviewData.companyId
  );
  if (alreadyReviewed) {
    throw new Error('You have already reviewed this company.');
  }

  const docRef = await addDoc(reviewsRef, {
    userId: reviewData.userId,
    companyId: reviewData.companyId,
    rating: reviewData.rating,
    title: reviewData.title || '',
    description: reviewData.description,
    userName: reviewData.userName || 'Anonymous',
    userCollege: reviewData.userCollege || '',
    isAnonymous: reviewData.isAnonymous || false,
    proofType: reviewData.proofType || null,   // 'image' | 'text' | null
    proofUrl: reviewData.proofUrl || null,       // storage URL or text proof
    createdAt: serverTimestamp(),
    helpful: 0,
    helpfulBy: [],
    notHelpful: 0,
    notHelpfulBy: [],
    companyReply: null,
    companyReplyAt: null,
  });

  // Recalculate company stats
  await updateCompanyStats(reviewData.companyId);

  return { id: docRef.id, ...reviewData };
};

/* ──────────────────────────────────────────────
   READ — one-shot helpers
   ────────────────────────────────────────────── */
export const getReviewsByCompany = async (companyId) => {
  const q = query(
    reviewsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getReviewsByUser = async (userId) => {
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/* ──────────────────────────────────────────────
   REAL-TIME — subscribe to reviews by company
   ────────────────────────────────────────────── */
export const subscribeReviewsByCompany = (companyId, callback) => {
  const q = query(
    reviewsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

/* ──────────────────────────────────────────────
   REAL-TIME — subscribe to reviews by user
   ────────────────────────────────────────────── */
export const subscribeReviewsByUser = (userId, callback) => {
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

/* ──────────────────────────────────────────────
   UPDATE
   ────────────────────────────────────────────── */
export const updateReview = async (reviewId, updatedData) => {
  const reviewRef = doc(db, 'reviews', reviewId);

  // Only allow updating safe fields
  const allowedFields = {};
  if (updatedData.rating !== undefined) allowedFields.rating = updatedData.rating;
  if (updatedData.title !== undefined) allowedFields.title = updatedData.title;
  if (updatedData.description !== undefined) allowedFields.description = updatedData.description;
  if (updatedData.proofType !== undefined) allowedFields.proofType = updatedData.proofType;
  if (updatedData.proofUrl !== undefined) allowedFields.proofUrl = updatedData.proofUrl;

  await updateDoc(reviewRef, allowedFields);

  // Recalculate company stats
  const reviewSnap = await getDoc(reviewRef);
  const companyId = reviewSnap.data().companyId;
  await updateCompanyStats(companyId);
};

/* ──────────────────────────────────────────────
   DELETE
   ────────────────────────────────────────────── */
export const deleteReview = async (reviewId) => {
  const reviewRef = doc(db, 'reviews', reviewId);

  // Get companyId BEFORE deleting
  const reviewSnap = await getDoc(reviewRef);
  if (!reviewSnap.exists()) return;

  const companyId = reviewSnap.data().companyId;
  await deleteDoc(reviewRef);

  // Recalculate company stats
  await updateCompanyStats(companyId);
};

/* ──────────────────────────────────────────────
   ⭐ HELPFUL SYSTEM — toggle helpful vote
   ────────────────────────────────────────────── */
export const toggleHelpful = async (reviewId, userId) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  const reviewSnap = await getDoc(reviewRef);
  
  if (!reviewSnap.exists()) throw new Error('Review not found');
  
  const data = reviewSnap.data();
  const helpfulBy = data.helpfulBy || [];
  const notHelpfulBy = data.notHelpfulBy || [];
  
  if (helpfulBy.includes(userId)) {
    // Remove helpful vote
    await updateDoc(reviewRef, {
      helpful: Math.max((data.helpful || 1) - 1, 0),
      helpfulBy: arrayRemove(userId),
    });
    return false; // un-voted
  } else {
    // Add helpful vote (remove notHelpful if exists)
    const updates = {
      helpful: (data.helpful || 0) + 1,
      helpfulBy: arrayUnion(userId),
    };
    if (notHelpfulBy.includes(userId)) {
      updates.notHelpful = Math.max((data.notHelpful || 1) - 1, 0);
      updates.notHelpfulBy = arrayRemove(userId);
    }
    await updateDoc(reviewRef, updates);
    return true; // voted helpful
  }
};

/* ──────────────────────────────────────────────
   👎 NOT HELPFUL SYSTEM — toggle not-helpful vote
   Mutually exclusive with helpful.
   ────────────────────────────────────────────── */
export const toggleNotHelpful = async (reviewId, userId) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  const reviewSnap = await getDoc(reviewRef);
  
  if (!reviewSnap.exists()) throw new Error('Review not found');
  
  const data = reviewSnap.data();
  const notHelpfulBy = data.notHelpfulBy || [];
  const helpfulBy = data.helpfulBy || [];
  
  if (notHelpfulBy.includes(userId)) {
    // Remove not-helpful vote
    await updateDoc(reviewRef, {
      notHelpful: Math.max((data.notHelpful || 1) - 1, 0),
      notHelpfulBy: arrayRemove(userId),
    });
    return false; // un-voted
  } else {
    // Add not-helpful vote (remove helpful if exists)
    const updates = {
      notHelpful: (data.notHelpful || 0) + 1,
      notHelpfulBy: arrayUnion(userId),
    };
    if (helpfulBy.includes(userId)) {
      updates.helpful = Math.max((data.helpful || 1) - 1, 0);
      updates.helpfulBy = arrayRemove(userId);
    }
    await updateDoc(reviewRef, updates);
    return true; // voted not-helpful
  }
};

/* ──────────────────────────────────────────────
   💬 COMPANY REPLY to a review
   Companies can reply ONCE to each review.
   ────────────────────────────────────────────── */
export const addCompanyReply = async (reviewId, replyText) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  await updateDoc(reviewRef, {
    companyReply: replyText.trim(),
    companyReplyAt: serverTimestamp(),
  });
};

export const deleteCompanyReply = async (reviewId) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  await updateDoc(reviewRef, {
    companyReply: null,
    companyReplyAt: null,
  });
};
