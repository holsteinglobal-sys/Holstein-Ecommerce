import axios from 'axios';

/**
 * Uploads a file to Cloudinary.
 * @param {File} file - The file object to upload.
 * @returns {Promise<String>} - The URL of the uploaded file.
 */
export const uploadToCloudinary = async (file) => {
  if (!file) return null;

  // These should ideally be in an environment variable
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dcqeyhiu8'; // STILL NEED CLOUD NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'HolsteinResume';

  // Force PDF files to be uploaded as 'raw' to avoid image-specific 401 errors
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const type = isPDF ? 'raw' : 'auto';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    console.log(`Uploading ${isPDF ? 'PDF' : 'file'} as ${type}...`);
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary Error:', error.response?.data || error.message);
    throw new Error('Upload failed. Please check if your Cloudinary Preset is active.');
  }
};
