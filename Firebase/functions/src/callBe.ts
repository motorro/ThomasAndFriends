import {BeRequest, BeResponse} from "./data/BeResponse";
import {tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {ChatError} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("VJApp");

/**
 * Calls booking service for available flights
 * @param endpoint Backend endpoint
 * @param request Backend request
 */
export async function callBe<T extends BeResponse = BeResponse, R extends BeRequest = BeRequest>(endpoint: string, request?: R): Promise<T> {
    logger.d("Calling Backend", endpoint, JSON.stringify(request));
    throw new ChatError("unimplemented", true, "Proprietary backend service not implemented");
}
