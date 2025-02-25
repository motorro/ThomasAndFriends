import {CrewMemberProfile} from "../CrewMemberProfile";
import {ASSISTANT, getAssistantName, WAYPOINTS} from "../assistantName";
import {WaypointRequestResponseSchema} from "./Waypoints";
import {ChatDispatchData, ToolDispatcherReturnValue, ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {OrderChatData} from "../../data/OrderChatData";
import {getChatConfig, getChatMeta} from "../../chatFactory";
import {handOver} from "../handOver";
import {Meta} from "@motorro/firebase-ai-chat-vertexai";
import {Engine} from "../../env";

const engine: Engine | undefined = undefined;

export const waypointsProfile: CrewMemberProfile = {
    assistantId: WAYPOINTS,
    name: getAssistantName(WAYPOINTS),
    helpsWith: `
        Gets and validates waypoints from the user. Call her each time you need a waypoint from user
        or need to validate some waypoint input.
        ${getAssistantName(WAYPOINTS)} will return the following result to your request: ${JSON.stringify(WaypointRequestResponseSchema)}
        
        Example.
        1) Client: "I want to go from 28 Broadway, New York, NY 10004 to Moscow"
        2) Call ${getAssistantName(WAYPOINTS)} with the request: "Get waypoints. Departure: 28 Broadway, New York, NY 10004; Arrival: Moscow"
        3) Response from Lady Hatt: ${JSON.stringify([{description: "Departure", waypoint: {value: "28 Broadway, New York, NY 10004", location: {latitude: 40.705818, longitude: -74.013164}, types: ["street_address"]}}, {description: "Arrival", waypoint: {value: "Moscow, Russia", location: {lat: 55.75396, lon: 37.620393}, types: ["locality", "political"]}}])}
    `
};

export async function switchToWaypoints(
    chatData: ChatDispatchData<OrderChatMeta>,
    args: Record<string, unknown>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>,
    from: ASSISTANT
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    return handOver(
        getChatConfig(WAYPOINTS, engine),
        chatData,
        getChatMeta(WAYPOINTS, engine).aiMessageMeta,
        toolsHandover,
        args,
        from
    );
}

