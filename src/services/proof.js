import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/* ──────────────────────────────────────────────
   PROOF UPLOAD CONSTANTS
   ────────────────────────────────────────────── */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate a proof image file before upload.
 * @param {File} file
 * @throws {Error} If file is invalid
 */
export const validateProofFile = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File too large (${sizeMB} MB). Maximum allowed: ${MAX_FILE_SIZE / (1024 * 1024)} MB`
    );
  }
};

/**
 * Upload a proof image to Firebase Storage.
 * Path: proofs/{userId}/{companyId}/{timestamp}_{fileName}
 *
 * @param {File} file        – The image file to upload
 * @param {string} userId    – Current user's UID
 * @param {string} companyId – Target company ID
 * @returns {{ proofType: string, proofUrl: string }}
 */
export const uploadProofImage = async (file, userId, companyId) => {
  // Validate first
  validateProofFile(file);

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${sanitizedName}`;
  const storagePath = `proofs/${userId}/${companyId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { proofType: 'image', proofUrl: url };
  } catch (error) {
    console.error('Proof upload failed:', error);
    throw new Error('Failed to upload proof image. Please try again.');
  }
};

/**
 * Generate a local preview URL for an image file.
 * @param {File} file
 * @returns {string} Object URL for preview
 */
export const createImagePreview = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};
