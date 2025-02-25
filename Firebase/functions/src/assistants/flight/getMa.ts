import {Waypoint} from "../../data/Waypoint";
import {tagLogger} from "@motorro/firebase-ai-chat-vertexai";
import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";
import {BeResponse} from "../../data/BeResponse";
import {callBe} from "../../callBe";

const logger = tagLogger("getMa");

export interface MetropolitanArea {
    readonly id: number
    readonly name: string,
    readonly region: string
}

export const MetropolitanAreaSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Departure/arrival flight area. Used to make a flight route",
    properties: {
        id: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Area ID"
        },
        name: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Area name"
        }
    },
    required: ["id", "name"]
};

interface SuggestMaRequest {
    readonly geo: {
        readonly lat: number
        readonly lon: number
    }
}

interface SuggestMetropolitanAreaData {
    metropolitan_area_id: number
    name: string,
    region: string
}

interface SuggestMaResponse extends BeResponse {
    readonly ma?: ReadonlyArray<SuggestMetropolitanAreaData>
}

const endpoint = "/www/suggestAirport";

export async function getMa(waypoint: Waypoint): Promise<MetropolitanArea> {
    logger.d("Getting MA for:", waypoint.value);
    const request: SuggestMaRequest = {
        geo: {
            lat: waypoint.location.latitude,
            lon: waypoint.location.longitude
        }
    };
    const result = await callBe<SuggestMaResponse>(
        endpoint,
        request
    );
    const ma = result.ma || [];
    if (0 === ma.length) {
        return Promise.reject(new Error(`Departure area was not found for ${waypoint.value}`));
    }
    logger.d("Taking first MA: ", JSON.stringify(ma[0]));
    return {
        id: ma[0].metropolitan_area_id,
        name: ma[0].name,
        region: ma[0].region
    };
}
