import {AssistantConfig, ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatData} from "../data/OrderChatData";
import {Meta, tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {ASSISTANT} from "./assistantName";
import {MessageMeta} from "../data/MessageMeta";
import {OrderChatMeta} from "../data/OrderChatMeta";
import {CrewMemberProfileSchema} from "./CrewMemberProfile";
import {FunctionDeclaration} from "@google-cloud/vertexai/src/types/content";
import {FunctionDeclarationSchemaType} from "@google-cloud/vertexai";

const logger = tagLogger("handOver");

export const handOverInstructions = `
    If the client asks you to change some details that are irrelevant to your primary task:
    1) Call 'getCrew' to get a list of assistants.
    2) Find the most appropriate assistant using 'helpsWith' field of crew members for the task.
    3) Read the 'preRequisites' and call 'canSwitchTo' function to check if the assistant is ready to be called. If not, follow the instructions of 'preRequisites' and 'canSwitchTo' result to fulfill the requirements.
    4) Call 'switchTo' function providing a summary of what user wants in a 'request' field.
    5) Report to the client that his request is being processed by the selected assistant.
    6) Wait for the update from your assistant. It will be a special message that starts with '[HAND-BACK]'. 
    7) IMPORTANT: Proceed with client or other tool calls only after you get the '[HAND-BACK]' message from your assistant.
`;

export const handBackInstructions = `
    When you are done with your primary task:
    1) Ask the client if he confirms the current order.
    2) Call 'returnResult' function with optional summary of what has been done and any additional requests in a 'comment' field.
    3) IMPORTANT: Do not call 'returnResult' if you are currently waiting for the '[HAND-BACK]' reply 
`;

export const getCrewDescription: FunctionDeclaration = {
    name: "getCrew",
    description: `
        Returns a list of your crew members to delegate the client's request. 
        If you find a crew member that is especially effective in some kind of tasks, always 
        delegate a request to him.
        You will get a list of following objects in response: ${JSON.stringify(CrewMemberProfileSchema)}
    `
};

export const canSwitchToDescription: FunctionDeclaration = {
    name: "canSwitchTo",
    description: "Checks if the current order status is good enough to pass it to assistant identified by 'assistantId'",
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            assistantId: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Assistant ID to check"
            }
        },
        required: ["assistantId"]
    }
};

export const switchToDescription: FunctionDeclaration = {
    name: "switchTo",
    description: "Calls a crew member for assistance and delegates a 'request' to him",
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            assistantId: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Assistant ID to call"
            },
            request: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "A request to your team member to help you to arrange something for the client",
                example: "The client wants to fly from Moscow to Malta."
            }
        },
        required: ["assistantId", "request"]
    }
};

export const handBackDescription: FunctionDeclaration = {
    name: "returnResult",
    description: "Returns the result to calling assistant",
    parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            comment: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "The summary the actions you have done",
                example: "The client wanted book a flight from VKO to SVO. Flight created."
            }
        },
        required: ["comment"]
    }
};

export async function handBackData(
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    data: OrderChatData,
    comment?: string
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    let messages: ReadonlyArray<string> = [
        "[HAND-BACK]: Your teammate has completed your task. Here's the new order state:",
        JSON.stringify({data: data})
    ];
    if (comment) {
        messages = [
            ...messages,
            "Here is the additional comment from your teammate:",
            comment
        ];
    }
    return await handBack(messages, toolsHandover);
}

export async function handBackResult(
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    result: Record<string, unknown> | null,
    comment?: string
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    let messages: ReadonlyArray<string> = [
        "[HAND-BACK]: Your teammate has completed your task. Here's the result:",
        JSON.stringify({result: result})
    ];
    if (comment) {
        messages = [
            ...messages,
            "Here is the additional comment from your teammate:",
            comment
        ];
    }
    return await handBack(messages, toolsHandover);
}

export async function handOver(
    config: AssistantConfig,
    chatData: ChatDispatchData<OrderChatMeta>,
    messageMeta: MessageMeta,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    args: Record<string, unknown>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    const messages: Array<string> = [];
    const request = args.request as string;
    if (undefined === request) {
        return {
            error: "You should provide a request for the assistant"
        };
    }
    messages.push(`Here is the summary of the order and your next task:\n${request}`);
    return await doHandOver(
        config,
        chatData,
        messageMeta,
        messages,
        toolsHandover,
        from
    );
}

export async function doHandOver(
    config: AssistantConfig,
    chatData: ChatDispatchData<OrderChatMeta>,
    messageMeta: MessageMeta,
    messages: ReadonlyArray<string>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    const meta: OrderChatMeta = {
        ...(null != chatData.meta ? chatData.meta : {}),
        aiMessageMeta: messageMeta,
        [from]: chatData.assistantConfig
    };
    logger.d(`Switching to ${config.instructionsId}:`, JSON.stringify(chatData), JSON.stringify(messages));
    toolsHandover.handOver({
        config: config,
        messages: messages,
        chatMeta: meta
    });
    return {
        result: "Your teammate takes care of the client. When done he will update you with the latest order state and comments with a special message starting with '[HAND-BACK]:'"
    };
}

async function handBack(
    messages: ReadonlyArray<string>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("Switching back");
    toolsHandover.handBack(messages);
    return {
        result: "Your request was passed to your teammate"
    };
}

