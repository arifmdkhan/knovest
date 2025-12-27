export function constructUrl(key: string | null | undefined) {
  if (!key) return "";

  // Backward compatibility: If it's already a URL, return it
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  // Backward compatibility for legacy "finlume/" keys if needed (or just treat as key)
  // New architecture keys: users/..., posts/...

  // We need to know if it's PUBLIC or PRIVATE to pick domain?
  // Current constructUrl uses NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES which is the public one.
  // Private keys (documents/...) should NOT use this function or should return a signed URL (not implemented here).
  // Assuming this function is for PUBLIC assets (images/avatars).

  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT || "t3.storage.dev"; // Fallback or new env var?
  // User provided AWS_ENDPOINT_URL_S3 but that's server side.
  // Client needs to know where to point. 
  // Old code: `https://${bucket}.t3.storage.dev/${key}`

  // If key has leading slash, remove it
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  return `https://${bucket}.t3.storage.dev/${cleanKey}`;
}
