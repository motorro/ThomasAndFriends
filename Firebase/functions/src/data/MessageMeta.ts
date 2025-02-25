import {Meta} from "@motorro/firebase-ai-chat-vertexai";
import {ASSISTANT} from "../assistants/assistantName";

export interface MessageMeta extends Meta {
    readonly assistantId: ASSISTANT
    readonly assistantName: string,
    readonly engine: string
}

