import {MetropolitanArea} from "./getMa";
import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";
import {BeResponse} from "../../data/BeResponse";
import {callBe} from "../../callBe";
import {tagLogger} from "@motorro/firebase-ai-chat-vertexai";

const logger = tagLogger("BaseFlightOptions");

export interface Plane extends Record<string, unknown>{
    readonly id: number,
    readonly name: string,
    readonly maximumPassengersOnBoard: number
    readonly default?: boolean,
}

export const PlaneSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Airplane description",
    properties: {
        id: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Airplane ID"
        },
        name: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Airplane name"
        },
        maximumPassengersOnBoard: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.NUMBER,
            description: "Maximum passengers allowed on board"
        },
        default: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.BOOLEAN,
            description: "True if this airplane is selected by default"
        }
    },
    required: ["id", "name", "maximumPassengersOnBoard", "default"]
};

export interface BaseFlightOptions extends Record<string, unknown>{
    readonly availablePlanes: ReadonlyArray<Plane>
}

export const BaseFlightOptionsSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Base flight options",
    properties: {
        availablePlanes: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.ARRAY,
            description: "Airplanes available for selection",
            item: PlaneSchema
        }
    },
    required: ["availablePlanes"]
};

interface PlanesRequest {
    readonly areas: [
        {
            from: number,
            to: number
        }
    ]
}

const planesDictionary: {[key: number]: string} = {
    36: "CITATION XLS",
    10: "CHALLENGER 350",
    5: "CHALLENGER 605",
    6: "CHALLENGER_850",
    16: "GLOBAL_5000_6000",
    7: "GLOBAL_6000",
    1718: "GLOBAL_7500"
} as const;

interface PlanePojo {
    readonly id: number,
    readonly blocked: boolean,
    readonly pax: number
}

interface PlanesResponse extends BeResponse{
    readonly planes?: ReadonlyArray<PlanePojo>
    readonly selectedId?: number
}

const endpoint = "/getAvailablePlanes";

export async function getBaseFlightOptions(from: MetropolitanArea, to: MetropolitanArea): Promise<BaseFlightOptions> {
    logger.d("Getting base flight options:", JSON.stringify(from), JSON.stringify(to));
    const request: PlanesRequest = {
        areas: [{
            from: from.id,
            to: to.id
        }]
    };
    const response = await callBe<PlanesResponse>(
        endpoint,
        request
    );
    const availablePlanes = (response.planes || []).filter((it) => !it.blocked);
    if (0 === availablePlanes.length) {
        return Promise.reject(new Error("No planes available for this route. Please try to adjust from, to, or departure date"));
    }
    return {
        availablePlanes: availablePlanes.map((it) => ({
            id: it.id,
            name: planesDictionary[it.id] || "Unknown plane",
            maximumPassengersOnBoard: it.pax,
            default: response.selectedId === it.id
        }))
    };
}
