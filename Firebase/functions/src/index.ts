import * as admin from "firebase-admin/app";
import {setGlobalOptions, logger as fLogger} from "firebase-functions/v2";

if (0 === admin.getApps().length) {
    admin.initializeApp();
    setGlobalOptions({maxInstances: 10});
}

import {Logger, setLogger} from "@motorro/firebase-ai-chat-core";
import {OrderChatRequest} from "./data/OrderChatRequest";
import {PostOrderRequest} from "./data/PostOrderRequest";
import {CloseOrderRequest} from "./data/CloseOrderRequest";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {CallableOptions, CallableRequest, HttpsError, onCall as onCall2} from "firebase-functions/v2/https";
import {OrderChatResponse} from "./data/OrderChatResponse";
import {closeOrder, createOrderChat, deleteOrder, postToOrder} from "./chat";
import {mapsApiKey, openAiApiKey, ORDER_CHAT_QUEUE, region} from "./env";
import {getWorker} from "./chatFactory";
import {DeleteOrderRequest} from "./data/DeleteOrderRequest";

const logger: Logger = {
    d: (...args: unknown[]) => {
        fLogger.debug([ORDER_CHAT_QUEUE, ...args]);
    },
    i: (...args: unknown[]) => {
        fLogger.info([ORDER_CHAT_QUEUE, ...args]);
    },
    w: (...args: unknown[]) => {
        fLogger.warn([ORDER_CHAT_QUEUE, ...args]);
    },
    e: (...args: unknown[]) => {
        fLogger.error([ORDER_CHAT_QUEUE, ...args]);
    }
};
setLogger(logger);

const options: CallableOptions = {
    region: region,
    invoker: "public"
};

async function ensureAuth<DATA, RES>(request: CallableRequest<DATA>, block: (uid: string, data: DATA) => Promise<RES>): Promise<RES> {
    const uid = request.auth?.uid;
    if (undefined === uid) {
        logger.w("Unauthenticated");
        return Promise.reject<RES>(new HttpsError("unauthenticated", "Unauthenticated"));
    }
    return await block(uid, request.data);
}

export const startChat = onCall2(options, async (request: CallableRequest<OrderChatRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<OrderChatResponse> => {
        return await createOrderChat(uid, data);
    });
});
export const postToChat = onCall2(options, async (request: CallableRequest<PostOrderRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<OrderChatResponse> => {
        return await postToOrder(uid, data);
    });
});
export const closeChat = onCall2(options, async (request: CallableRequest<CloseOrderRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<OrderChatResponse> => {
        return await closeOrder(uid, data);
    });
});
export const deleteChat = onCall2(options, async (request: CallableRequest<DeleteOrderRequest>) => {
    return ensureAuth(request, async (uid, data): Promise<void> => {
        return await deleteOrder(uid, data);
    });
});

exports[ORDER_CHAT_QUEUE] = onTaskDispatched(
    {
        secrets: [openAiApiKey, mapsApiKey],
        retryConfig: {
            maxAttempts: 1,
            minBackoffSeconds: 30
        },
        rateLimits: {
            maxConcurrentDispatches: 6
        },
        region: region
    },
    async (req) => {
        const worker = getWorker(req);
        const handled = await worker.dispatch(req);
        if (!handled) {
            logger.w("Worker not found for request:", JSON.stringify(req.data));
        }
    }
);
