import { generateText, type ModelMessage } from 'ai';
import { deepseek, createDeepSeek } from '@ai-sdk/deepseek';
import { SYSTEM_PROMPT } from './system/prompt';
import type { AgentCallbacks } from '../types';
import { tools, fileTools, dateTimeTools } from './tools/index.ts';
import { executeTool } from './executeTool';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
dotenv.config();
const MODEL_NAME = 'deepseek-chat';
export async function runAgent(
    userMessage: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
): Promise<any> {
    const { text, toolCalls } = await generateText({
        model: deepseek(MODEL_NAME),
        system: SYSTEM_PROMPT,
        prompt: userMessage,
        tools,
    })
    if (toolCalls) {
        for (const toolCall of toolCalls) {
            const { toolName, input } = toolCall;
            const result = await executeTool(toolName as any, input);
            console.log(result);
        }
    }
}
runAgent('hello,what time is now?') 