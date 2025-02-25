export const THOMAS = "thomas";
export const FLIGHT = "flight";
export const FLIGHT_OPTIONS = "flightOptions";
export const CATERING = "catering";
export const TRANSFER = "transfer";
export const WAYPOINTS = "waypoints";

export type ASSISTANT = typeof THOMAS | typeof FLIGHT | typeof FLIGHT_OPTIONS | typeof CATERING | typeof TRANSFER | typeof WAYPOINTS;

export function openAiAssistantName(assistant: ASSISTANT): string {
    return "ThomasAndFriends_" + assistant;
}

export function getAssistantName(assistant: ASSISTANT): string {
    switch (assistant) {
        case THOMAS:
            return "Thomas The Engine";
        case FLIGHT:
            return "Emerson";
        case FLIGHT_OPTIONS:
            return "Harold";
        case CATERING:
            return "Topham Hatt";
        case TRANSFER:
            return "Ace";
        case WAYPOINTS:
            return "Lady Hatt";
    }
}
