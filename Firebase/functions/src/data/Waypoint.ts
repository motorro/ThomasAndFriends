import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";
import {Location, LocationSchema} from "./Location";

export interface Waypoint extends Record<string, unknown>{
    readonly value: string
    readonly location: Location,
    readonly types?: Array<string>
}

export interface Airport extends Waypoint {
    readonly id: string
}

export const WaypointSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Waypoint: city, airport, street address, or any point on a map",
    properties: {
        value: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Waypoint value corresponding to selected 'type'"
        },
        location: <FunctionDeclarationSchema><unknown>{
            ...LocationSchema,
            description: "Waypoint location"
        },
        types: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            items: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Waypoint category"
            },
            description: "Categories that describe the waypoint",
            example: ["street_address", "restaurant"]
        }
    },
    required: ["value", "location"]
};

export const AirportSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Airport: departure, arrival, etc",
    properties: {
        id: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Airport ID"
        },
        value: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Waypoint value corresponding to selected 'type'"
        },
        location: <FunctionDeclarationSchema><unknown>{
            ...LocationSchema,
            description: "Waypoint location"
        },
        types: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            items: {
                type: FunctionDeclarationSchemaType.STRING,
                description: "Waypoint category"
            },
            description: "Categories that describe the waypoint",
            example: ["street_address", "restaurant"]
        }
    },
    required: ["id", "value", "location"]
};
