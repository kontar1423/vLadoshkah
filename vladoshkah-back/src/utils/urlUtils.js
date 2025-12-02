const LOCALHOST_REGEX = /^https?:\/\/localhost(?::\d+)?/i;

export function toRelativeUploadUrl(url) {
  if (!url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost') {
      const pathname = parsed.pathname || '';
      const search = parsed.search || '';
      const hash = parsed.hash || '';
      return pathname + search + hash || '/';
    }
  } catch (err) {
  }

  return url.replace(LOCALHOST_REGEX, '') || '/';
}

export function normalizePhoto(photo) {
  if (!photo) {
    return photo;
  }

  return {
    ...photo,
    url: toRelativeUploadUrl(photo.url),
  };
}

export function normalizePhotos(photos) {
  if (!Array.isArray(photos)) {
    return photos;
  }

  return photos.map(normalizePhoto);
}

