import * as admin from "firebase-admin/app";
import * as fs from "fs";
import {parse, stringify} from "envfile";
import OpenAI from "openai";
import {FunctionDefinition} from "openai/resources";
import {AssistantCreateParams, AssistantUpdateParams, FunctionTool} from "openai/resources/beta";
import {Meta, VertexAiSystemInstructions} from "@motorro/firebase-ai-chat-vertexai";
import {printAiExample} from "@motorro/firebase-ai-chat-core";
import {FunctionDeclarationSchema, FunctionDeclarationsTool} from "@google-cloud/vertexai";
import {FunctionParameters} from "openai/src/resources/shared";
import {OrderChatData} from "./data/OrderChatData";
import {OrderChatMeta} from "./data/OrderChatMeta";

if (0 === admin.getApps().length) {
    admin.initializeApp();
}

if (0 === admin.getApps().length) {
    admin.initializeApp();
}

export async function createAssistant(
    openAi: OpenAI,
    envPath: string,
    envName: string,
    params: AssistantCreateParams
): Promise<string> {
    let env: Record<string, string> = {};
    try {
        env = parse(await fs.promises.readFile(envPath, "utf8"));
    } catch (e) {
        console.warn("Error getting env file: ", e);
    }
    let assistantId = env[envName];
    if (assistantId) {
        assistantId = await doUpdateAssistant(openAi, assistantId, {
            name: params.name,
            description: params.description,
            instructions: params.instructions,
            tools: params.tools,
            model: params.model
        });
    } else {
        assistantId = await doCreateAssistant(openAi, params);
    }
    await fs.promises.writeFile(envPath, stringify({
        ...env,
        [envName]: assistantId
    }));
    return assistantId;
}

async function doCreateAssistant(openAi: OpenAI, params: AssistantCreateParams): Promise<string> {
    console.log("Creating assistant...");
    const assistant = await openAi.beta.assistants.create(params);
    console.log("Created assistant: ", assistant.id);
    return assistant.id;
}

export async function doUpdateAssistant(openAi: OpenAI, id: string, params: AssistantUpdateParams): Promise<string> {
    console.log("Updating assistant", id);
    const assistant = await openAi.beta.assistants.update(id, params);
    console.log("Updated assistant: ", assistant.id);
    return assistant.id;
}

export function getOpenAiConfig(name: string, model: string, instructions: VertexAiSystemInstructions<OrderChatData, Meta, OrderChatMeta>): AssistantCreateParams {
    let openAiInstructions = instructions.instructions;
    if (instructions.examples && instructions.examples.length > 0) {
        instructions.examples.forEach((it, index) => {
            openAiInstructions += `\n${printAiExample(it, index + 1)}}`;
        });
    }
    const tools: Array<FunctionTool> = [];
    instructions.tools?.definition?.forEach((tool) => {
        const functionDeclarations = (<FunctionDeclarationsTool>tool).functionDeclarations;
        if (functionDeclarations) {
            functionDeclarations.forEach((func) => {
                const definition: FunctionDefinition = {
                    name: func.name,
                    description: func.description,
                    parameters: vertexParamsToOpenAi(func.parameters)
                };
                tools.push({type: "function", function: definition});
            });
        }
    });

    function vertexParamsToOpenAi(vertex?: FunctionDeclarationSchema): FunctionParameters | undefined {
        if (!vertex) {
            return undefined;
        }
        return {
            type: vertex.type.toLowerCase(),
            properties: typeToLower(vertex.properties),
            required: vertex.required
        };

        function typeToLower(record: Record<string, unknown>): Record<string, unknown> {
            const result = record;
            const keys = Object.keys(record);
            for (const key of keys) {
                if ("object" === typeof record[key] && null !== record[key]) {
                    result[key] = typeToLower(<Record<string, unknown>>record[key]);
                }
                if ("type" === key && "string" === typeof record[key]) {
                    result[key] = (<string>record[key]).toLowerCase();
                }
            }
            return result;
        }
    }

    return {
        name: name,
        instructions: openAiInstructions,
        model: model,
        tools: tools
    };
}

export const openAiModel = "gpt-4o";
