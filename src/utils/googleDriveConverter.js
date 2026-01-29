/**
 * Converts a Google Drive share link into a direct image link.
 * Handles formats like /file/d/ID/view and ?id=ID.
 * @param {string} url - The Google Drive URL to convert.
 * @returns {string} - The direct access URL.
 */
export const getDirectGDriveUrl = (url) => {
  if (!url || !url.includes('drive.google.com')) return url;

  let fileId = '';
  
  // Format: /file/d/FILE_ID/view
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    fileId = matchD[1];
  } else {
    // Format: ?id=FILE_ID
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  if (fileId) {
    // Use the uc?export=view format which is widely supported
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return url;
};
