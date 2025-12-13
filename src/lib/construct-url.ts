// export function constructUrl(key: string) {
//   return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key}`;
// }

export function constructUrl(key: string | null | undefined) {
  if (!key) return "";
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key.replace(/^finlume\//, "")}`;
}
