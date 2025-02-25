import {NewMessage} from "@motorro/firebase-ai-chat-core";

/**
 * Switch marker [HAND_BACK]:
 */
const handOverParseRe = /\[HAND_BACK]:(.*)/is;

/**
 * Parses hand-back messages
 * @param text Message text
 * @return Hand-over message or original message if not a hand-over
 */
export function parseHandBack(text: string): NewMessage {
    const parsed = handOverParseRe.exec(text);
    if (null !== parsed) {
        return {
            text: parsed[1].trim() || "",
            data: {
                operation: "handBack"
            }
        };
    }
    return text;
}

