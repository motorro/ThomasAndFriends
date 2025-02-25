import {defineBoolean, defineInt, defineSecret, defineString} from "firebase-functions/params";

export const region = "us-east1";
export const ORDER_CHAT_QUEUE = "orderChat";

export const aiDelay = defineInt("AI_DELAY");

const engine = defineString("ENGINE");
export type Engine = "openai" | "vertexai"
export function getEngine(): Engine {
    return <Engine>engine.value();
}

export const vertexAiModel = defineString("VERTEX_AI_MODEL");
export const debugAi = defineBoolean("DEBUG_AI");
export const mapsApiKey = defineSecret("MAPS_API_KEY");

// OpenAI
export const openAiApiKey = defineSecret("OPENAI_API_KEY");
export const ASSISTANT_ID_THOMAS = defineString("ASSISTANT_ID_THOMAS");
export const ASSISTANT_ID_WAYPOINTS = defineString("ASSISTANT_ID_WAYPOINTS");
export const ASSISTANT_ID_FLIGHT = defineString("ASSISTANT_ID_FLIGHT");
export const ASSISTANT_ID_FLIGHT_OPTIONS = defineString("ASSISTANT_ID_FLIGHT_OPTIONS");
export const ASSISTANT_ID_CATERING = defineString("ASSISTANT_ID_CATERING");
export const ASSISTANT_ID_TRANSFER = defineString("ASSISTANT_ID_TRANSFER");
