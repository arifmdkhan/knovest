export enum UploadIntent {
    USER_AVATAR = "USER_AVATAR",
    POST_MEDIA = "POST_MEDIA",
    ARTICLE_THUMBNAIL = "ARTICLE_THUMBNAIL",
    ARTICLE_MEDIA = "ARTICLE_MEDIA",
    ARTICLE_ATTACHMENT = "ARTICLE_ATTACHMENT",
    COURSE_COVER = "COURSE_COVER",
    COURSE_PREVIEW = "COURSE_PREVIEW",
    COURSE_LESSON_VIDEO = "COURSE_LESSON_VIDEO",
    COURSE_LESSON_THUMBNAIL = "COURSE_LESSON_THUMBNAIL",
    VERIFICATION_DOC = "VERIFICATION_DOC",
    BROKER_PNL = "BROKER_PNL",
    COURSE_LESSON_RESOURCE = "COURSE_LESSON_RESOURCE",
    CHAT_GROUP_IMAGE = "CHAT_GROUP_IMAGE",
}

export enum BucketType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

export interface UploadConfig {
    intent: UploadIntent;
    bucket: BucketType;
    allowedMimeTypes: string[];
    maxSize: number; // in bytes
}

// Configuration map for intents
export const UPLOAD_CONFIGS: Record<UploadIntent, UploadConfig> = {
    [UploadIntent.USER_AVATAR]: {
        intent: UploadIntent.USER_AVATAR,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    [UploadIntent.POST_MEDIA]: {
        intent: UploadIntent.POST_MEDIA,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg", "video/mp4"],
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    [UploadIntent.ARTICLE_THUMBNAIL]: {
        intent: UploadIntent.ARTICLE_THUMBNAIL,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 10 * 1024 * 1024,
    },
    [UploadIntent.ARTICLE_MEDIA]: {
        intent: UploadIntent.ARTICLE_MEDIA,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 10 * 1024 * 1024,
    },
    [UploadIntent.ARTICLE_ATTACHMENT]: {
        intent: UploadIntent.ARTICLE_ATTACHMENT,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["application/pdf"],
        maxSize: 20 * 1024 * 1024,
    },
    [UploadIntent.COURSE_COVER]: {
        intent: UploadIntent.COURSE_COVER,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 10 * 1024 * 1024,
    },
    [UploadIntent.COURSE_PREVIEW]: {
        intent: UploadIntent.COURSE_PREVIEW,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["video/mp4"],
        maxSize: 100 * 1024 * 1024,
    },
    [UploadIntent.COURSE_LESSON_VIDEO]: {
        intent: UploadIntent.COURSE_LESSON_VIDEO,
        bucket: BucketType.PRIVATE,
        allowedMimeTypes: ["video/mp4", "video/quicktime"],
        maxSize: 1024 * 1024 * 1024, // 1GB
    },
    [UploadIntent.COURSE_LESSON_THUMBNAIL]: {
        intent: UploadIntent.COURSE_LESSON_THUMBNAIL,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 5 * 1024 * 1024,
    },
    [UploadIntent.VERIFICATION_DOC]: {
        intent: UploadIntent.VERIFICATION_DOC,
        bucket: BucketType.PRIVATE,
        allowedMimeTypes: ["application/pdf"],
        maxSize: 15 * 1024 * 1024,
    },
    [UploadIntent.BROKER_PNL]: {
        intent: UploadIntent.BROKER_PNL,
        bucket: BucketType.PRIVATE,
        allowedMimeTypes: ["application/pdf"],
        maxSize: 15 * 1024 * 1024,
    },
    [UploadIntent.COURSE_LESSON_RESOURCE]: {
        intent: UploadIntent.COURSE_LESSON_RESOURCE,
        bucket: BucketType.PRIVATE,
        allowedMimeTypes: ["application/pdf"],
        maxSize: 20 * 1024 * 1024,
    },
    [UploadIntent.CHAT_GROUP_IMAGE]: {
        intent: UploadIntent.CHAT_GROUP_IMAGE,
        bucket: BucketType.PUBLIC,
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
};
