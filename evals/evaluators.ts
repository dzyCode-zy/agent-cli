import { generateText, Output } from "ai";
import { deepseek } from '@ai-sdk/deepseek';

import { z } from "zod";

import type {
  EvalTarget,
  SingleTurnResult,
  MultiTurnTarget,
  MultiTurnResult,
} from "./types.ts";
const judgmentSchema = z.object({
  score: z.number().min(1).max(10).describe("Score from 1 to 10, where 10 is best"),
  reason: z.string().describe('Brief explanation for the score.'),
});

// 需要使用 llm 辅助来评判多轮的结果
export const llmJudge = async(
  output:  MultiTurnResult,
  target: MultiTurnTarget,
) => {
  const judgment = await generateText({
    model: deepseek('deepseek-chat'),
    experimental_output: Output.object({
      schema: judgmentSchema,
      description: "Evaluation of an AI agent response",
    }),
    // output: Output.object({
    //   schema: judgmentSchema
    // }),
    messages: [{
      role: 'system',
      content: `
      You are an evaluation judge. Score the agent's response on a scale of 1-10.
        Scoring criteria:
        - 10: Response fully addresses the task using tool results correctly
        - 7-9: Response is mostly correct with minor issues
        - 4-6: Response partially addresses the task
        - 1-3: Response is mostly incorrect or irrelevant
      `,
    }, {
      role: 'user',
      content: `
      Task: ${target.originalTask}
      Tools called:${JSON.stringify(output?.toolCallOrder)}
      Tool results provided: ${JSON.stringify(target.mockToolResults)}
      Agent's final response: ${output?.text}

      Evaluate if this response correctly uses the tool results to answer the task.
      `
    }]
   });

  return judgment.output.score / 10; // Normalize to 0-1
}
/**
 * Evaluator: Precision/recall score for tool selection.
 * Returns a score between 0 and 1 based on correct selections.
 * For secondary prompts.
 */
export function toolSelectionScore(
  output: SingleTurnResult,
  target: EvalTarget,
): number {
  if (!target.expectedTools?.length) {
    return output.selectedAny ? 0.5 : 1;
  }

  const expected = new Set(target.expectedTools); // 标准答案中模型应该调用tools的次数
  const selected = new Set(output.toolNames); // 实际模型调用tools的次数

  const hits = output.toolNames.filter((t) => expected.has(t)).length;
  const precision = selected.size > 0 ? hits / selected.size : 0;
  const recall = expected.size > 0 ? hits / expected.size : 0; // 

  // Simple F1-ish score
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}
