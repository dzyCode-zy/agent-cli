import { generateText, streamText, type ModelMessage } from 'ai';
import { deepseek, createDeepSeek } from '@ai-sdk/deepseek';
import { SYSTEM_PROMPT } from './system/prompt.ts';
import type { AgentCallbacks } from '../types.ts';
import { tools, fileTools, dateTimeTools } from './tools/index.ts';
import { executeTool } from './executeTool.ts';
import { Laminar, getTracer } from '@lmnr-ai/lmnr'; //evals 工具
import { filterCompatibleMessages } from './system/filterMessages.ts';
import 'dotenv/config';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
import {
    estimateMessagesTokens,
    getModelLimits,
    isOverThreshold,
    calculateUsagePercentage,
    compactConversation,
    DEFAULT_THRESHOLD,
} from "./context/index.ts";
import { is } from 'zod/locales';

dotenv.config();
Laminar.initialize({
    projectApiKey: process.env.LMNR_PROJECT_API_KEY || '',
}
);

const MODEL_NAME = 'deepseek-chat';
const modelLimits = getModelLimits(MODEL_NAME);
/**
 * single-tune-agent 
 */
// export async function runAgent(
//     userMessage: string,
//     conversationHistory?: ModelMessage[],
//     callbacks?: AgentCallbacks
// ): Promise<any> {
//     const { text, toolCalls } = await generateText({
//         model: deepseek(MODEL_NAME),
//         system: SYSTEM_PROMPT,
//         prompt: userMessage,
//         tools,
//         experimental_telemetry: {
//             isEnabled: true,
//             tracer: getTracer(),
//         },
//     })
//     if (toolCalls) {
//         for (const toolCall of toolCalls) {
//             const { toolName, input } = toolCall;
//             const result = await executeTool(toolName as any, input);
//             console.log(result);
//         }
//     }
//     await Laminar.flush(); //确保所有的 telemetry 数据都被发送出去
// }

/**
 * agent loop
 */
export async function runAgent(
    userMessage: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks): Promise<any> {
    const historyMessages = conversationHistory ? filterCompatibleMessages(conversationHistory) : [];
    let messages: ModelMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: 'user', content: userMessage },
    ];
    const preCheckToken = estimateMessagesTokens(messages); // 计算 token 消耗量
    if (isOverThreshold(preCheckToken.total, modelLimits.contextWindow)) {
        messages = await compactConversation(historyMessages, MODEL_NAME);
    }
    let fullResponse = '';
    while (true) {
        const result = streamText({
            model: deepseek(MODEL_NAME),
            messages,
            tools,
            experimental_telemetry: {
                isEnabled: true,
                tracer: getTracer(),
            },
        });
        const reportTokenmessage = () => {
            if (callbacks?.onTokenUsage) {
                const usage = estimateMessagesTokens(messages);
                callbacks.onTokenUsage({
                    inputTokens: usage.input,
                    outputTokens: usage.output,
                    totalTokens: usage.total,
                    contextWindow: modelLimits.contextWindow,
                    threshold: DEFAULT_THRESHOLD,
                    percentage: calculateUsagePercentage(
                        usage.total,
                        modelLimits.contextWindow,
                    ),
                })
            }
        }
        const toolCalls = [];
        let currentResponse = '';
        let streamError: Error | null = null;
        try {
            for await (const part of result.fullStream) {
                if (part.type === 'text-delta') {
                    currentResponse += part.text;
                    callbacks?.onToken(part.text);
                }
                if (part.type === 'tool-call') {
                    const input = 'input' in part ? part.input : {};
                    toolCalls.push({
                        toolName: part.toolName,
                        toolCallId: part.toolCallId,
                        args: input as Record<string, unknown>,
                    });
                    callbacks?.onToolCallStart(part.toolName, input);
                }
            }
        } catch (error) {
            streamError = error as Error;
            if (
                !currentResponse &&
                !streamError.message.includes("No output generated")
            ) {
                throw streamError;
            }
        };
        fullResponse += currentResponse;
        if (streamError && !currentResponse) {
            fullResponse = 'Sorry about that, I ran into an error: ' + streamError.message;
            callbacks?.onToken(fullResponse);
            break;
        };
        const finishReason = await result.finishReason;
        if (finishReason !== 'tool-calls' || toolCalls.length === 0) {
            const responseMessage = await result.response; // 一个包含本次对话完整响应元数据的对象。
            messages.push(...responseMessage.messages);
            reportTokenmessage();
            break;
        };
        // 处理工具调用
        const responseMessage = await result.response; // 一个包含本次对话完整响应元数据的对象。
        messages.push(...responseMessage.messages);
        for (const toolCall of toolCalls) {
            const result = await executeTool(toolCall.toolName as any, toolCall.args);
            callbacks?.onToolCallEnd(toolCall.toolName, result);
            // 将工具调用结果作为新的消息添加到对话中，供下一轮生成使用
            // 更改 message 的内容后自动进入下一轮生成，直到没有工具调用或者达到结束条件
            messages.push({
                role: 'tool',
                content: [{
                    type: 'tool-result',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    output: { type: 'text', value: result },
                }],
            });
            reportTokenmessage();
        };
    };
    callbacks?.onComplete(fullResponse);
    return messages;

}
runAgent('hi!'); 