import * as admin from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

if (0 === admin.getApps().length) {
    admin.initializeApp();
    setGlobalOptions({maxInstances: 10});
}

import OpenAI from "openai";
import {
    CATERING,
    FLIGHT,
    FLIGHT_OPTIONS,
    openAiAssistantName,
    THOMAS,
    TRANSFER,
    WAYPOINTS
} from "./assistants/assistantName";
import {thomasInstructions} from "./assistants/thomas/Thomas";
import {waypointsInstructions} from "./assistants/waypoints/Waypoints";
import {baseFlightOptionsInstructions} from "./assistants/flight/Flight";
import {charterDetailsInstructions} from "./assistants/flight/FlightDetails";
import {cateringInstructions} from "./assistants/catering/Catering";
import {transferInstructions} from "./assistants/transfer/Transfer";
import {createAssistant, getOpenAiConfig, openAiModel} from "./OpenAi";

async function main() {
    const openAi = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    console.log("Exporting assistants...");

    console.log("Thomas");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_THOMAS",
        getOpenAiConfig(openAiAssistantName(THOMAS), openAiModel, thomasInstructions())
    );

    console.log("Waypoints");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_WAYPOINTS",
        getOpenAiConfig(openAiAssistantName(WAYPOINTS), openAiModel, waypointsInstructions())
    );

    console.log("Flight");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_FLIGHT",
        getOpenAiConfig(openAiAssistantName(FLIGHT), openAiModel, baseFlightOptionsInstructions())
    );

    console.log("Flight options");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_FLIGHT_OPTIONS",
        getOpenAiConfig(openAiAssistantName(FLIGHT_OPTIONS), openAiModel, charterDetailsInstructions())
    );

    console.log("Catering");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_CATERING",
        getOpenAiConfig(openAiAssistantName(CATERING), openAiModel, cateringInstructions())
    );

    console.log("Transfer");
    await createAssistant(
        openAi,
        ".env.vistathomasandfriends",
        "ASSISTANT_ID_TRANSFER",
        getOpenAiConfig(openAiAssistantName(TRANSFER), openAiModel, transferInstructions())
    );
}

main();
