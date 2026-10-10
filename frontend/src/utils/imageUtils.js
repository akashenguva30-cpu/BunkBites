const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const BACKEND_ORIGIN = new URL(API_BASE_URL).origin;

export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${imageUrl}`;
  }
  if (imageUrl.startsWith('uploads/')) {
    return `${BACKEND_ORIGIN}/${imageUrl}`;
  }
  return imageUrl;
};
