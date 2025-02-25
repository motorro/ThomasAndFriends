import {firestore} from "firebase-admin";
import {
    AssistantChat,
    AssistantConfig,
    ChatError,
    ChatWorker, CommandScheduler,
    commonFormatContinuationError,
    FirebaseQueueTaskScheduler,
    logger, NewMessage,
    ToolsContinuationScheduler,
    ToolsDispatcher
} from "@motorro/firebase-ai-chat-core";
import {
    DefaultVertexAiMessageMapper,
    factory as vertexFactory,
    Meta, TaskScheduler,
    VertexAiAssistantConfig, VertexAiMessageMapper,
    VertexAiSystemInstructions
} from "@motorro/firebase-ai-chat-vertexai";
import {
    DefaultOpenAiMessageMapper,
    factory as openAiFactory,
    OpenAiAssistantConfig,
    OpenAiMessageMapper,
    UserMessageParts
} from "@motorro/firebase-ai-chat-openai";
import {getFunctions} from "firebase-admin/functions";
import {
    aiDelay,
    ASSISTANT_ID_CATERING,
    ASSISTANT_ID_FLIGHT, ASSISTANT_ID_FLIGHT_OPTIONS,
    ASSISTANT_ID_THOMAS,
    ASSISTANT_ID_TRANSFER,
    ASSISTANT_ID_WAYPOINTS,
    debugAi, Engine, getEngine,
    openAiApiKey,
    ORDER_CHAT_QUEUE,
    region,
    vertexAiModel
} from "./env";
import {OrderChatData} from "./data/OrderChatData";
import {OrderChatMeta} from "./data/OrderChatMeta";
import {GenerateContentCandidate, Part, VertexAI} from "@google-cloud/vertexai";
import {projectID} from "firebase-functions/params";
import {VERTEXAI_THREADS} from "./data/Collections";
import {
    ASSISTANT,
    CATERING,
    FLIGHT,
    FLIGHT_OPTIONS,
    getAssistantName,
    THOMAS,
    TRANSFER,
    WAYPOINTS
} from "./assistants/assistantName";
import {thomasInstructions} from "./assistants/thomas/Thomas";
import {baseFlightOptionsInstructions} from "./assistants/flight/Flight";
import {cateringInstructions} from "./assistants/catering/Catering";
import {transferInstructions} from "./assistants/transfer/Transfer";
import {waypointsInstructions} from "./assistants/waypoints/Waypoints";
import OpenAI from "openai";
import {Request} from "firebase-functions/lib/common/providers/tasks";
import {isOpenAiChatReq} from "@motorro/firebase-ai-chat-openai/lib/aichat/data/OpenAiChatCommand";
import {Message} from "openai/resources/beta/threads";
import {charterDetailsInstructions} from "./assistants/flight/FlightDetails";
import {messageMapper} from "./assistants/mapping/messageMapper";

export const taskScheduler = () => new FirebaseQueueTaskScheduler(getFunctions(), region, {
    scheduleDelaySeconds: aiDelay.value()
});

const getVertexChatFactory = () => vertexFactory(
    firestore(),
    getFunctions(),
    region,
    taskScheduler(),
    commonFormatContinuationError,
    debugAi.value(),
    debugAi.value()
);
const getOpenAiChatFactory = () => openAiFactory(
    firestore(),
    getFunctions(),
    region,
    taskScheduler(),
    commonFormatContinuationError,
    debugAi.value(),
    debugAi.value()
);

const commandSchedulers = (queueName: string, taskScheduler: TaskScheduler): ReadonlyArray<CommandScheduler> => [
    ...getVertexChatFactory().createDefaultCommandSchedulers(queueName, taskScheduler),
    ...getOpenAiChatFactory().createDefaultCommandSchedulers(queueName, taskScheduler)
];

export function getAssistantChat(): AssistantChat<OrderChatData, Meta, OrderChatMeta> {
    switch (getEngine()) {
        case "openai":
            return getOpenAiChatFactory().chat(ORDER_CHAT_QUEUE, commandSchedulers);
        default:
            return getVertexChatFactory().chat(ORDER_CHAT_QUEUE, commandSchedulers);
    }
}

