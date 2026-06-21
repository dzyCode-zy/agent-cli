// 执行器，输入数据，结合输入的各种参数tools，模型，prompt等，执行agent的逻辑，输出结果
import { generateText, stepCountIs, type ModelMessage, type ToolSet } from 'ai';
import { deepseek, createDeepSeek } from '@ai-sdk/deepseek';
import { buildMessages, buildMockedTools } from './utils.ts';
import z from 'zod';
import 'dotenv/config';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
dotenv.config();
import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";

import { SYSTEM_PROMPT } from '../src/agent/system/prompt.ts';


// 定义tools类型，但是不需要定义具体执行方法，仅用于测评时所选工具是否正确

const TOOL_DEFINITIONS: Record<
  string,
  { description: string; parameters: z.ZodObject<z.ZodRawShape> }
> = {
  readFile: {
    description: "Read the contents of a file in a specified path.",
    parameters: z.object({
      filePath: z.string().describe("The path to the file to read, relative to the project root."),
    }),
  },
  writeFile: {
    description: "Write content to a file at a specified path.",
    parameters: z.object({
      filePath: z.string().describe("The path to the file to write, relative to the project root."),
      content: z.string().describe("The content to write to the file."),
    }),
  },
  deleteFile: {
    description: "Delete a file ",
    parameters: z.object({
      filePath: z.string().describe("The path to the file to delete, relative to the project root."),
    }),
  },
  listFiles: {
    description: "List files in a specified directory.",
    parameters: z.object({
      directoryPath: z.string().describe("The path to the directory to list files in, relative to the project root."),
    }),
  },
  runCommand: {
    description: "Run a shell command and return its output.",
    parameters: z.object({
      command: z.string().describe("The shell command to execute."),
    }),
  },
}

export async function singleTurnWithMocks(data: EvalData): Promise<SingleTurnResult> {
  // 单轮对话的数据
  const messages = buildMessages(data); // 构建消息数组，包含系统提示和用户问题
  const tools: ToolSet = {}; // 构建工具集，根据输入数据中指定的工具名称，从预定义的工具中提取描述和参数信息
  data.tools.forEach(toolName => {
    const toolDef = TOOL_DEFINITIONS[toolName];
    if (toolDef) {
      tools[toolName] = {
        description: toolDef.description,
        inputSchema: toolDef.parameters,
      }
    }
  });
  // 调用生成文本的函数，传入消息和工具集，获取模型生成的文本和工具调用信息
  const { text, toolCalls } = await generateText({
    model: deepseek(data.config?.model ?? 'deepseek-chat'),
    tools,
    messages,
    stopWhen: stepCountIs(1), // 只执行一步，确保是单轮对话
    temperature: data.config?.temperature ?? 0, // 使用输入数据中的温度配置，默认值取决于模型
    providerOptions: {
      deepseek: {
        reasoningEffort: 'high', // 设置推理努力程度为中等，平衡速度和质量
      }
    }
  });

  // 从工具调用信息中提取工具名称列表，并构建结果对象
  const toolCallsInfo = toolCalls ? toolCalls.map(call => {
    return {
      toolName: call.toolName,
      args: 'args' in call ? call.args : undefined
    }
  }) : [];

  const toolNames = toolCallsInfo.map(call => call.toolName);
  return {
    toolCalls: toolCallsInfo || [],
    toolNames,
    selectedAny: toolNames.length > 0,
  }
}

// 多轮对话的执行器

export async function multiTurnWithMocks(data: MultiTurnEvalData): Promise<MultiTurnResult> {
  const messages: ModelMessage[] = data.messages ?? [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: data.prompt ?? '',
    }
  ];
  const tools = buildMockedTools(data.mockTools);

  const result = await generateText({
    model: deepseek(data.config?.model ?? 'deepseek-chat'),
    tools,
    messages,
    stopWhen: stepCountIs(data.config?.maxSteps ?? 5), // 最多执行5步，防止无限循环
  });
  const allToolCalls: string[] = [];
  const steps = result.steps.map((step) => {
    const stepTollCall =  (step.toolCalls ?? []).map(tc => {
      allToolCalls.push(tc.toolName);
      return {
        toolName : tc.toolName,
        args : 'args' in tc ? tc.args : {},
      };
    });
    const steptToolCallResult = (step.toolResults ?? []).map(tr => ({
      toolName: tr.toolName,
      result:  'result' in tr ? tr.result : {}
    }));
    return {
      ToolCalls: stepTollCall.length > 0 ? stepTollCall : undefined,
      toolResults: steptToolCallResult.length > 0 ? steptToolCallResult : undefined,
      text: step.text  || undefined,
    };
  });
  const toolsUsed = [...new Set(allToolCalls)];

  return {
    text: result.text,
    steps,
    toolsUsed,
    toolCallOrder: allToolCalls,
  };
};