// Dry run by default. Back up the database and object inventory before --apply.
import { config } from 'dotenv';
import pg from 'pg';
import { S3Client, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
config({ path: ['.env.local', '.env'], quiet: true });
const apply = process.argv.includes('--apply');
const publicBucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const privateBucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;
const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.trim() || `${process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, '')}/${publicBucket}`;
if (!publicBucket || !privateBucket || publicBucket === privateBucket || !process.env.DATABASE_URL || !process.env.AWS_ENDPOINT_URL_S3) throw new Error('Database and distinct storage buckets must be configured');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
const storage = new S3Client({ region: process.env.AWS_REGION, endpoint: process.env.AWS_ENDPOINT_URL_S3, forcePathStyle: true, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
const canonical = key => key && !/[\\%]/.test(key) && key.split('/').every(part => part && part !== '.' && part !== '..');
async function head(bucket, key) {
  try { return await storage.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); }
  catch (error) { if (error.$metadata?.httpStatusCode === 404) return null; throw error; }
}
let cursor = '';
const totals = { mode: apply ? 'apply' : 'dry-run', inspected: 0, candidates: 0, migrated: 0, alreadyPrivate: 0, unsupported: 0 };
try {
  for (;;) {
    const { rows } = await pool.query('SELECT m.id, m.url, m."postId", p."authorId" FROM "Media" m JOIN "Post" p ON p.id = m."postId" WHERE m.id > $1 ORDER BY m.id LIMIT 100', [cursor]);
    if (!rows.length) break;
    for (const row of rows) {
      cursor = row.id;
      totals.inspected++;
      const prefix = publicUrl.replace(/\/$/, '') + '/';
      const source = row.url.startsWith(prefix) ? decodeURIComponent(row.url.slice(prefix.length)) : row.url;
      const scoped = `users/${row.authorId}/posts/${row.postId}/`;
      const legacy = `posts/${row.postId}/`;
      if (!canonical(source) || !/\.(png|jpe?g|webp|avif|mp4|webm)$/i.test(source) || (!source.startsWith(scoped) && !source.startsWith(legacy))) { totals.unsupported++; continue; }
      const destination = source.startsWith(scoped) ? source : scoped + 'legacy/' + source.slice(legacy.length);
      const publicObject = await head(publicBucket, source);
      const privateObject = await head(privateBucket, destination);
      if (!publicObject && privateObject && row.url === destination) { totals.alreadyPrivate++; continue; }
      if (!publicObject) { totals.unsupported++; continue; }
      totals.candidates++;
      if (!apply) continue;
      await storage.send(new CopyObjectCommand({ Bucket: privateBucket, Key: destination, CopySource: `${publicBucket}/${source.split('/').map(encodeURIComponent).join('/')}`, CopySourceIfMatch: publicObject.ETag }));
      const copied = await head(privateBucket, destination);
      if (!copied?.ContentLength || copied.ContentLength !== publicObject.ContentLength) throw new Error('Private copy verification failed; public source retained');
      const updated = await pool.query('UPDATE "Media" SET url = $1 WHERE id = $2 AND url = $3', [destination, row.id, row.url]);
      if (updated.rowCount !== 1) throw new Error('Media changed concurrently; public source retained');
      await storage.send(new DeleteObjectCommand({ Bucket: publicBucket, Key: source }));
      totals.migrated++;
    }
  }
  console.log(JSON.stringify(totals));
  if (totals.unsupported) process.exitCode = 2;
} finally { await pool.end(); storage.destroy(); }
