import {Meta, tagLogger, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {OrderChatData, TransferDetailsSchema, TransferOrder} from "../../data/OrderChatData";
import {ContinuationCommand} from "@motorro/firebase-ai-chat-core/lib/aichat/data/ContinuationCommand";
import {
    ChatDispatchData,
    DispatchResult,
    ToolDispatcherReturnValue
} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {
    canSwitchToDescription,
    getCrewDescription,
    handBackData, handBackDescription,
    handBackInstructions,
    handOverInstructions,
    switchToDescription
} from "../handOver";
import {FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, TRANSFER, WAYPOINTS} from "../assistantName";
import {switchToWaypoints, waypointsProfile} from "../waypoints/waypointsHandover";
import {
    canSwitchToFlightOptions,
    flightDetailsProfile,
    flightProfile,
    switchToFlight,
    switchToFlightOptions
} from "../flight/flightHandOver";
import {canSwitchToCatering, cateringProfile, switchToCatering} from "../catering/cateringHandOver";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("Ace");

/**
 * Transfer assistant
 * @returns Vertex instructions
 */
export const transferInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Ace and you are working as a part of a client service team in a company who runs a private jet charter business.
        Your primary task: arrange an airport transfer order.
        You will get the following data at the beginning of the conversation:
        - The current transfer order data. The transfer order is described by the following JSON schema: ${JSON.stringify(TransferDetailsSchema)}
        - Departure and arrival airports.
        - Departure and arrival date-times.

        Follow the following instructions:
        1) Confirm the 'from' and 'to' points.
        2) If the waypoint are not set, delegate the task to Lady Hatt to get the missing waypoints from the client.
        3) Arrange the 'departureTransfer' if client needs a transfer to departure airport. 
           Use 'from' waypoint as 'departureWaypoint', use departure airport as 'arrivalWaypoint', use departure date-time minus one hour for the 'pickupDateTime'.
        4) Arrange the 'arrivalTransfer' if client needs a transfer from the arrival airport. 
           Use arrival airport as 'departureWaypoint', use 'to' waypoint as 'arrivalWaypoint', use arrival date-time for the 'pickupDateTime'.
        5) Call 'setTransfer' to update the transfer order.
        6) As soon as you arrange the order, call 'returnResult' to return to your teammate.
        
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
                        name: "setTransferDetails",
                        description: "Sets transfer details obtained from the client",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                departureTransfer: {
                                    ...TransferDetailsSchema,
                                    description: "Departure transfer if required"
                                },
                                arrivalTransfer: {
                                    ...TransferDetailsSchema,
                                    description: "Arrival transfer if required"
                                }
                            }
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
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    switch (name) {
        case "getCrew":
            return getCrew();
        case "switchTo":
            return await switchTo(data, args, toolsHandover, chatData);
        case "canSwitchTo":
            return canSwitchTo(data, args);
        case "returnResult":
            return handBackData(toolsHandover, data, <string>args.comment);
        case "setTransferDetails":
            logger.d("Setting transfer details: ", JSON.stringify(args));
            return setTransferDetails(data, args);
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };

    function setTransferDetails(soFar: OrderChatData, args: Record<string, unknown>): DispatchResult<OrderChatData> {
        let transfer = soFar.transferDetails || {
            departureTransfer: null,
            arrivalTransfer: null
        };

        const departure = <TransferOrder>args.departureTransfer;
        if (departure) {
            transfer = {
                ...transfer,
                departureTransfer: departure
            };
        }

        const arrival = <TransferOrder>args.arrivalTransfer;
        if (arrival) {
            transfer = {
                ...transfer,
                arrivalTransfer: arrival
            };
        }

        return {
            data: {
                ...data,
                transferDetails: transfer
            }
        };
    }
}

function getCrew(): ToolDispatcherReturnValue<OrderChatData> {
    return {
        result: [
            waypointsProfile,
            flightProfile,
            flightDetailsProfile,
            cateringProfile
        ]
    };
}

function canSwitchTo(data: OrderChatData, args: Record<string, unknown>): ToolDispatcherReturnValue<OrderChatData> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case FLIGHT_OPTIONS:
            return {result: canSwitchToFlightOptions(data)};
        case CATERING:
            return {result: canSwitchToCatering(data)};
        case TRANSFER:
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
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    chatData: ChatDispatchData<OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case WAYPOINTS:
            return switchToWaypoints(chatData, args, toolsHandover, TRANSFER);
        case FLIGHT:
            return switchToFlight(data, chatData, args, toolsHandover, TRANSFER);
        case FLIGHT_OPTIONS:
            return switchToFlightOptions(data, chatData, args, toolsHandover, TRANSFER);
        case CATERING:
            return switchToCatering(data, chatData, args, toolsHandover, TRANSFER);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}

