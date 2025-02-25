import {Meta, tagLogger, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {OrderChatData} from "../../data/OrderChatData";
import {ContinuationCommand} from "@motorro/firebase-ai-chat-core/lib/aichat/data/ContinuationCommand";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, THOMAS, TRANSFER, WAYPOINTS} from "../assistantName";
import {CrewMemberProfile, CrewMemberProfileSchema} from "../CrewMemberProfile";
import {canSwitchToTransfer, transferProfile} from "../transfer/transferHandOver";
import {
    canSwitchToFlightOptions,
    flightDetailsProfile,
    flightProfile,
    switchToFlight,
    switchToFlightOptions
} from "../flight/flightHandOver";
import {canSwitchToCatering, cateringProfile, switchToCatering} from "../catering/cateringHandOver";
import {switchToWaypoints, waypointsProfile} from "../waypoints/waypointsHandover";
import {canSwitchToDescription, switchToDescription} from "../handOver";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("Thomas");

/**
 * Front desk
 * @returns Vertex instructions
 */
export const thomasInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Thomas and you are a front desk of a client service in an elite private jet aviation industry.
        The client may come to you to arrange his private charter flight and supplementary services. Your company offers
        top-level private jet flights with following added services: in-flight catering and limousine transfer to/from the airport.
        
        The current order state is managed by function tools. To get current order status - call 'getOrder' function. 
        
        You have a bunch of assistants at your disposal that are trained to do specific tasks for the client.
        You will get a list of your assistants and their features in a list of of following objects in response: ${JSON.stringify(CrewMemberProfileSchema)}
        Always ask your assistant for help if their 'helpsWith' field is relevant to what user wants.
          
        When you call any of your assistants, it will fulfill the task you pass him and update the order. 
        The assistant will return:
        - In case of success: the new order status in 'data' field and some also some special comments and requests in 'comment' field.
        - Error description if anything went wrong
        
        Your assistant crew: ${JSON.stringify(getCrew(), null, 4)}
    `,
    examples: [
        {
            type: "functionCall",
            input: "I want to book a flight from Malta to Moscow",
            name: "switchTo",
            arguments: {id: FLIGHT, request: "The client wants to travel from Malta to Moscow."}
        },
        {
            type: "functionCall",
            input: "I want to change the number of passengers in my upcoming flight",
            name: "switchTo",
            arguments: {id: FLIGHT_OPTIONS, request: "Change the number of passengers"}
        },
        {
            type: "functionCall",
            input: "I'd like some burgers and french fries on board",
            name: "switchTo",
            arguments: {id: CATERING, request: "Have burgers and french fries on board"}
        },
        {
            type: "functionCall",
            input: "I'm departing from my home at San Pawls Bay",
            name: "switchTo",
            arguments: {
                id: TRANSFER,
                request: "The client is updating his airport transfer. Arrange the limousine transfer from San Pawls Bay to the departure airport"
            }
        }
    ],
    tools: {
        dispatcher: dispatcher,
        definition: [
            {
                functionDeclarations: [
                    canSwitchToDescription,
                    switchToDescription,
                    {
                        name: "getOrder",
                        description: "Returns current order state"
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
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    switch (name) {
        case "getOrder":
            return {
                result: data
            };
        case "switchTo":
            return await switchTo(data, args, chatData, toolsHandover);
        case "canSwitchTo":
            return canSwitchTo(data, args);
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };
}

function getCrew(): ReadonlyArray<CrewMemberProfile> {
    return [
        waypointsProfile,
        flightProfile,
        flightDetailsProfile,
        cateringProfile,
        transferProfile
    ];
}

function canSwitchTo(data: OrderChatData, args: Record<string, unknown>): ToolDispatcherReturnValue<OrderChatData> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case FLIGHT_OPTIONS:
            return {result: canSwitchToFlightOptions(data)};
        case CATERING:
            return {result: canSwitchToCatering(data)};
        case TRANSFER:
            return {result: canSwitchToTransfer(data)};
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
            return switchToWaypoints(chatData, args, toolsHandover, THOMAS);
        case FLIGHT:
            return switchToFlight(data, chatData, args, toolsHandover, THOMAS);
        case FLIGHT_OPTIONS:
            return switchToFlightOptions(data, chatData, args, toolsHandover, THOMAS);
        case CATERING:
            return switchToCatering(data, chatData, args, toolsHandover, THOMAS);
        case TRANSFER:
            return switchToCatering(data, chatData, args, toolsHandover, THOMAS);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}
