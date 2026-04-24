import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebase';

/* ──────────────────────────────────────────────
   COMPANY REGISTRATION
   Creates a Firebase Auth user + a companyUsers doc.
   Also creates the company profile doc.
   Also creates a 'companies' collection doc so users can
   review the company immediately.
   ────────────────────────────────────────────── */
export const registerCompany = async (email, password, companyData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: companyData.name });

  // Create company user document (for auth/role detection)
  await setDoc(doc(db, 'companyUsers', user.uid), {
    userId: user.uid,
    email: user.email,
    role: 'company',
    companyName: companyData.name,
    createdAt: serverTimestamp(),
  });

  // Create company profile document
  await setDoc(doc(db, 'companyProfiles', user.uid), {
    userId: user.uid,
    name: companyData.name,
    about: companyData.about || '',
    industry: companyData.industry || '',
    location: companyData.location || '',
    website: companyData.website || '',
    founded: companyData.founded || '',
    size: companyData.size || '',
    averageRating: 0,
    totalReviews: 0,
    featured: false,
    createdAt: serverTimestamp(),
  });

  // Also create a document in the 'companies' collection
  // so users can find and review this company immediately
  const companiesRef = collection(db, 'companies');
  await addDoc(companiesRef, {
    name: companyData.name,
    industry: companyData.industry || '',
    location: companyData.location || '',
    website: companyData.website || '',
    description: companyData.about || '',
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    averageRating: 0,
    totalReviews: 0,
  });

  return user;
};

/* ──────────────────────────────────────────────
   COMPANY LOGIN
   ────────────────────────────────────────────── */
export const loginCompany = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Verify this is a company account
  const companyDoc = await getDoc(doc(db, 'companyUsers', userCredential.user.uid));
  if (!companyDoc.exists() || companyDoc.data().role !== 'company') {
    await signOut(auth);
    throw new Error('This account is not registered as a company. Please use employee login.');
  }
  return userCredential.user;
};

/* ──────────────────────────────────────────────
   GET COMPANY ACCOUNT DATA
   ────────────────────────────────────────────── */
export const getCompanyUser = async (uid) => {
  const companyDoc = await getDoc(doc(db, 'companyUsers', uid));
  if (companyDoc.exists()) {
    return companyDoc.data();
  }
  return null;
};

/* ──────────────────────────────────────────────
   GET COMPANY PROFILE
   ────────────────────────────────────────────── */
export const getCompanyProfile = async (uid) => {
  const profileDoc = await getDoc(doc(db, 'companyProfiles', uid));
  if (profileDoc.exists()) {
    return { id: profileDoc.id, ...profileDoc.data() };
  }
  return null;
};

/* ──────────────────────────────────────────────
   UPDATE COMPANY PROFILE
   ────────────────────────────────────────────── */
export const updateCompanyProfile = async (uid, data) => {
  const profileRef = doc(db, 'companyProfiles', uid);
  const allowedFields = {};
  
  if (data.name !== undefined) allowedFields.name = data.name;
  if (data.about !== undefined) allowedFields.about = data.about;
  if (data.industry !== undefined) allowedFields.industry = data.industry;
  if (data.location !== undefined) allowedFields.location = data.location;
  if (data.website !== undefined) allowedFields.website = data.website;
  if (data.founded !== undefined) allowedFields.founded = data.founded;
  if (data.size !== undefined) allowedFields.size = data.size;

  await updateDoc(profileRef, allowedFields);
};

/* ──────────────────────────────────────────────
   CHECK IF USER IS COMPANY
   ────────────────────────────────────────────── */
export const isCompanyUser = async (uid) => {
  const companyDoc = await getDoc(doc(db, 'companyUsers', uid));
  return companyDoc.exists() && companyDoc.data().role === 'company';
};

/* ──────────────────────────────────────────────
   COMPANY LOGOUT
   ────────────────────────────────────────────── */
export const logoutCompany = async () => {
  await signOut(auth);
};

// ──────────────────────────────────────────────
// 🔒 Monetization (Disabled by default)
// ──────────────────────────────────────────────

// export const markCompanyFeatured = async (companyId, paymentToken) => {
//   // Integrate Razorpay / Stripe here
//   // const paymentResult = await processPayment(paymentToken, 999);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   // await updateDoc(doc(db, 'companyProfiles', companyId), {
//   //   featured: true,
//   //   featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//   // });
// };

// export const purchasePremiumBadge = async (companyId, paymentToken) => {
//   // const paymentResult = await processPayment(paymentToken, 1999);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   // await updateDoc(doc(db, 'companyProfiles', companyId), {
//   //   premiumBadge: true,
//   //   premiumUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
//   // });
// };
