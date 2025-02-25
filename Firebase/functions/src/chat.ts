import {EMPTY_ORDER, OrderChatData} from "./data/OrderChatData";
import {firestore} from "firebase-admin";
import {CHATS} from "./data/Collections";
import {OrderChatRequest} from "./data/OrderChatRequest";
import {OrderChatResponse} from "./data/OrderChatResponse";
import {PostOrderRequest} from "./data/PostOrderRequest";
import {CloseOrderRequest} from "./data/CloseOrderRequest";
import {AssistantConfig, ChatState} from "@motorro/firebase-ai-chat-core";
import {THOMAS} from "./assistants/assistantName";
import {OrderChatMeta} from "./data/OrderChatMeta";
import {getAssistantChat, getChatConfig, getChatMeta} from "./chatFactory";
import CollectionReference = firestore.CollectionReference;
import DocumentReference = firestore.DocumentReference;
import {tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {DeleteOrderRequest} from "./data/DeleteOrderRequest";
import {HttpsError} from "firebase-functions/v2/https";

const db = firestore();
const chats = db.collection(CHATS) as CollectionReference<ChatState<AssistantConfig, OrderChatData, OrderChatMeta>>;
const logger = tagLogger("Chat");

export const createOrderChat = async (uid: string, data: OrderChatRequest): Promise<OrderChatResponse> => {
    const chat = chats.doc();
    const meta: OrderChatMeta = getChatMeta(THOMAS);
    const config = getChatConfig(THOMAS);
    logger.d("Creating chat for config:", JSON.stringify(config));
    const result = await getAssistantChat().create(
        chat,
        uid,
        EMPTY_ORDER,
        config,
        [data.message],
        undefined,
        meta
    );
    return {
        chatDocument: chat.path,
        status: result.status
    };
};

export const postToOrder = async (uid: string, data: PostOrderRequest): Promise<OrderChatResponse> => {
    logger.d("Posting to chat:", data.chatDocument);
    const result = await getAssistantChat().postMessage(
        db.doc(data.chatDocument) as DocumentReference<ChatState<AssistantConfig, OrderChatData, OrderChatMeta>>,
        uid,
        [data.message]
    );
    return {
        chatDocument: data.chatDocument,
        status: result.status
    };
};

export const closeOrder = async (uid: string, data: CloseOrderRequest): Promise<OrderChatResponse> => {
    logger.d("Closing chat:", data.chatDocument);
    const result = await getAssistantChat().closeChat(
        db.doc(data.chatDocument) as DocumentReference<ChatState<AssistantConfig, OrderChatData, OrderChatMeta>>,
        uid,
    );
    return {
        chatDocument: data.chatDocument,
        status: result.status
    };
};

export const deleteOrder = async (uid: string, request: DeleteOrderRequest): Promise<void> => {
    logger.d("Deleting chat:", request.chatDocument);
    const chatDoc = db.doc(request.chatDocument) as DocumentReference<ChatState<AssistantConfig, OrderChatData, OrderChatMeta>>;
    const data = (await chatDoc.get()).data();
    if (undefined !== data) {
        if (uid !== data.userId) {
            return Promise.reject(new HttpsError("permission-denied", "Access denied"));
        }
        await db.recursiveDelete(chatDoc);
    }
};
