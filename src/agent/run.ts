import {generateText, type ModelMessage} from 'ai';
import { deepseek , createDeepSeek} from '@ai-sdk/deepseek';
import { createOpenAI , openai} from '@ai-sdk/openai'; // 这是一个适配层，可以切换不同的模型
import { OpenAI } from 'openai';  
import { SYSTEM_PROMPT } from './system/prompt';    
import type { AgentCallbacks } from '../types';
import { tools, fileTools } from './tools';
import { executeTool } from './executeTool';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
dotenv.config();
const MODEL_NAME = 'deepseek-chat';
export async function runAgent(
    userMessage: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
): Promise<any> {
    const{ text ,toolCalls } = await generateText({
    model: deepseek('deepseek-reasoner'),
    system: "You are a helpful assistant.",
    prompt: userMessage,

    })
    console.log('Generated text:', text);
}
runAgent('hello,can you hear me?') 