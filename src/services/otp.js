import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';

/* ──────────────────────────────────────────────
   OTP Configuration
   ────────────────────────────────────────────── */
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 3;

/* ──────────────────────────────────────────────
   Generate a cryptographically random OTP
   ────────────────────────────────────────────── */
export const generateOtp = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = String(array[0] % 1000000).padStart(OTP_LENGTH, '0');
  return otp;
};

/* ──────────────────────────────────────────────
   Store OTP in Firestore
   - Document ID = email (normalized)
   - Fields: email, otp, expiresAt, createdAt, attempts
   ────────────────────────────────────────────── */
export const storeOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  await setDoc(doc(db, 'otp', docId), {
    email: normalizedEmail,
    otp,
    expiresAt,
    createdAt: serverTimestamp(),
    attempts: 0,
  });

  return { docId, expiresAt };
};

/* ──────────────────────────────────────────────
   Check rate limit — prevent OTP spam
   Returns { allowed: boolean, waitSeconds: number }
   ────────────────────────────────────────────── */
export const checkOtpCooldown = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

  const otpDoc = await getDoc(doc(db, 'otp', docId));

  if (!otpDoc.exists()) {
    return { allowed: true, waitSeconds: 0 };
  }

  const data = otpDoc.data();
  const createdAt = data.createdAt?.toDate?.();

  if (!createdAt) {
    return { allowed: true, waitSeconds: 0 };
  }

  const elapsedSeconds = (Date.now() - createdAt.getTime()) / 1000;

  if (elapsedSeconds < OTP_COOLDOWN_SECONDS) {
    return {
      allowed: false,
      waitSeconds: Math.ceil(OTP_COOLDOWN_SECONDS - elapsedSeconds),
    };
  }

  return { allowed: true, waitSeconds: 0 };
};

/* ──────────────────────────────────────────────
   Verify OTP
   Returns: { success, error, user? }
   ────────────────────────────────────────────── */
export const verifyOtp = async (email, enteredOtp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

  const otpRef = doc(db, 'otp', docId);
  const otpDoc = await getDoc(otpRef);

  // OTP not found
  if (!otpDoc.exists()) {
    return { success: false, error: 'no-otp', message: 'No OTP found. Please request a new one.' };
  }

  const data = otpDoc.data();

  // Check brute force — max attempts
  if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
    await deleteDoc(otpRef); // Invalidate after max attempts
    return {
      success: false,
      error: 'too-many-attempts',
      message: 'Too many failed attempts. Please request a new OTP.',
    };
  }

  // Check expiry
  const expiresAt = data.expiresAt?.toDate?.();
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    await deleteDoc(otpRef); // Clean up expired OTP
    return { success: false, error: 'expired', message: 'OTP has expired. Please request a new one.' };
  }

  // Check OTP match
  if (data.otp !== enteredOtp.trim()) {
    // Increment attempts
    const newAttempts = (data.attempts || 0) + 1;
    await setDoc(otpRef, { attempts: newAttempts }, { merge: true });

    const remaining = MAX_VERIFY_ATTEMPTS - newAttempts;
    return {
      success: false,
      error: 'wrong-otp',
      message: remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
        : 'Too many failed attempts. Please request a new OTP.',
    };
  }

  // OTP is valid — delete it (one-time use)
  await deleteDoc(otpRef);

  return { success: true, email: normalizedEmail };
};

/* ──────────────────────────────────────────────
   Invalidate / Delete OTP
   ────────────────────────────────────────────── */
export const invalidateOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');
  try {
    await deleteDoc(doc(db, 'otp', docId));
  } catch {
    // silently ignore if already deleted
  }
};

/* ──────────────────────────────────────────────
   Full OTP Request Flow
   1. Check cooldown
   2. Generate OTP
   3. Store in Firestore
   4. Send email (callback)
   Returns { success, otp, error?, waitSeconds? }
   ────────────────────────────────────────────── */
export const requestOtp = async (email) => {
  // Rate limit check
  const cooldown = await checkOtpCooldown(email);
  if (!cooldown.allowed) {
    return {
      success: false,
      error: 'cooldown',
      waitSeconds: cooldown.waitSeconds,
      message: `Please wait ${cooldown.waitSeconds}s before requesting a new OTP.`,
    };
  }

  // Generate & store
  const otp = generateOtp();
  await storeOtp(email, otp);

  return { success: true, otp, email: email.toLowerCase().trim() };
};

/* ──────────────────────────────────────────────
   Constants export for UI consumption
   ────────────────────────────────────────────── */
export const OTP_CONFIG = {
  length: OTP_LENGTH,
  expiryMinutes: OTP_EXPIRY_MINUTES,
  cooldownSeconds: OTP_COOLDOWN_SECONDS,
  maxAttempts: MAX_VERIFY_ATTEMPTS,
};
