import { UploadIntent } from "./types";
import { v4 as uuidv4 } from "uuid";

export class KeyFactory {
    static getPayload(intent: UploadIntent, params: Record<string, string>, fileExtension: string): string {
        if (Object.values(params).some(value => !value || !/^[a-zA-Z0-9_-]+$/.test(value))) throw new Error("Invalid upload identifier");
        if (!/^[a-zA-Z0-9]+$/.test(fileExtension)) throw new Error("Invalid file extension");
        const ext = fileExtension.toLowerCase();

        switch (intent) {
            case UploadIntent.USER_AVATAR:
                if (!params.userId) throw new Error("Missing userId");
                return `users/${params.userId}/avatar/${uuidv4()}.${ext}`;

            case UploadIntent.POST_MEDIA:
                if (!params.postId || !params.userId) throw new Error("Missing postId or upload owner");
                const typeFolder = ['mp4', 'webm'].includes(ext) ? 'videos' : 'images';
                return `users/${params.userId}/posts/${params.postId}/${typeFolder}/${uuidv4()}.${ext}`;

            case UploadIntent.ARTICLE_THUMBNAIL:
                if (!params.articleId) throw new Error("Missing articleId");
                return `articles/${params.articleId}/thumbnail/${uuidv4()}.${ext}`;

            case UploadIntent.ARTICLE_MEDIA:
                if (!params.articleId) throw new Error("Missing articleId");
                return `articles/${params.articleId}/images/${uuidv4()}.${ext}`;

            case UploadIntent.ARTICLE_ATTACHMENT:
                if (!params.articleId) throw new Error("Missing articleId");
                return `articles/${params.articleId}/attachments/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_COVER:
                if (!params.courseId) throw new Error("Missing courseId");
                return `courses/${params.courseId}/thumbnail/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_PREVIEW:
                if (!params.courseId) throw new Error("Missing courseId");
                return `courses/${params.courseId}/preview/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_LESSON_VIDEO:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
              
                return `courses/${params.courseId}/lessons/${params.lessonId}/video/raw/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_LESSON_THUMBNAIL:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
                return `courses/${params.courseId}/lessons/${params.lessonId}/thumbnail/${uuidv4()}.${ext}`;

            case UploadIntent.COURSE_LESSON_RESOURCE:
                if (!params.courseId || !params.lessonId) throw new Error("Missing courseId or lessonId");
                return `courses/${params.courseId}/lessons/${params.lessonId}/resources/${uuidv4()}.${ext}`;

            case UploadIntent.VERIFICATION_DOC:
                if (!params.userId) throw new Error("Missing userId");
                return `documents/users/${params.userId}/verification/${uuidv4()}.${ext}`;

            case UploadIntent.BROKER_PNL:
                if (!params.userId) throw new Error("Missing userId");
                return `documents/users/${params.userId}/broker-pnl/${uuidv4()}.${ext}`;

            case UploadIntent.CHAT_GROUP_IMAGE:
                if (!params.channelId) throw new Error("Missing channelId");
                return `chat/channels/${params.channelId}/image/${uuidv4()}.${ext}`;

            default:
                throw new Error(`Unknown upload intent: ${intent}`);
        }
    }

    static getTemporaryKey(extension: string, userId: string): string {
        if (!userId || userId.includes("/")) throw new Error("Missing or invalid upload owner");
        return `uploads/tmp/${userId}/${uuidv4()}.${extension.toLowerCase()}`;
    }
}
