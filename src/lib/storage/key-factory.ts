import { UploadIntent } from "./types";
import { v4 as uuidv4 } from "uuid";

export class KeyFactory {
    static getPayload(intent: UploadIntent, params: Record<string, string>, fileExtension: string): string {
        const ext = fileExtension.toLowerCase();

        switch (intent) {
            case UploadIntent.USER_AVATAR:
                if (!params.userId) throw new Error("Missing userId");
                // Canonical: users/{userId}/avatar/original.webp
                // Assuming original for now, clients can perform resizing if needed or we handle it via lambda
                return `users/${params.userId}/avatar/${uuidv4()}.${ext}`;

            case UploadIntent.POST_MEDIA:
                if (!params.postId) throw new Error("Missing postId");
                // Canonical: posts/{postId}/images/{mediaId}.webp or videos/{mediaId}.mp4
                const typeFolder = ext === 'mp4' ? 'videos' : 'images';
                return `posts/${params.postId}/${typeFolder}/${uuidv4()}.${ext}`;

            case UploadIntent.ARTICLE_THUMBNAIL:
                if (!params.articleId) throw new Error("Missing articleId");
                // Canonical: articles/{articleId}/thumbnail/cover.webp
                return `articles/${params.articleId}/thumbnail/cover.${ext}`;

            case UploadIntent.ARTICLE_MEDIA:
                if (!params.articleId) throw new Error("Missing articleId");
                // Canonical: articles/{articleId}/images/{mediaId}.webp
                return `articles/${params.articleId}/images/${uuidv4()}.${ext}`;

            case UploadIntent.ARTICLE_ATTACHMENT:
                if (!params.articleId) throw new Error("Missing articleId");
                // Canonical: articles/{articleId}/attachments/{mediaId}.pdf
                return `articles/${params.articleId}/attachments/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_COVER:
                if (!params.courseId) throw new Error("Missing courseId");
                // Canonical: courses/{courseId}/thumbnail/cover.webp
                return `courses/${params.courseId}/thumbnail/cover.${ext}`;

            case UploadIntent.COURSE_PREVIEW:
                if (!params.courseId) throw new Error("Missing courseId");
                // Canonical: courses/{courseId}/preview/intro.mp4
                return `courses/${params.courseId}/preview/intro.${ext}`;

            case UploadIntent.COURSE_LESSON_VIDEO:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
                // Canonical: courses/{courseId}/lessons/{lessonId}/video/hls/master.m3u8 
                // For raw upload, we might store as raw.mp4 then transcode. 
                // User spec says: "Videos uploaded raw only if later transcoded to HLS"
                // Let's store raw in a raw/ folder or similar? 
                // Spec says CANONICAL: courses/{courseId}/lessons/{lessonId}/video/hls/master.m3u8
                // But we upload a SINGLE file (e.g. mp4). 
                // We really should upload to a raw location if we plan to transcode. 
                // For now, let's just stick to the pattern but typically this would be a raw file.
                // Let's upload to "raw/{uuid}.mp4" inside the lesson folder? 
                // Spec is strict: "Upload Flow... Generates exact S3 object key". 
                // If the user uploads an MP4, it's NOT yet HLS. 
                // I will assume for now we place the raw video in:
                return `courses/${params.courseId}/lessons/${params.lessonId}/video/raw/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_LESSON_THUMBNAIL:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
                // Canonical: courses/{courseId}/lessons/{lessonId}/thumbnail.webp
                return `courses/${params.courseId}/lessons/${params.lessonId}/thumbnail.${ext}`;

            case UploadIntent.COURSE_LESSON_RESOURCE:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
                // Canonical: courses/{courseId}/lessons/{lessonId}/resources/{resourceId}.pdf
                return `courses/${params.courseId}/lessons/${params.lessonId}/resources/${uuidv4()}.${ext}`;

            case UploadIntent.VERIFICATION_DOC:
                if (!params.userId) throw new Error("Missing userId");
                // Canonical: documents/users/{userId}/verification/{docId}.pdf
                return `documents/users/${params.userId}/verification/${uuidv4()}.${ext}`;

            case UploadIntent.BROKER_PNL:
                if (!params.userId) throw new Error("Missing userId");
                // Canonical: documents/users/{userId}/broker-pnl/{docId}.pdf
                return `documents/users/${params.userId}/broker-pnl/${uuidv4()}.${ext}`;

            case UploadIntent.CHAT_GROUP_IMAGE:
                if (!params.channelId) throw new Error("Missing channelId");
                // Canonical: chat/channels/{channelId}/image/{uuid}.{ext}
                return `chat/channels/${params.channelId}/image/${uuidv4()}.${ext}`;

            default:
                throw new Error(`Unknown upload intent: ${intent}`);
        }
    }

    static getTemporaryKey(extension: string): string {
        return `uploads/tmp/${uuidv4()}.${extension.toLowerCase()}`;
    }
}
