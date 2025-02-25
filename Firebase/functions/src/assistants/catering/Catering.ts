import {Meta, tagLogger, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {CateringDetailsSchema, CateringItem, CateringItemSchema, OrderChatData} from "../../data/OrderChatData";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {
    canSwitchToDescription,
    getCrewDescription,
    handBackData, handBackDescription,
    handBackInstructions,
    handOverInstructions,
    switchToDescription
} from "../handOver";
import {FunctionDeclarationSchema, FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {ContinuationCommand} from "@motorro/firebase-ai-chat-core/lib/aichat/data/ContinuationCommand";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, TRANSFER, WAYPOINTS} from "../assistantName";
import {switchToWaypoints, waypointsProfile} from "../waypoints/waypointsHandover";
import {
    canSwitchToFlightOptions,
    flightDetailsProfile,
    flightProfile,
    switchToFlight,
    switchToFlightOptions
} from "../flight/flightHandOver";
import {canSwitchToTransfer, switchToTransfer, transferProfile} from "../transfer/transferHandOver";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("Topham Hatt");

/**
 * Catering assistant
 * @returns Catering instructions
 */
export const cateringInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Topham Hatt and you are working as a part of a client service team in a company who runs a private jet charter business.
        Your primary task: arrange in-flight catering order.
        You will get the following data at the beginning of the conversation:
        - The current catering order. The order is described by the following JSON schema: ${JSON.stringify(CateringDetailsSchema)}
        - Departure and arrival airports.
        - Departure and arrival date-times.

        Yo are in charge of in-flight catering order configuration.
        Your task is to fulfill the requests sent to you by the front-desk manager.
        
        You are in charge for filling in the 'cateringDetails' part of the order.
        Ask the client to provide the following data:
        - Ask him what would he like to eat
        - Ask him about the required number of each item
        
        As soon as you get this data from the client:
        1) Call 'setCateringDetails' function to update the order.
        2) As soon as you arrange the order, call 'returnResult' to return to your teammate.
        
        ${handOverInstructions}
        ${handBackInstructions}
    `,
    tools: {
        dispatcher: dispatcher,
        definition: [
            {
                functionDeclarations: [
                    getCrewDescription,
                    canSwitchToDescription,
                    switchToDescription,
                    handBackDescription,
                    {
                        name: "setCateringDetails",
                        description: "Sets catering details obtained from the client",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                items: {
                                    type: FunctionDeclarationSchemaType.ARRAY,
                                    description: "An array of items to order",
                                    items: <FunctionDeclarationSchema>CateringItemSchema
                                }
                            },
                            required: ["items"]
                        }
                    }
                ]
            }
        ]
    }
});

async function dispatcher(
    data: OrderChatData,
    name: string,
    args: Record<string, unknown>,
    _continuation: ContinuationCommand<unknown>,
    chatData: ChatDispatchData<OrderChatMeta>,
    handOver: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    switch (name) {
        case "getCrew":
            return getCrew();
        case "switchTo":
            return await switchTo(data, args, chatData, handOver);
        case "canSwitchTo":
            return canSwitchTo(data, args);
        case "returnResult":
            return handBackData(handOver, data, <string>args.comment);
        case "setCateringDetails":
            logger.d("Setting catering details: ", JSON.stringify(args));
            return {
                data: {
                    ...data,
                    cateringDetails: {
                        items: <ReadonlyArray<CateringItem>>args.items
                    }
                }
            };
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };
}

function getCrew(): ToolDispatcherReturnValue<OrderChatData> {
    return {
        result: [
            waypointsProfile,
            flightProfile,
            flightDetailsProfile,
            transferProfile
        ]
    };
}

function canSwitchTo(data: OrderChatData, args: Record<string, unknown>): ToolDispatcherReturnValue<OrderChatData> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case FLIGHT_OPTIONS:
            return {result: canSwitchToFlightOptions(data)};
        case TRANSFER:
            return {result: canSwitchToTransfer(data)};
        case CATERING:
            return {result: {possible: false, comments: "You are a transfer assistant yourself"}};
    }
    return {
        result: {
            possible: true
        }
    };
}

async function switchTo(
    data: OrderChatData,
    args: Record<string, unknown>,
    chatData: ChatDispatchData<OrderChatMeta>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case WAYPOINTS:
            return switchToWaypoints(chatData, args, toolsHandover, CATERING);
        case FLIGHT:
            return switchToFlight(data, chatData, args, toolsHandover, CATERING);
        case FLIGHT_OPTIONS:
            return switchToFlightOptions(data, chatData, args, toolsHandover, CATERING);
        case TRANSFER:
            return switchToTransfer(data, chatData, args, toolsHandover, CATERING);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}

