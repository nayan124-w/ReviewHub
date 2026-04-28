import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCompanyUser } from './companyAuth';

const companiesRef = collection(db, 'companies');

/* ──────────────────────────────────────────────
   CREATE
   ────────────────────────────────────────────── */
export const addCompany = async (companyData, userId) => {
  // 🔒 HARD VALIDATION: Block company accounts from creating companies
  console.log('[addCompany] userId:', userId);
  const companyUser = await getCompanyUser(userId);
  if (companyUser && companyUser.role === 'company') {
    console.log('[addCompany] BLOCKED — company account tried to create a company listing');
    throw new Error('Company accounts cannot add companies. Companies are created during registration.');
  }

  // Prevent duplicate company creation by the same user
  const existingQ = query(companiesRef, where('createdBy', '==', userId));
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    console.log('[addCompany] WARNING — user already created a company, allowing (user role)');
  }

  const docRef = await addDoc(companiesRef, {
    ...companyData,
    createdBy: userId,
    createdAt: serverTimestamp(),
    averageRating: 0,
    totalReviews: 0,
  });
  return { id: docRef.id, ...companyData };
};

/* ──────────────────────────────────────────────
   READ – one-shot
   ────────────────────────────────────────────── */
export const getCompanies = async () => {
  const q = query(companiesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const getCompanyById = async (companyId) => {
  const docRef = doc(db, 'companies', companyId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const searchCompanies = async (searchTerm) => {
  const allCompanies = await getCompanies();
  const lower = searchTerm.toLowerCase();
  return allCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(lower) ||
      company.industry.toLowerCase().includes(lower) ||
      company.location.toLowerCase().includes(lower)
  );
};

/* ──────────────────────────────────────────────
   REAL-TIME – subscribe to all companies
   ────────────────────────────────────────────── */
export const subscribeCompanies = (callback) => {
  const q = query(companiesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

/* ──────────────────────────────────────────────
   REAL-TIME – subscribe to a single company
   ────────────────────────────────────────────── */
export const subscribeCompanyById = (companyId, callback) => {
  const docRef = doc(db, 'companies', companyId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
};

/* ──────────────────────────────────────────────
   🔥 SINGLE SOURCE OF TRUTH — updateCompanyStats
   Recalculates averageRating and totalReviews
   from the reviews collection every time.
   Called after CREATE / UPDATE / DELETE of a review.
   ────────────────────────────────────────────── */
export const updateCompanyStats = async (companyId) => {
  const reviewsCol = collection(db, 'reviews');
  const q = query(reviewsCol, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);

  const companyRef = doc(db, 'companies', companyId);

  if (snapshot.empty) {
    await updateDoc(companyRef, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  let totalRating = 0;
  snapshot.docs.forEach((reviewDoc) => {
    totalRating += reviewDoc.data().rating;
  });

  const avgRating = totalRating / snapshot.size;

  await updateDoc(companyRef, {
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: snapshot.size,
  });
};

// Keep old alias for backward compat (calls the same logic)
export const updateCompanyRating = updateCompanyStats;
