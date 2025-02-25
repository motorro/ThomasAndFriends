import {ChatMeta} from "@motorro/firebase-ai-chat-vertexai";
import {MessageMeta} from "./MessageMeta";
import {CATERING, FLIGHT, THOMAS, TRANSFER} from "../assistants/assistantName";
import {AssistantConfig} from "@motorro/firebase-ai-chat-core";

export interface OrderChatMeta extends ChatMeta {
    readonly aiMessageMeta: MessageMeta,
    [THOMAS]?: AssistantConfig
    [FLIGHT]?: AssistantConfig
    [CATERING]?: AssistantConfig
    [TRANSFER]?: AssistantConfig
}
