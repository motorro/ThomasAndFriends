import {
    DispatchError,
    getDispatchError,
    getFunctionSuccess, Meta,
    tagLogger,
    VertexAiSystemInstructions
} from "@motorro/firebase-ai-chat-vertexai";
import {OrderChatData} from "../../data/OrderChatData";
import {Location, LocationSchema} from "../../data/Location";
import {ContinuationCommand, ToolsHandOver} from "@motorro/firebase-ai-chat-core";
import {
    ChatDispatchData,
    FunctionSuccess,
    ToolDispatcherReturnValue
} from "@motorro/firebase-ai-chat-core/lib/aichat/ToolsDispatcher";
import {OrderChatMeta} from "../../data/OrderChatMeta";
import {
    canSwitchToDescription,
    getCrewDescription,
    handBackResult,
    handOverInstructions,
    switchToDescription
} from "../handOver";
import {mapsApiKey} from "../../env";
import {
    Client,
    FindPlaceFromTextRequest,
    GeocodeResult,
    PlaceInputType,
    ReverseGeocodeRequest
} from "@googlemaps/google-maps-services-js";
import {FunctionDeclarationSchemaProperty, FunctionDeclarationSchemaType} from "@google-cloud/vertexai";
import {Waypoint, WaypointSchema} from "../../data/Waypoint";
import {ReverseGeocodingLocationType} from "@googlemaps/google-maps-services-js/dist/geocode/reversegeocode";
import {AddressType} from "@googlemaps/google-maps-services-js/dist/common";
import {
    canSwitchToFlightOptions,
    flightDetailsProfile,
    flightProfile,
    switchToFlight,
    switchToFlightOptions
} from "../flight/flightHandOver";
import {canSwitchToTransfer, switchToTransfer, transferProfile} from "../transfer/transferHandOver";
import {ASSISTANT, CATERING, FLIGHT, FLIGHT_OPTIONS, TRANSFER, WAYPOINTS} from "../assistantName";
import {canSwitchToCatering, cateringProfile, switchToCatering} from "../catering/cateringHandOver";

const logger = tagLogger("Lady Hatt");

export const WaypointRequestResponseSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.ARRAY,
    items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            description: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Waypoint description",
                example: "Departure"
            },
            waypoint: WaypointSchema
        }
    },
    required: ["items"],
    example: [{
        description: "Departure waypoint",
        response: <Waypoint>{
            types: ["locality", "political"],
            value: "Moscow, Russia",
            location: {latitude: 55.75396, longitude: 37.620393}
        }
    }]
};

const CheckPlaceResultSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.ARRAY,
    description: "Places suggestions if found",
    items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
            name: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "A short place name",
                example: "Moscow"
            },
            geometry: {
                type: FunctionDeclarationSchemaType.OBJECT,
                description: "Contains place location",
                properties: {
                    location: {
                        type: FunctionDeclarationSchemaType.OBJECT,
                        description: "Place location",
                        properties: {
                            lat: {
                                type: FunctionDeclarationSchemaType.NUMBER,
                                description: "Place latitude"
                            },
                            lng: {
                                type: FunctionDeclarationSchemaType.NUMBER,
                                description: "Place longitude"
                            }
                        }
                    }
                }
            },
            formatted_address: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Formatted address of the place"
            },
            types: {
                type: FunctionDeclarationSchemaType.ARRAY,
                description: "A list of Google Maps Places API 'AddressType' values describing the place",
                example: ["continent", "country", "locality"]
            }
        }
    }
};

/**
 * Location assistant
 * @returns Vertex instructions
 */
