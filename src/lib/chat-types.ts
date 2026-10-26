import { Attachment, MessageResponse, ReactionResponse, UserResponse, Event, LiteralStringForUnion } from 'stream-chat';

export type StreamChatGenerics = {
    attachmentType: Attachment;
    channelType: {
        image?: string;
        name?: string;
        description?: string;
        permissions?: {
            send_messages?: string;
            view_members?: string;
        };
    };
    commandType: LiteralStringForUnion;
    eventType: Event;
    messageType: MessageResponse;
    reactionType: ReactionResponse;
    userType: UserResponse & {
        image?: string;
        name?: string;
        username?: string;
    };
};

export interface CustomChannelData {
    name?: string;
    image?: string;
    permissions?: {
        send_messages?: string;
        view_members?: string;
    };
}
