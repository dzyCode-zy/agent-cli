import {generateText, type ModelMessage} from 'ai';
import { openai } from '@ai-sdk/openai';
import { SYSTEM_PROMPT } from './system/prompt';    
import type { AgentCallbacks } from '../types';
import { tools, fileTools } from './tools';
import { executeTool } from './executeTool';
const MODEL_NAME = 'gpt-5-mini';

export async function runAgent(
    userNessage: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
): Promise<any> {
    const { text, toolCalls} = await generateText({
        model: openai(MODEL_NAME),
        system: SYSTEM_PROMPT,
        prompt: userNessage,
        tools,

    })
    toolCalls.forEach(async (toolCall) => {
        const { name, args } = toolCall;
        const result = await executeTool(name, args);
        console.log(result);
    });
    console.log('Generated text:', text);
}
runAgent('')