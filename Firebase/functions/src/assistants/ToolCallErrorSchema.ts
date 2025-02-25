export const ToolCallErrorSchema = {
    type: "object",
    description: "Function call error",
    properties: {
        error: {
            type: "string",
            description: "Description of error occurred when calling the function tool"
        }
    }
};

