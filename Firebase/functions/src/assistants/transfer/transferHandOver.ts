import {areBasicFlightOptionsSet, areFlightDetailsSet, OrderChatData} from "../../data/OrderChatData";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {ASSISTANT, FLIGHT, FLIGHT_OPTIONS, getAssistantName, TRANSFER} from "../assistantName";
import {LocalDate, LocalTime} from "@js-joda/core";
import {getChatConfig, getChatMeta} from "../../chatFactory";
import {doHandOver} from "../handOver";
import {Meta, tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {CrewMemberProfile} from "../CrewMemberProfile";
import {HandOverPossible} from "../HandOverPossible";

const logger = tagLogger("handOver");

export const transferProfile: CrewMemberProfile = {
    assistantId: TRANSFER,
    name: getAssistantName(TRANSFER),
    helpsWith: `
        In charge for airport transfer and limousine service.
        
        Example.
        1) Client: "I want a transfer to Vnukovo airport"
        2) Call ${getAssistantName(TRANSFER)} with the request: "Airport transfer. Book a transfer to Vnukovo airport"
    `,
    preRequisites: `Call 'canSwitchTo' with 'assistantId' set to '${TRANSFER}' EACH TIME before switching to ${getAssistantName(TRANSFER)}. The function will validate if transfer could be processed.`
};

export async function switchToTransfer(
    soFar: OrderChatData,
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("Switching to transfer options...");

    const messages: Array<string> = ["Here is the data for the current order:"];

    const request = <string>args.request;
    if (undefined !== request) {
        messages.push(`A request from client: ${request}`);
    }

    const flightOrder = soFar.flightOrder;
    if (!areBasicFlightOptionsSet(flightOrder)) {
        return {
            error: `Basic flight options are not yet configured. Ask ${getAssistantName(FLIGHT)} to create the flight order before ordering transfer.`
        };
    }
    const flightDetails = flightOrder.details;
    if (!areFlightDetailsSet(flightDetails)) {
        return {
            error: `Flight details are not yet configured. Ask ${getAssistantName(FLIGHT_OPTIONS)} to fill flight details before ordering transfer.`
        };
    }

    const order = soFar.transferDetails;
    if (order) {
        logger.d("Current transfer order:", JSON.stringify(order));
        messages.push(`Current options selected by user: ${JSON.stringify(order)}`);
    } else {
        messages.push("No active transfer order so far");
    }

    const departureDateTime = LocalDate.parse(flightOrder.departureDate).atTime(LocalTime.parse(flightDetails.departureTime));
    const flightTime = flightDetails.flightTimeMinutes;
    messages.push(`Departure airport: ${JSON.stringify(flightDetails.fromAirport)}`);
    messages.push(`Arrival airport: ${JSON.stringify(flightDetails.toAirport)}`);
    messages.push(`Departure date-time: ${departureDateTime.toString()}`);
    messages.push(`Arrival date-time: ${departureDateTime.plusMinutes(flightTime).toString()}`);

    return doHandOver(
        getChatConfig(TRANSFER),
        chatData,
        getChatMeta(TRANSFER).aiMessageMeta,
        messages,
        toolsHandover,
        from
    );
}

/**
 * Checks if Transfer could proceed
 * @param soFar Order so far
 * @returns true if Transfer could proceed
 */
export function canSwitchToTransfer(soFar: OrderChatData): HandOverPossible {
    if (areBasicFlightOptionsSet(soFar.flightOrder)) {
        if (areFlightDetailsSet(soFar.flightOrder.details)) {
            return {possible: true};
        } else {
            return {
                possible: false,
                comments: `No. Flight details are not set. Ask ${getAssistantName(FLIGHT_OPTIONS)} to fill flight details before asking for transfer.`
            };
        }
    } else {
        return {
            possible: false,
            comments: `No. Basic flight options are not set. Ask ${getAssistantName(FLIGHT)} to fill flight details before asking for transfer.`
        };
    }
}
