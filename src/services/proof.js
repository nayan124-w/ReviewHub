import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a proof-of-review image to Firebase Storage.
 * @param {File} file – The image file to upload
 * @param {string} userId – The user's UID
 * @param {string} companyId – The company document ID
 * @returns {Promise<{proofType: string, proofUrl: string}>}
 */
export const uploadProofImage = async (file, userId, companyId) => {
  const timestamp = Date.now();
  const filePath = `proofs/${userId}/${companyId}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    proofType: 'image',
    proofUrl: downloadURL,
  };
};
