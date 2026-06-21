import { multiTurnWithMocks} from './executors.ts';
import { evaluate} from '@lmnr-ai/lmnr';
import { llmJudge } from './evaluators.ts';
import type { MultiTurnEvalData, MultiTurnTarget, MultiTurnResult } from './types.ts';
import dataset from './data/agent-multiturn.json' with { type: 'json' };
import 'dotenv/config';
import dotenv from 'dotenv'; //把项目根目录里的 .env 文件加载进 process.env 里
dotenv.config();

/**
 * Multi-Turn Agent Evaluation
 *
 * Tests full agent behavior with mocked tools:
 * 1. Fresh task: User's first message, check tools + order + LLM judge
 * 2. Mid-conversation: Pre-filled messages, check continuation behavior
 * 3. Negative: Ensure wrong tool category not used (file vs shell)
 *
 * All tools are mocked to return fixed values for deterministic testing.
 *
 * Evaluators:
 * - toolOrderCorrect: Did tools get called in expected sequence?
 * - toolsAvoided: Were forbidden tools not called?
 * - llmJudge: Does the final response make sense given the task and results?
 */

// Executor that runs multi-turn agent with mocked tools
const executor = async (data: MultiTurnEvalData) => {
    return await multiTurnWithMocks(data);
};

evaluate({
    data: dataset as any,
    executor,
    evaluators: {
        outputQuality: (output, target) => {
            if (!target) { 
                return 1;
            };
            return llmJudge(output, target)
        },
    },
    config: {
        projectApiKey: process.env.LMNR_PROJECT_API_KEY,
    },
  groupName: 'multi-turn-evaluation',
})