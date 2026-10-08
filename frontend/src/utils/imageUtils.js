export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `http://localhost:8080${imageUrl}`;
  }
  if (imageUrl.startsWith('uploads/')) {
    return `http://localhost:8080/${imageUrl}`;
  }
  return imageUrl;
};
