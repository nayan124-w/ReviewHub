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
} from 'firebase/firestore';
import { db } from './firebase';

const jobsRef = collection(db, 'jobs');

/* ──────────────────────────────────────────────
   CREATE JOB
   ────────────────────────────────────────────── */
export const createJob = async (jobData) => {
  // Compute expiry
  const durationDays = jobData.durationDays ? Number(jobData.durationDays) : null;
  const expiresAt = durationDays && durationDays > 0
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  const docRef = await addDoc(jobsRef, {
    companyId: jobData.companyId,
    companyName: jobData.companyName || '',
    title: jobData.title,
    description: jobData.description || '',
    salary: jobData.salary || '',
    location: jobData.location || '',
    type: jobData.type || 'Full-time', // Full-time, Part-time, Internship, Contract
    applyLink: jobData.applyLink || '',
    createdAt: serverTimestamp(),
    active: true,
    durationDays: durationDays,
    expiresAt: expiresAt,
  });
  return { id: docRef.id, ...jobData };
};

/* ──────────────────────────────────────────────
   READ — all active jobs
   ────────────────────────────────────────────── */
export const getJobs = async () => {
  const q = query(jobsRef, where('active', '==', true), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const now = new Date();
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((job) => {
      // Auto-expire: skip jobs past their expiresAt
      if (!job.expiresAt) return true;
      const expiry = job.expiresAt.seconds
        ? new Date(job.expiresAt.seconds * 1000)
        : new Date(job.expiresAt);
      return expiry > now;
    });
};

/* ──────────────────────────────────────────────
   READ — jobs by company
   ────────────────────────────────────────────── */
export const getJobsByCompany = async (companyId) => {
  const q = query(
    jobsRef,
    where('companyId', '==', companyId),
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/* ──────────────────────────────────────────────
   REAL-TIME — subscribe to all active jobs
   ────────────────────────────────────────────── */
export const subscribeJobs = (callback) => {
  const q = query(jobsRef, where('active', '==', true), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const now = new Date();
    const data = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((job) => {
        // Auto-expire: skip jobs past their expiresAt
        if (!job.expiresAt) return true;
        const expiry = job.expiresAt.seconds
          ? new Date(job.expiresAt.seconds * 1000)
          : new Date(job.expiresAt);
        return expiry > now;
      });
    callback(data);
  });
};

/* ──────────────────────────────────────────────
   REAL-TIME — subscribe to jobs by company
   ────────────────────────────────────────────── */
export const subscribeJobsByCompany = (companyId, callback) => {
  // Company sees ALL their jobs (including expired) for management
  const q = query(
    jobsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((job) => job.active !== false); // only exclude manually deactivated
    callback(data);
  });
};

/* ──────────────────────────────────────────────
   UPDATE JOB
   ────────────────────────────────────────────── */
export const updateJob = async (jobId, updatedData) => {
  const jobRef = doc(db, 'jobs', jobId);
  const allowedFields = {};
  if (updatedData.title !== undefined) allowedFields.title = updatedData.title;
  if (updatedData.description !== undefined) allowedFields.description = updatedData.description;
  if (updatedData.salary !== undefined) allowedFields.salary = updatedData.salary;
  if (updatedData.location !== undefined) allowedFields.location = updatedData.location;
  if (updatedData.type !== undefined) allowedFields.type = updatedData.type;
  if (updatedData.applyLink !== undefined) allowedFields.applyLink = updatedData.applyLink;
  if (updatedData.active !== undefined) allowedFields.active = updatedData.active;
  if (updatedData.durationDays !== undefined) allowedFields.durationDays = updatedData.durationDays;
  if (updatedData.expiresAt !== undefined) allowedFields.expiresAt = updatedData.expiresAt;

  await updateDoc(jobRef, allowedFields);
};

/* ──────────────────────────────────────────────
   DELETE JOB
   ────────────────────────────────────────────── */
export const deleteJob = async (jobId) => {
  await deleteDoc(doc(db, 'jobs', jobId));
};

/* ──────────────────────────────────────────────
   GET SINGLE JOB
   ────────────────────────────────────────────── */
export const getJobById = async (jobId) => {
  const docSnap = await getDoc(doc(db, 'jobs', jobId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

/* ──────────────────────────────────────────────
   SAVED JOBS (user-level)
   Uses a subcollection: users/{userId}/savedJobs
   ────────────────────────────────────────────── */
export const saveJob = async (userId, jobId) => {
  const savedRef = doc(db, 'users', userId, 'savedJobs', jobId);
  const { setDoc } = await import('firebase/firestore');
  await setDoc(savedRef, { jobId, savedAt: serverTimestamp() });
};

export const unsaveJob = async (userId, jobId) => {
  const savedRef = doc(db, 'users', userId, 'savedJobs', jobId);
  await deleteDoc(savedRef);
};

export const isJobSaved = async (userId, jobId) => {
  const savedRef = doc(db, 'users', userId, 'savedJobs', jobId);
  const snap = await getDoc(savedRef);
  return snap.exists();
};

export const getSavedJobs = async (userId) => {
  const savedRef = collection(db, 'users', userId, 'savedJobs');
  const snapshot = await getDocs(savedRef);
  return snapshot.docs.map((d) => d.data().jobId);
};

// ──────────────────────────────────────────────
// 🔒 Monetization (Disabled by default)
// ──────────────────────────────────────────────

// export const createPaidJob = async (jobData, paymentToken) => {
//   // Integrate Razorpay / Stripe here
//   // const paymentResult = await processPayment(paymentToken, 499);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   // const job = await createJob({ ...jobData, isPaid: true, boosted: true });
//   // return job;
// };

// export const boostJob = async (jobId, paymentToken) => {
//   // const paymentResult = await processPayment(paymentToken, 299);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   // await updateJob(jobId, { boosted: true, boostedAt: serverTimestamp() });
// };
