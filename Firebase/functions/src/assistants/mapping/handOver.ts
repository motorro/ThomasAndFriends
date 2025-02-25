import {NewMessage} from "@motorro/firebase-ai-chat-core";

/**
 * Switch marker [HAND_OVER:{AGENT_ID}]:
 */
const handOverParseRe = /\[HAND_OVER:(\w+)]:(.*)/is;

/**
 * Parses hand-over messages
 * @param text Message text
 * @return Hand-over message or original message if not a hand-over
 */
export function parseHandOver(text: string): NewMessage {
    const parsed = handOverParseRe.exec(text);
    if (null !== parsed) {
        return {
            text: parsed[2].trim() || "",
            data: {
                operation: "handOver",
                switchTo: parsed[1].toLowerCase().trim()
            }
        };
    }
    return text;
}
