// Storage keys are capability inputs. Accept only canonical, scoped keys.
export function isCanonicalKey(key: string) {
  return !!key && !key.includes("\\") && !key.includes("%") &&
    key.split("/").every(part => !!part && part !== "." && part !== "..");
}

export function isLessonAssetKey(key: string, courseId: string, lessonId: string, kind: "video" | "resources" | "thumbnail") {
  return isCanonicalKey(key) && key.startsWith(`courses/${courseId}/lessons/${lessonId}/${kind}/`);
}

export function isPostAssetKey(key: string, authorId: string, postId: string) {
  return isCanonicalKey(key) && key.startsWith(`users/${authorId}/posts/${postId}/`) && /\.(?:png|jpe?g|webp|avif|mp4|webm)$/i.test(key);
}
