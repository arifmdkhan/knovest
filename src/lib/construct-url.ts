export function constructUrl(key: string | null | undefined) {
  if (!key) return "";

  // Backward compatibility: If it's already a URL, return it
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;

  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  if (!publicUrl) return "";
  return `${publicUrl.replace(/\/$/, "")}/${cleanKey.split("/").map(encodeURIComponent).join("/")}`;
}
