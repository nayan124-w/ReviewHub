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
} from 'firebase/firestore';
import { db } from './firebase';

const companiesRef = collection(db, 'companies');

export const addCompany = async (companyData, userId) => {
  const docRef = await addDoc(companiesRef, {
    ...companyData,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    averageRating: 0,
    totalReviews: 0,
  });
  return { id: docRef.id, ...companyData };
};

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

export const updateCompanyRating = async (companyId) => {
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
