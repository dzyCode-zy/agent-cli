import { tools } from "./tools";
export type ToolName = keyof typeof tools;

export async function executeTool(toolName: ToolName, input: any) {
    const tool = tools[toolName];
    if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
    };
    const execute = tool.execute;
    if (!execute) {
        // Provider tools (like webSearch) are executed by OpenAI, not us
    return `Provider tool ${toolName} - executed by model provider`;
    }
    const result = await execute(input as any, {
        toolCallId:'',
        messages:[]
    });
    return result.toString();
}