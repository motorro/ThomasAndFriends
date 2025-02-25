import {isStructuredMessage, NewMessage} from "@motorro/firebase-ai-chat-core";
import {parseHandOver} from "./handOver";
import {parseMeta} from "./parseMeta";
import {parseHandBack} from "./handBack";

const mappers: ReadonlyArray<(text: string) => NewMessage> = [
    parseHandOver,
    parseHandBack,
    parseMeta
];

export function messageMapper(text: string): NewMessage {
    let result: NewMessage = text;
    mappers.forEach((mapper) => {
        const mapped = mapper(isStructuredMessage(result) ? result.text : result);
        if (isStructuredMessage(mapped)) {
            if (isStructuredMessage(result)) {
                let data = result.data;
                if (undefined != mapped.data) {
                    data = Object.assign(data || {}, mapped.data);
                }
                let meta = result.meta;
                if (undefined != mapped.meta) {
                    meta = Object.assign(meta || {}, mapped.meta);
                }
                result = {
                    text: mapped.text,
                    ...(undefined !== data ? {data: data} : {}),
                    ...(undefined !== meta ? {meta: meta} : {})
                };
            } else {
                result = mapped;
            }
        }
    });
    return result;
}
