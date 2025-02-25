import {Meta, tagLogger, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {FlightDetails, FlightDetailsSchema, OrderChatData} from "../../data/OrderChatData";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {CharterOptionsSchema} from "./getCharterOptions";
import {Airport} from "../../data/Waypoint";
import {FunctionDeclarationSchema, FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {Location, LocationSchema} from "../../data/Location";
import {ContinuationCommand} from "@motorro/firebase-ai-chat-core/lib/aichat/data/ContinuationCommand";
import {
    ChatDispatchData,
    ToolDispatcherReturnValue
} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {
    canSwitchToDescription,
    getCrewDescription,
    handBackData, handBackDescription,
    handBackInstructions,
    handOverInstructions,
    switchToDescription
} from "../handOver";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, getAssistantName, TRANSFER, WAYPOINTS} from "../assistantName";
import {switchToWaypoints, waypointsProfile} from "../waypoints/waypointsHandover";
import {flightProfile, switchToFlight} from "./flightHandOver";
import {canSwitchToCatering, cateringProfile, switchToCatering} from "../catering/cateringHandOver";
import {canSwitchToTransfer, switchToTransfer, transferProfile} from "../transfer/transferHandOver";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("Harold");

/**
 * Charter details assistant
 * @returns Vertex instructions
 */
export const charterDetailsInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Harold and you are working as a part of a client service team in a company who runs a private jet charter business.
        Your primary task: complete flight order configuration.
        You will get the following data at the beginning of the conversation:
        - The current flight order data. You need to fill-in the 'details' field.
        - The flight options available to order. Options are described by the following schema: ${JSON.stringify(CharterOptionsSchema)}.
        
        You are in charge for helping the client to find optimal flight options according to his preferences.
        1) Ask the client what he prefers more: his favorite airport of departure or arrival, preferred departure or arrival
           time or the shortest way possible.
        2) There is a selection of routes available under 'possibleRoutes' field of the flight options. Each route describes
           the departure and arrival airports, flight times and available departure time intervals.
        3) The client should choose arrival and departure airports and departure time among 'possibleRoutes'. Help him to 
           choose one according to his preferences from point one. For example: suggest the closest airports to the starting
           and destination points of his journey
        4) If you need to calculate the distance between locations, don't make assumptions and use 'getDistance' function.
        5) Ask the client how many passengers he expects on board. The number of passengers can not exceed 'maximumPassengersOnBoard'
           field value of flight options.
        6) As soon as you get arrival airport, departure airport, departure time, and the number of passengers, call 
           'setFlightDetails' function to update order data. Take flight ID directly from the flight options.
        7) As soon as the client confirms the details, call 'returnToBoss' to return to your boss. Provide a short summary
           of the order and the client's preferences in the comment field.
        8) If the client wants something else besides the flight details, call 'returnToBoss' with a summary of his request
            in the 'comment' field. Call 'setFlightDetails' before 'returnToBoss' to save the options selected so far.
            Example:   
            User: Set number of passengers to 5. And I want to change the aircraft to Challenger 350.
            AI: Call 'setFlightDetails' with 'paxNumber' equal to 5
            AI: Call 'returnResult'. Comment value: 'User wants to change the aircraft to Challenger 350'
    
        ${handOverInstructions}
        ${handBackInstructions}
    `,
    tools: {
        dispatcher: charterOptionsDispatcher,
        definition: [
            {
                functionDeclarations: [
                    getCrewDescription,
                    canSwitchToDescription,
                    switchToDescription,
                    handBackDescription,
                    {
                        name: "getDistance",
                        description: "Calculates the distance between locations",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                input: {
                                    type: FunctionDeclarationSchemaType.ARRAY,
                                    description: "A list of from/to location pairs to calculate the distance between",
                                    items: <FunctionDeclarationSchema><unknown>{
                                        type: FunctionDeclarationSchemaType.ARRAY,
                                        description: "A pair of from/to location objects to calculate the distance between them",
                                        items: LocationSchema
                                    },
                                    example: [
                                        [{latitude: 51.148056, longitude: 0.190278}, {latitude: 51.4710888888889, longitude: -0.461913888888889}]
                                    ]
                                }
                            }
                        }
                    },
                    {
                        name: "setFlightDetails",
                        description: "Sets flight details",
                        parameters: <FunctionDeclarationSchema>FlightDetailsSchema
                    }
                ]
            }
        ]
    }
});

async function charterOptionsDispatcher(
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
        case "getDistance":
            logger.d("Getting distance:", JSON.stringify(args));
            return {
                result: {distance: (<ReadonlyArray<[Location, Location]>>args.input).map(([from, to]) => getDistance(from, to))}
            };
        case "setFlightDetails":
            logger.d("Setting flight details: ", JSON.stringify(args));
            return setFlightDetails(data, args);
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };
}

function setFlightDetails(soFar: OrderChatData, args: Record<string, unknown>): ToolDispatcherReturnValue<OrderChatData> {
    try {
        if (!soFar.flightOrder) {
            return {
                error: `Unexpected order state. No basic flight order. Return to ${getAssistantName(FLIGHT)}`
            };
        }
        return {
            data: {
                ...soFar,
                flightOrder: {
                    ...soFar.flightOrder,
                    details: {
                        flightId: checkArgValue<number>("flightId"),
                        fromAirport: checkArgValue<Airport>("fromAirport"),
                        toAirport: checkArgValue<Airport>("toAirport"),
                        departureTime: checkArgValue<string>("departureTime"),
                        paxNumber: checkArgValue<number>("paxNumber"),
                        flightTimeMinutes: checkArgValue<number>("flightTimeMinutes")
                    }
                }
            }
        };
    } catch (e) {
        return {
            error: (<Error>e).message
        };
    }

    function checkArgValue<T>(field: keyof FlightDetails): T {
        const value = <T>args[field];
        if (undefined === value) {
            throw new Error(`Required field ${field} was not found in arguments. Please provide ${field}`);
        }
        return value;
    }
}

function getDistance(from: Location, to: Location): number {
    const {latitude: lat1, longitude: lon1} = from;
    const {latitude: lat2, longitude: lon2} = to;

    const radius = 6371; // Radius of the earth

    const f1 = toRadians(lat1);
    const l1 = toRadians(lon1);
    const f2 = toRadians(lat2);
    const l2 = toRadians(lon2);

    const df = f2 - f1;
    const dl = l2 - l1;

    const a = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;

    function toRadians(deg: number): number {
        return deg * Math.PI / 180.0;
    }
}

function getCrew(): ToolDispatcherReturnValue<OrderChatData> {
    return {
        result: [
            waypointsProfile,
            flightProfile,
            cateringProfile,
            transferProfile
        ]
    };
}

function canSwitchTo(data: OrderChatData, args: Record<string, unknown>): ToolDispatcherReturnValue<OrderChatData> {
    const assistantId = <ASSISTANT>args.assistantId;
    switch (assistantId) {
        case CATERING:
            return {result: canSwitchToCatering(data)};
        case TRANSFER:
            return {result: canSwitchToTransfer(data)};
        case FLIGHT_OPTIONS:
            return {result: {possible: false, comments: "You are a flight options assistant yourself"}};
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
            return switchToWaypoints(chatData, args, toolsHandover, FLIGHT_OPTIONS);
        case FLIGHT:
            return switchToFlight(data, chatData, args, toolsHandover, FLIGHT_OPTIONS);
        case CATERING:
            return switchToCatering(data, chatData, args, toolsHandover, FLIGHT_OPTIONS);
        case TRANSFER:
            return switchToTransfer(data, chatData, args, toolsHandover, FLIGHT_OPTIONS);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}
