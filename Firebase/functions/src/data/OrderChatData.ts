import {ChatData} from "@motorro/firebase-ai-chat-core";
import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";
import {Airport, AirportSchema, Waypoint, WaypointSchema} from "./Waypoint";
import {Plane, PlaneSchema} from "../assistants/flight/getBaseFlightOptions";

export interface FlightDetails {
    readonly flightId: number
    readonly fromAirport: Airport
    readonly toAirport: Airport
    readonly departureTime: string
    readonly paxNumber: number
    readonly flightTimeMinutes: number
}

export interface ValidFlightDetails {
    readonly flightId: number
    readonly fromAirport: Airport
    readonly toAirport: Airport
    readonly departureTime: string
    readonly paxNumber: number
    readonly flightTimeMinutes: number
}

export const FlightDetailsSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Flight details",
    properties: {
        flightId: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Flight ID. Take from the flight options"
        },
        fromAirport: <FunctionDeclarationSchema><unknown>{
            ...AirportSchema,
            description: "Departure airport"
        },
        toAirport: <FunctionDeclarationSchema><unknown>{
            ...AirportSchema,
            description: "Arrival airport"
        },
        departureTime: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            format: "time",
            description: "Local time of departure. Example: 16:58"
        },
        paxNumber: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            format: "integer",
            description: "Maximum number of passengers"
        },
        flightTimeMinutes: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            format: "integer",
            description: "Flight time in minutes for selected route"
        }
    }
};

export interface FlightOrder {
    readonly from: Waypoint
    readonly to: Waypoint
    readonly departureDate: string
    readonly plane: Plane
    readonly details: FlightDetails | null
}

export interface ValidBaseFlightOrder extends FlightOrder {
    readonly from: Waypoint
    readonly to: Waypoint
    readonly departureDate: string
    readonly plane: Plane
}

export function areBasicFlightOptionsSet(order: FlightOrder | null): order is ValidBaseFlightOrder {
    return null != order && null !== order.from && null !== order.to && null !== order.departureDate && null !== order.plane;
}

export function areFlightDetailsSet(order: FlightDetails | null): order is ValidFlightDetails {
    return null != order && null !== order.flightId && null !== order.fromAirport && null !== order.toAirport && null !== order.departureTime && null != order.paxNumber && null != order.flightTimeMinutes;
}

export const FlightOrderSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Flight options",
    properties: {
        from: <FunctionDeclarationSchema><unknown><FunctionDeclarationSchemaProperty>{
            ...WaypointSchema,
            description: "Departure point for the trip: city, airport, street address, or any point on a map"
        },
        to: <FunctionDeclarationSchema><unknown><FunctionDeclarationSchemaProperty>{
            ...WaypointSchema,
            description: "Arrival point for the trip: city, airport, street address, or any point on a map"
        },
        departureDate: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            format: "date-time",
            description: "Departure date-time. ISO 8601 format"
        },
        plane: <FunctionDeclarationSchema>{
            ...PlaneSchema,
            description: "Selected airplane"
        },
        details: <FunctionDeclarationSchema><unknown>{
            ...FlightDetailsSchema,
            description: "Flight details"
        }
    }
};

export interface CateringItem {
    readonly name: string
    readonly quantity: number,
    readonly comment?: string
}

export const CateringItemSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "In-flight catering item description",
    properties: {
        name: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Dish name"
        },
        quantity: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Number of items required"
        },
        comment: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Optional comment"
        }
    },
    required: ["name", "quantity"]
};

export interface CateringDetails {
    readonly items: ReadonlyArray<CateringItem>
}

export const CateringDetailsSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "In-flight catering request",
    properties: {
        items: <FunctionDeclarationSchema><unknown>{
            type: "array",
            description: "Dishes to order",
            items: CateringItemSchema
        }
    },
    required: ["items"]
};

export interface TransferOrder {
    readonly departureWaypoint: string
    readonly destinationWaypoint: string
    readonly pickupDateTime: string
}

export const TransferOrderSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
        departureWaypoint: <FunctionDeclarationSchema>{
            ...WaypointSchema,
            description: "The address to pick-up the client"
        },
        destinationWaypoint: <FunctionDeclarationSchema>{
            ...WaypointSchema,
            description: "The address to drop the client"
        },
        pickupDateTime: <FunctionDeclarationSchema><unknown>{
            type: "string",
            description: "Pickup local date-tim in ISO 8601 format"
        }
    }
};

export interface TransferDetails extends Record<string, unknown>{
    readonly departureTransfer: TransferOrder | null
    readonly arrivalTransfer: TransferOrder | null
}

export const TransferDetailsSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Airport transfer details",
    properties: {
        departureTransfer: <FunctionDeclarationSchema><unknown>{
            ...TransferOrderSchema,
            description: "Transfer details for route: client's location -> departure airport"
        },
        arrivalTransfer: <FunctionDeclarationSchema><unknown>{
            ...TransferOrderSchema,
            description: "Transfer details for route: arrival airport -> client's destination"
        }
    }
};

/**
 * Service order data
 */
export interface OrderChatData extends ChatData {
    readonly flightOrder: FlightOrder | null
    readonly cateringDetails: CateringDetails | null
    readonly transferDetails: TransferDetails | null
}

export const OrderChatDataSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Order details",
    properties: {
        flightOrder: <FunctionDeclarationSchema><unknown>FlightOrderSchema,
        cateringDetails: <FunctionDeclarationSchema><unknown>CateringDetailsSchema,
        transferDetails: <FunctionDeclarationSchema><unknown>TransferDetailsSchema
    }
};

export const EMPTY_ORDER: OrderChatData = {
    flightOrder: null,
    cateringDetails: null,
    transferDetails: null
};