function getVertexWorker(): ChatWorker {
    const vertexAi = new VertexAI({
        project: projectID.value(),
        location: region
    });
    const model = vertexAi.getGenerativeModel(
        {
            model: vertexAiModel.value(),
            generationConfig: {
                candidateCount: 1
            }
        },
        {
            timeout: 30 * 1000
        }
    );

    const instructions: Record<string, VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta>> = {
        [THOMAS]: thomasInstructions(),
        [FLIGHT]: baseFlightOptionsInstructions(),
        [FLIGHT_OPTIONS]: charterDetailsInstructions(),
        [CATERING]: cateringInstructions(),
        [TRANSFER]: transferInstructions(),
        [WAYPOINTS]: waypointsInstructions()
    };

    const mapper: VertexAiMessageMapper = {
        fromAi(candidate: GenerateContentCandidate): NewMessage | undefined {
            const text: Array<string> = [];
            for (const part of candidate.content.parts) {
                if (undefined !== part.text) {
                    text.push(part.text);
                }
            }
            return messageMapper(text.join("\n"));
        },

        toAi(message: NewMessage): Array<Part> {
            return DefaultVertexAiMessageMapper.toAi(message);
        }
    };

    return getVertexChatFactory().worker(
        model,
        VERTEXAI_THREADS,
        instructions,
        mapper,
        undefined,
        undefined,
        commandSchedulers
    );
}

function getOpenAiWorker(): ChatWorker {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const dispatchers: Readonly<Record<string, ToolsDispatcher<any, any, any>>> = {
        [THOMAS]: assertDispatcher(thomasInstructions()),
        [FLIGHT]: assertDispatcher(baseFlightOptionsInstructions()),
        [FLIGHT_OPTIONS]: assertDispatcher(charterDetailsInstructions()),
        [CATERING]: assertDispatcher(cateringInstructions()),
        [TRANSFER]: assertDispatcher(transferInstructions()),
        [WAYPOINTS]: assertDispatcher(waypointsInstructions())
    };

    const mapper: OpenAiMessageMapper = {
        fromAi(message: Message): NewMessage | undefined {
            const text: Array<string> = [];
            for (const content of message.content) {
                if ("text" === content.type) {
                    text.push(content.text.value);
                }
            }
            return messageMapper(text.join("\n"));
        },

        toAi(message: NewMessage): UserMessageParts {
            return DefaultOpenAiMessageMapper.toAi(message);
        }
    };

    return getOpenAiChatFactory().worker(
        new OpenAI({
            apiKey: openAiApiKey.value(),
            timeout: 20000
        }),
        dispatchers,
        mapper,
        undefined,
        undefined,
        commandSchedulers
    );

    function assertDispatcher(instructions: VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta>): ToolsDispatcher<OrderChatData, Meta, OrderChatMeta> {
        const dispatcher = instructions.tools?.dispatcher;
        if (!dispatcher) {
            logger.e("Dispatcher not found", JSON.stringify(instructions));
            throw new ChatError("unimplemented", true, "Dispatcher is required for instructions");
        }
        return dispatcher;
    }
}

export function getWorker(req: Request<unknown>): ChatWorker {
    if (isOpenAiChatReq(req)) {
        return getOpenAiWorker();
    }
    return getVertexWorker();
}

export function getContinuationScheduler(): ToolsContinuationScheduler<OrderChatData> {
    switch (getEngine()) {
        case "openai":
            return getOpenAiChatFactory().continuationScheduler(ORDER_CHAT_QUEUE);
        default:
            return getVertexChatFactory().continuationScheduler(ORDER_CHAT_QUEUE);
    }
}

export function getChatMeta(assistant: ASSISTANT, engOverride?: Engine): OrderChatMeta {
    switch (engOverride || getEngine()) {
        case "openai":
            return {
                aiMessageMeta: {
                    assistantId: assistant,
                    assistantName: getAssistantName(assistant),
                    engine: "OpenAI"
                }
            };
        default:
            return {
                aiMessageMeta: {
                    assistantId: assistant,
                    assistantName: getAssistantName(assistant),
                    engine: "VertexAI"
                }
            };
    }
}

function getAssistantId(assistant: ASSISTANT): string {
    switch (assistant) {
        case THOMAS:
            return ASSISTANT_ID_THOMAS.value();
        case FLIGHT:
            return ASSISTANT_ID_FLIGHT.value();
        case FLIGHT_OPTIONS:
            return ASSISTANT_ID_FLIGHT_OPTIONS.value();
        case CATERING:
            return ASSISTANT_ID_CATERING.value();
        case TRANSFER:
            return ASSISTANT_ID_TRANSFER.value();
        case WAYPOINTS:
            return ASSISTANT_ID_WAYPOINTS.value();
    }
}

export function getChatConfig(assistant: ASSISTANT, engOverride?:Engine): AssistantConfig {
    switch (engOverride || getEngine()) {
        case "openai":
            return {
                engine: "openai",
                assistantId: getAssistantId(assistant),
                dispatcherId: assistant
            } as OpenAiAssistantConfig;
        default:
            return {
                engine: "vertexai",
                instructionsId: assistant
            } as VertexAiAssistantConfig;
    }
}