export const waypointsInstructions = (): VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta> => ({
    instructions: `
        Your name is Lady Hatt and you are working as a part of a travel company client service team. 
        Your primary task: resolving and validating trip waypoints: addresses, cities, airports, etc.
        Your teammates will ask you to get some waypoints from the customer and/or to verify them.
        
        The Waypoint data type is described by the following JSON schema: ${JSON.stringify(WaypointSchema)}
        
        As soon as you obtain all the requested waypoints, use 'returnResult' to return the waypoints to your teammate.
        
        A teammate may come with some already obtained waypoints - they need to be validated. 
        Example request: "Validate departure from Moscow and arrival at Malta".
        1) Call 'checkPlaces' function with the list of the provided places names: "Moscow", "Malta".
        2) The 'checkPlaces' will return an object. A 'result' field of it will be an array of the following objects: ${JSON.stringify(CheckPlaceResultSchema)}.
        3) If there's more than one result for each place, ask the user to refine the input and suggest him the list of 
           the found places to choose from.
        4) Use 'formatted_address' from check result for the 'value' field in the result waypoint.
        5) Use 'types' from check result for the 'types' field in the result waypoint.
        6) Use 'geometry' from check result to make the 'location' field in the result waypoint.
        7) When when you get the exact result for each place, call 'returnResult' with the waypoint data:
           ${JSON.stringify([{description: "Departure from", waypoint: {value: "Moscow, Russia", location: {latitude: 55.75396, longitude: 37.620393}, types: ["locality", "political"]}}, {description: "Arrival to", waypoint: {value: "Malta", location: {latitude: 35.9, longitude: 14.516667}, types: ["locality", "political"]}}])}
        
        A teammate may come with only the waypoint descriptions that need to be obtained from the client.
        Example request: "Get the departure and arrival waypoints"
        1) You: Please tell me from where you want to start your journey?
        2) Client: "28 Broadway, New York, NY 10004"
        3) Call 'checkPlaces' to validate it.
        4) You: And where do you want to go?
        5) Client: "Moscow"
        6) Call 'checkPlaces' to validate "Moscow".
        7) Use 'formatted_address' from check result for the 'value' field in the result waypoint.
        8) Use 'geometry' from check result to make the 'location' field in the result waypoint.
        9) Use 'types' from check result for the 'types' field in the result waypoint.
        10) Call 'returnResult' with: ${JSON.stringify([{description: "Departure from", waypoint: {value: "28 Broadway, New York, NY 10004", location: {latitude: 40.705818, longitude: -74.013164}, types: ["street_address"]}}, {description: "Arrival to", waypoint: {value: "Moscow, Russia", location: {lat: 55.75396, lon: 37.620393}, types: ["locality", "political"]}}])}
        
        When asking the client to provide a waypoint add the following string to the end of the message: '[META:replyWith=location]'
        
        If the user or a teammate gives you a latitude/longitude location instead of the address, call 'reverseGeocode'
        to get a waypoint object of that location. The function will return a valid Waypoint for you.
        
        If the user does not want to provide some waypoints, call 'returnResult' function to return to your teammate and provide only 
        the waypoints obtained so far.
        
        ${handOverInstructions}
    `,
    tools: {
        dispatcher: dispatcher,
        definition: [
            {
                functionDeclarations: [
                    getCrewDescription,
                    canSwitchToDescription,
                    switchToDescription,
                    {
                        name: "checkPlaces",
                        description: "Checks if user input is a valid place",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                input: {
                                    type: FunctionDeclarationSchemaType.STRING,
                                    description: "Place to check",
                                    example: "Moscow"
                                }
                            },
                            required: ["input"]
                        }
                    },
                    {
                        name: "reverseGeocode",
                        description: "Returns a waypoint for given latitude/longitude",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                input: {
                                    ...LocationSchema,
                                    description: "Location given by client"
                                }
                            },
                            required: ["input"]
                        }
                    },
                    {
                        name: "returnResult",
                        description: "Returns obtained waypoints to the teammate",
                        parameters: {
                            type: FunctionDeclarationSchemaType.OBJECT,
                            properties: {
                                result: WaypointRequestResponseSchema
                            },
                            required: ["result"]
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
        case "checkPlaces":
            return await checkPlaces(<string>args.input);
        case "reverseGeocode":
            return await reversePlace(<Location>args.input);
        case "returnResult":
            logger.d("Returning to teammate", JSON.stringify(args));
            return await handBackResult(toolsHandover, <Record<string, unknown>>args.result, <string>args.comment);
    }
    logger.w(`Unimplemented function call: ${name}. Args:`, JSON.stringify(args));
    return {
        error: `There is no such function: ${name}. Check tools definition`
    };
}

async function checkPlaces(input: string): Promise<FunctionSuccess | DispatchError> {
    logger.d("Validating place:", input);
    const request: FindPlaceFromTextRequest = {
        params: {
            input: input,
            inputtype: PlaceInputType.textQuery,
            fields: ["name", "geometry", "formatted_address", "types"],
            key: mapsApiKey.value()
        }
    };
    const client = new Client({config: {}});
    try {
        const result = (await client.findPlaceFromText(request)).data.candidates;
        return getFunctionSuccess(result);
    } catch (e) {
        logger.w("Maps error", e);
        return getDispatchError(e);
    }
}

async function reversePlace(input: Location): Promise<FunctionSuccess | DispatchError> {
    logger.d("Reverse geocoding:", JSON.stringify(input));
    const resultTypes: Array<AddressType> = [
        AddressType.street_address,
        AddressType.airport,
        AddressType.point_of_interest,
        AddressType.park,
        AddressType.intersection,
        AddressType.route,
        AddressType.sublocality,
        AddressType.locality,
        AddressType.political
    ];
    const request: ReverseGeocodeRequest = {
        params: {
            latlng: input,
            result_type: resultTypes,
            location_type: [ReverseGeocodingLocationType.APPROXIMATE],
            key: mapsApiKey.value()
        }
    };
    const client = new Client({config: {}});
    try {
        const results = (await client.reverseGeocode(request)).data.results;
        return getFunctionSuccess(getWaypoint(results));
    } catch (e) {
        logger.w("Maps error", e);
        return getDispatchError(e);
    }

    function getWaypoint(results: ReadonlyArray<GeocodeResult>): Waypoint {
        if (0 === results.length) {
            return {
                location: input,
                value: "Some mysterious place in the middle of nowhere"
            };
        }

        let result: GeocodeResult = results[0];
        for (const type of resultTypes) {
            const filtered = results.find((it) => it.types.includes(type));
            if (undefined !== filtered) {
                result = filtered;
                break;
            }
        }
        return {
            location: input,
            value: result.formatted_address,
            types: result.types
        };
    }
}

function getCrew(): ToolDispatcherReturnValue<OrderChatData> {
    return {
        result: [
            flightProfile,
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
        case TRANSFER:
            return {result: canSwitchToTransfer(data)};
        case CATERING:
            return {result: canSwitchToCatering(data)};
        case WAYPOINTS:
            return {result: {possible: false, comments: "You are a waypoints assistant yourself"}};
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
        case FLIGHT:
            return switchToFlight(data, chatData, args, toolsHandover, WAYPOINTS);
        case FLIGHT_OPTIONS:
            return switchToFlightOptions(data, chatData, args, toolsHandover, WAYPOINTS);
        case CATERING:
            return switchToCatering(data, chatData, args, toolsHandover, WAYPOINTS);
        case TRANSFER:
            return switchToTransfer(data, chatData, args, toolsHandover, WAYPOINTS);
    }
    return {
        error: `Can't switch. Unknown assistantId: ${assistantId}`
    };
}
