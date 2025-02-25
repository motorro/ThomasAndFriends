import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";

export interface Location {
    readonly latitude: number
    readonly longitude: number
}

export const LocationSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
        latitude: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Location latitude"
        },
        longitude: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Location longitude"
        }
    },
    required: ["lat", "lon"]
};
