import {areBasicFlightOptionsSet, OrderChatData} from "../../data/OrderChatData";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {ASSISTANT, FLIGHT, FLIGHT_OPTIONS, getAssistantName} from "../assistantName";
import {getChatConfig, getChatMeta} from "../../chatFactory";
import {getCharterOptions} from "./getCharterOptions";
import {doHandOver} from "../handOver";
import {Meta, tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {CrewMemberProfile} from "../CrewMemberProfile";
import {HandOverPossible} from "../HandOverPossible";

const logger = tagLogger("handOver");

export const flightProfile: CrewMemberProfile = {
    assistantId: FLIGHT,
    name: getAssistantName(FLIGHT),
    helpsWith: `
        In charge of basic flight order creation. If user requests a flight - call Emerson to arrange the flight.
        The order state will be updated when Emerson returns you a result.
        
        Example.
        1) Client: "I want to go from Malta to Moscow"
        2) Call ${getAssistantName(FLIGHT)} with the request: "Flight booking. From: Malta; To: Moscow"
    `,
    nextSteps: `Offer user to arrange an in-flight catering if ${getAssistantName(FLIGHT)} creates a flight order`
};

export const flightDetailsProfile: CrewMemberProfile = {
    assistantId: FLIGHT_OPTIONS,
    name: getAssistantName(FLIGHT_OPTIONS),
    helpsWith: `
        In charge of flight details: airports, departure times, passengers, etc
        
        Example.
        1) Client: "I want to add two more passengers"
        2) Call ${getAssistantName(FLIGHT_OPTIONS)} with the request: "Flight options change. Add 2 more passengers"
    `,
    preRequisites: `Call Call 'canSwitchTo' with 'assistantId' set to '${FLIGHT_OPTIONS}' EACH TIME before switching to ${getAssistantName(FLIGHT_OPTIONS)}. The function will validate if flight details could be processed.`
};

export async function switchToFlight(
    soFar: OrderChatData,
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("Switching to basic flight options...");

    const messages: Array<string> = ["Here is the data for the current order:"];

    const request = <string>args.request;
    if (undefined !== request) {
        messages.push(`A request from client: ${request}`);
    }

    const flightOrder = soFar.flightOrder;
    if (flightOrder) {
        logger.d("Current flight order:", JSON.stringify(flightOrder));
        messages.push(`Current options selected by user: ${JSON.stringify(flightOrder)}`);
    } else {
        messages.push("No active flight order so far");
    }

    return doHandOver(
        getChatConfig(FLIGHT),
        chatData,
        getChatMeta(FLIGHT).aiMessageMeta,
        messages,
        toolsHandover,
        from
    );
}

export async function switchToFlightOptions(
    soFar: OrderChatData,
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("Switching to charter flight options...");

    const messages: Array<string> = ["Here is the data for the current order:"];

    const flightOrder = soFar.flightOrder;
    if (!areBasicFlightOptionsSet(flightOrder)) {
        return {
            error: `Basic flight options are not yet configured. Ask ${getAssistantName(FLIGHT)} to create the flight order before changing flight details.`
        };
    }

    messages.push(`Current flight order state: ${JSON.stringify(flightOrder)}`);

    const request = <string>args.request;
    if (undefined !== request) {
        messages.push(`Known flight request from client: ${request}`);
    } else {
        messages.push("Configure the flight for the client");
    }

    logger.d("Getting charter options...");
    const options = await getCharterOptions(
        flightOrder.from,
        flightOrder.to,
        flightOrder.departureDate,
        flightOrder.plane,
    );
    messages.push(`Here are available flight options: ${JSON.stringify(options)}`);

    return doHandOver(
        getChatConfig(FLIGHT_OPTIONS),
        chatData,
        getChatMeta(FLIGHT_OPTIONS).aiMessageMeta,
        messages,
        toolsHandover,
        from
    );
}

/**
 * Checks if FlightOptions may take over
 * @param soFar Current order state
 * @returns true if FlightOptions could proceed
 */
export function canSwitchToFlightOptions(soFar: OrderChatData): HandOverPossible {
    if (areBasicFlightOptionsSet(soFar.flightOrder)) {
        return {
            possible: true
        };
    } else {
        return {
            possible: false,
            comments: `No. Basic flight options are not set. Ask ${getAssistantName(FLIGHT)} to fill flight details before asking for catering.`
        };
    }
}
