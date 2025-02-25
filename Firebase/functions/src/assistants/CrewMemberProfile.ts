import {
    FunctionDeclarationSchema,
    FunctionDeclarationSchemaProperty,
    FunctionDeclarationSchemaType
} from "@google-cloud/vertexai";

/**
 * Crew member profile
 */
export interface CrewMemberProfile extends Record<string, unknown>{
    readonly assistantId: string
    readonly name: string
    readonly helpsWith: string
    readonly preRequisites?: string
    readonly nextSteps?: string
}

export const CrewMemberProfileSchema: FunctionDeclarationSchemaProperty = {
    type: FunctionDeclarationSchemaType.OBJECT,
    description: "Crew member profile",
    properties: {
        assistantId: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Crew member id to use in a call to crew member"
        },
        name: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Crew member human-readable name"
        },
        helpsWith: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Things the crew member is in charge of or could help you with"
        },
        preRequisites: <FunctionDeclarationSchema><unknown>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Optional data or questions to get from the client before asking the crew member for help."
        },
        nextSteps: <FunctionDeclarationSchema>{
            type: FunctionDeclarationSchemaType.STRING,
            description: "Any next steps or actions to take when the crew member has returns a result."
        }
    },
    required: ["assistantId", "name", "helpsWith"]
};
