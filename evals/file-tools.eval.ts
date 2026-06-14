import { singleTurnWithMocks} from './executors.ts';
import { evaluate } from '@lmnr-ai/lmnr';
import { toolSelectionScore } from './evaluators.ts';
import type { EvalData, EvalTarget } from './types.ts';
import dataset from './data/file-tools.json' with { type: 'json' };

/**
 * File Tools Selection Evaluation
 *
 * Tests whether the LLM correctly selects file-related tools
 * (readFile, writeFile, listFiles, deleteFile) based on user prompts.
 *
 * Categories:
 * - golden: Must select specific expected tools
 * - secondary: Likely selects certain tools, scored on precision/recall
 * - negative: Must NOT select any file tools
 */

const executor = async (data: EvalData) => {
  return await singleTurnWithMocks(data);
};

// 开始评估
evaluate({
  data: dataset as Array<{ data: EvalData; target: EvalTarget }>,
  executor: executor,
  evaluators: { 
    toolsSelected: (output, target, data) => {
        if (!target || target.category !== 'golden') {
            return 1;
        }
        return toolSelectionScore(output, target);
    }
   },
  groupName: 'file-tools-evaluation',
});

