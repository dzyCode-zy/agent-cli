import { generateText, type ModelMessage } from 'ai';
import { deepseek, createDeepSeek } from '@ai-sdk/deepseek';
import { SYSTEM_PROMPT } from './system/prompt.ts';
import type { AgentCallbacks } from '../types.ts';
import { tools, fileTools, dateTimeTools } from './tools/index.ts';
import { executeTool } from './executeTool.ts';
import { Laminar, getTracer } from '@lmnr-ai/lmnr'; //evals 工具
import 'dotenv/config';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
dotenv.config();
Laminar.initialize({
    projectApiKey: process.env.LMNR_PROJECT_API_KEY || '',
}
);
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
        experimental_telemetry: {
            isEnabled: true,
            tracer: getTracer(),
        },
    })
    if (toolCalls) {
        for (const toolCall of toolCalls) {
            const { toolName, input } = toolCall;
            const result = await executeTool(toolName as any, input);
            console.log(result);
        }
    }
    await Laminar.flush(); //确保所有的 telemetry 数据都被发送出去
}
runAgent('hello,what time is now?') 