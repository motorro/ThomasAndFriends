import {OrderChatDataSchema} from "../data/OrderChatData";

export const ReducerResponseSchema = {
    type: "object",
    description: "A successful response with a new data state",
    properties: {
        data: {
            ...OrderChatDataSchema,
            description: "Updated order state"
        }
    },
    required: ["data"]
};

export const ResultResponseSchema = {
    type: "object",
    description: "A successful response of a function call",
    properties: {
        result: {
            type: "object",
            description: "Function call result"
        }
    },
    required: ["result"]
};
