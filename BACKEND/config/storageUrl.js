/**
 * Resolves public URLs for objects stored in S3/MinIO or Supabase Storage.
 * Gracefully handles local MinIO endpoints as well as Supabase.
 * Automatically corrects any legacy URLs containing "undefined.supabase.co".
 */
function getPublicStorageUrl(bucket, key) {
  if (!key) return null;

  // If already a full URL
  if (key.startsWith("http://") || key.startsWith("https://")) {
    if (key.includes("undefined.supabase.co")) {
      const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://localhost:9000";
      return key.replace("https://undefined.supabase.co/storage/v1/object/public", endpoint);
    }
    return key;
  }

  // If Supabase is explicitly configured with a Project ID
  if (process.env.SUPABASE_PROJECT_ID && process.env.SUPABASE_PROJECT_ID !== "undefined") {
    return `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${key}`;
  }

  // Standard S3 / MinIO local endpoint
  const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://localhost:9000";
  return `${endpoint}/${bucket}/${key}`;
}

module.exports = { getPublicStorageUrl };
