import {Meta, tagLogger, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {FlightOrderSchema, OrderChatData} from "../../data/OrderChatData";
import {ContinuationCommand} from "@motorro/firebase-ai-chat-core/lib/aichat/data/ContinuationCommand";
import {
    ChatDispatchData,
    DispatchError,
    DispatchResult,
    FunctionSuccess,
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
import {Waypoint, WaypointSchema} from "../../data/Waypoint";
import {LocalDate} from "@js-joda/core";
import {BaseFlightOptionsSchema, getBaseFlightOptions, Plane, PlaneSchema} from "./getBaseFlightOptions";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, getAssistantName, TRANSFER, WAYPOINTS} from "../assistantName";
import {FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {getMa} from "./getMa";
import {parseLocalDate} from "../../utils";
import {switchToWaypoints, waypointsProfile} from "../waypoints/waypointsHandover";
import {
    canSwitchToFlightOptions,
    flightDetailsProfile,
    switchToFlightOptions
} from "./flightHandOver";
import {canSwitchToCatering, cateringProfile, switchToCatering} from "../catering/cateringHandOver";
import {canSwitchToTransfer, switchToTransfer, transferProfile} from "../transfer/transferHandOver";
import {ToolsHandOver} from "@motorro/firebase-ai-chat-core";

const logger = tagLogger("Emerson");

/**
 * Date and aircraft assistant
 * @returns Vertex instructions
 */
export const baseFlightOptionsInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Emerson and you are working as a part of a client service team in a company who runs a private jet charter business.
        Your primary task: initial flight order configuration.
        You need to evaluate the departure waypoints, departure date, and the airplane type for the flight.
        The flight order is described by the following schema: ${JSON.stringify(FlightOrderSchema)}
        
        Follow the following steps to fill the details:
        1) Check the current order status if 'from' and 'to' are set. If set, call ${getAssistantName(WAYPOINTS)} to validate them.
        2) If not set or only one of them is provided, delegate the task to ${getAssistantName(WAYPOINTS)} passing her the passed data and request to get the missing waypoints from the client.
        3) Get the minimum date allowed to place the order by calling 'getMinimumDate'.
        4) Get the flight date from user or from the initial request. If user does not supply the month or the year - take them from the minimum date.
        5) The flight date provided by the client should be later than the minimum date.
        6) When you get the departure waypoints and the departure date, call 'getAvailablePlanes' tool to get the available airplanes.
        7) Ask user to select an available plane type from those available in base flight options. If you've already got
           the desired aircraft in the initial request, check it is among the available options.
        8) Call 'setFlightData' to update the order details.
        9) Hand the job over to your assistant ${getAssistantName(FLIGHT_OPTIONS)}. He will ask the client for the flight 
           details and set the resulting order state. You may pass additional data about client request in a 'request' parameter.
        10) When the order is set up, return to the front desk with the summary of the job.
        
        Any requests from client to change the departure time or the airport or the number of passengers should be 
        passed to ${getAssistantName(FLIGHT_OPTIONS)}.

        ${handOverInstructions}
        ${handBackInstructions}
    `,
    tools: {
        dispatcher: baseFlightOptionsDispatcher,
        definition: [
            {
                functionDeclarations: [
                    getCrewDescription,
                    canSwitchToDescription,
                    switchToDescription,
                    handBackDescription,
                    {
                        name: "getMinimumDate",
                        description: "Returns the minimum departure date available"
                    },
                    {
                        name: "getAvailablePlanes",
                        description: `Returns the list of the airplanes available for the route. The return value has the following schema: ${JSON.stringify(BaseFlightOptionsSchema)}`,
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                from: {
                                    ...WaypointSchema,
                                    description: "Departure waypoint you get from Lady Hatt"
                                },
                                to: {
                                    ...WaypointSchema,
                                    description: "Arrival waypoint you get from Lady Hatt"
                                },
                                departureDate: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    format: "date",
                                    description: "Departure date converted to format YYYY-MM-DD"
                                }
                            },
                            required: ["from", "to", "departureDate"]
                        }
                    },
                    {
                        name: "setFlightData",
                        description: "Updates flight details",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                from: {
                                    ...WaypointSchema,
                                    description: "Departure waypoint you get from Lady Hatt"
                                },
                                to: {
                                    ...WaypointSchema,
                                    description: "Arrival waypoint you get from Lady Hatt"
                                },
                                departureDate: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    format: "date",
                                    description: "Departure date converted to format YYYY-MM-DD"
                                },
                                plane: {
                                    ...PlaneSchema,
                                    description: "Plane model selected by user"
                                }
                            }
                        }
                    }
                ]
            }
        ]
    }
});

async function baseFlightOptionsDispatcher(
    data: OrderChatData,
    name: string,
    args: Record<string, unknown>,
    _continuation: ContinuationCommand<unknown>,
    chatData: ChatDispatchData<OrderChatMeta>,
    toolsHandover: ToolsHandOver<Meta, OrderChatMeta>
): Promise<ToolDispatcherReturnValue<OrderChatData>> {
    logger.d("BASE_FLIGHT_DISPATCHER: ", JSON.stringify(data));
    switch (name) {
        case "getCrew":
            return getCrew();
        case "switchTo":
            return await switchTo(data, args, toolsHandover, chatData);
        case "canSwitchTo":
            return canSwitchTo(data, args);
        case "returnResult":
            return handBackData(toolsHandover, data, <string>args.comment);
        case "getMinimumDate":
            return {
                result: {
                    minimumDate: getMinimumDate().toString()
                }
            };
        case "setFlightData":
            logger.d("setFlightData:", JSON.stringify(args));
            return setFlightData(data, args);
        case "getAvailablePlanes":
            logger.d("getAvailablePlanes:", JSON.stringify(args));
            return getAvailablePlanes(args);
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };
}

function getMinimumDate(): LocalDate {
    return LocalDate.now().plusDays(1);
}

async function getAvailablePlanes(args: Record<string, unknown>): Promise<FunctionSuccess | DispatchError> {
    const from = <Waypoint>args.from;
    if (!from) {
        return {
            error: "No waypoint passed for 'from'"
        };
    }
    const to = <Waypoint>args.to;
    if (!to) {
        return {
            error: "No waypoint passed for 'to'"
        };
    }
    const stringDepartureDate = <string>args.departureDate;
    if (!stringDepartureDate) {
        return {
            error: "Departure date was not supplied. Provide departure date!"
        };
    }
    const departureDate: LocalDate = parseLocalDate(stringDepartureDate);
    if (departureDate.isBefore(getMinimumDate())) {
        return {
            error: "Departure is set too early. Please select departure date after the one returned by 'getMinimumDate'"
        };
    }

    const fromMa = await getMa(from);
    const toMa = await getMa(to);
    const flightOptions = await getBaseFlightOptions(fromMa, toMa);

    return {
        result: <Array<Plane>>flightOptions.availablePlanes
    };
}

function setFlightData(soFar: OrderChatData, args: Record<string, unknown>): DispatchResult<OrderChatData> {
    const from = <Waypoint>args.from;
    if (!from) {
        return {
            error: "No waypoint passed for 'from'"
        };
    }
    const to = <Waypoint>args.to;
    if (!to) {
        return {
            error: "No waypoint passed for 'to'"
        };
    }
    const stringDepartureDate = <string>args.departureDate;
    if (!stringDepartureDate) {
        return {
            error: "Departure date was not supplied. Provide departure date!"
        };
    }
    const departureDate: LocalDate = parseLocalDate(stringDepartureDate);
    if (departureDate.isBefore(getMinimumDate())) {
        return {
            error: "Departure is set too early. Please select departure date after the one returned by 'getMinimumDate'"
        };
    }
    const airplane = <Plane>args.plane;
    if (!airplane) {
        return {
            error: "Airplane was not supplied. Provide selected airplane!"
        };
    }

    return {
        data: {
            ...soFar,
            flightOrder: {
                from: from,
                to: to,
                departureDate: departureDate.toString(),
                plane: airplane,
                details: null
            }
        }
    };
}

function getCrew(): ToolDispatcherReturnValue<OrderChatData> {
    return {
        result: [
            waypointsProfile,
            flightDetailsProfile,
            cateringProfile,
            transferProfile
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
            return {result: canSwitchToTransfer(data)};
        case FLIGHT:
            return {result: {possible: false, comments: "You are a flight assistant yourself"}};
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
            return switchToWaypoints(chatData, args, toolsHandover, FLIGHT);
        case FLIGHT_OPTIONS:
            return switchToFlightOptions(data, chatData, args, toolsHandover, FLIGHT);
        case CATERING:
            return switchToCatering(data, chatData, args, toolsHandover, FLIGHT);
        case TRANSFER:
            return switchToTransfer(data, chatData, args, toolsHandover, FLIGHT);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}

