import {NewMessage} from "@motorro/firebase-ai-chat-core";

const metaRe = /\[META:([^\]]+)]/is;

/**
 * Parses message meta-data
 * @param text Message text
 * @return Message with metadata, or original message
 */
export function parseMeta(text: string): NewMessage {
    let result: NewMessage = text;
    const parsed = metaRe.exec(text);
    if (null !== parsed) {
        result = {
            text: text.replace(metaRe, "")?.trim()
        };
        const meta: Record<string, string | string[]> = {};
        const metaPairs = parsed[1].split("&");
        metaPairs.forEach((pair) => {
            const [key, value] = pair.split("=");
            if (undefined !== key && undefined !== value) {
                const values = value.split(",");
                if (1 !== values.length) {
                    meta[key] = values.map((it) => it.trim());
                } else {
                    meta[key] = value.trim();
                }
            }
        });
        if (0 != Object.keys(meta).length) {
            result = {
                ...result,
                meta: meta
            };
        }
    }
    return result;
}
