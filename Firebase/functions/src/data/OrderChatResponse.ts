import {ChatStatus} from "@motorro/firebase-ai-chat-core";

/**
 * Chat command response
 */
export interface OrderChatResponse {
    /**
     * Created chat document
     */
    readonly chatDocument: string
    /**
     * Chat status
     */
    readonly status: ChatStatus,
}
