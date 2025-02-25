import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {ASSISTANT, THOMAS} from "../assistantName";
import {OrderChatData} from "../../data/OrderChatData";
import {getChatConfig, getChatMeta} from "../../chatFactory";
import {handOver} from "../handOver";
import {Meta} from "@motorro/firebase-ai-chat-vertexai";

export async function switchToThomas(
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    return handOver(
        getChatConfig(THOMAS),
        chatData,
        getChatMeta(THOMAS).aiMessageMeta,
        toolsHandover,
        args,
        from
    );
}
