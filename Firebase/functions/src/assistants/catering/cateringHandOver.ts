import {CrewMemberProfile} from "../CrewMemberProfile";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, getAssistantName} from "../assistantName";
import {ChatDispatchData, ToolDispatcherReturnValue} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {areBasicFlightOptionsSet, areFlightDetailsSet, OrderChatData} from "../../data/OrderChatData";
import {getChatConfig, getChatMeta} from "../../chatFactory";
import {doHandOver} from "../handOver";
import {Meta, tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {HandOverPossible} from "../HandOverPossible";
import {getMa} from "../flight/getMa";
import {Engine} from "../../env";

const logger = tagLogger("handOver");
const engine: Engine | undefined = undefined;

export const cateringProfile: CrewMemberProfile = {
    assistantId: CATERING,
    name: getAssistantName(CATERING),
    helpsWith: `
        In charge for in-flight catering and food service.
        
        Example.
        1) Client: "Can I book an in-flight catering? Some burgers and fries will do"
        2) Call ${getAssistantName(CATERING)} with the request: "Catering request. Burgers, fries"
    `,
    preRequisites: `Call 'canSwitchTo' with 'assistantId' set to '${CATERING}' EACH TIME before switching to ${getAssistantName(CATERING)}. The function will validate if catering could be processed.`
};

export async function switchToCatering(
    soFar: OrderChatData,
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("Switching to catering...");

    const messages: Array<string> = [];

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

    const order = soFar.cateringDetails;
    if (order) {
        logger.d("Current catering order:", JSON.stringify(order));
        messages.push(`Current catering order: ${JSON.stringify(order)}`);
    } else {
        messages.push("No active catering order so far");
    }

    const departureMa = await getMa(flightOrder.from);
    messages.push(`The client is flying from: ${departureMa.name}, ${departureMa.region}`);
    messages.push(`Number of passengers on board: ${flightDetails.paxNumber}`);

    return doHandOver(
        getChatConfig(CATERING, engine),
        chatData,
        getChatMeta(CATERING, engine).aiMessageMeta,
        messages,
        toolsHandover,
        from
    );
}

/**
 * Checks if Topham Hatt could proceed
 * @param soFar Order so far
 * @returns true if Topham Hatt could proceed
 */
export function canSwitchToCatering(soFar: OrderChatData): HandOverPossible {
    if (areBasicFlightOptionsSet(soFar.flightOrder)) {
        if (areFlightDetailsSet(soFar.flightOrder.details)) {
            return {possible: true};
        } else {
            return {
                possible: false,
                comments: `No. Flight details are not set. Ask ${getAssistantName(FLIGHT_OPTIONS)} to fill flight details before asking for catering.`
            };
        }
    } else {
        return {
            possible: false,
            comments: `No. Basic flight options are not set. Ask ${getAssistantName(FLIGHT)} to fill flight details before asking for catering.`
        };
    }
}

