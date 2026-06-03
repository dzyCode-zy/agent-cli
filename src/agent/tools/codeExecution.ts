import { tool } from 'ai'
import { z } from 'zod';
import shell from 'shelljs';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

// 组合式tool，如果模型执行一个任务时总是固定的几个原子步骤，那就可以写一个更高级的tool来进行整合

// 生成临时文件，写入代码，执行代码，返回结果，最后删除临时文件
export const executeCode = tool({
    description: 'execute code for anything you need computed for, Supports JavaScript (Node.js), Python, and TypeScript. Returns the output of the execution.',
    inputSchema: z.object({
        code: z.string().describe('The code to execute.'),
        language: z.enum(['javascript', 'python', 'typescript']).describe('The programming language of the code.').default('javascript'),
    }),
    execute: async ({ code, language }:{
        code: string;
        language: 'javascript' | 'python' | 'typescript';
    }) => {
        
        let extensions = {
                javascript: ".js",
                python: ".py",
                typescript: ".ts",
            };

        const commands: Record<string, (file: string) => string> = {
            javascript: (file) => `node ${file}`,
            python: (file) => `python3 ${file}`,
            typescript: (file) => `npx tsx ${file}`,
        };
        const ext = extensions[language];
        const getCommand = commands[language];
       const tmpFile = path.join(os.tmpdir(), `code-exec-${Date.now()}${ext}`);
 try {
      // Write code to temp file
      await fs.writeFile(tmpFile, code, "utf-8");

      // Execute the code
      const command = getCommand(tmpFile);
      const result = shell.exec(command, { silent: true });

      let output = "";
      if (result.stdout) {
        output += result.stdout;
      }
      if (result.stderr) {
        output += result.stderr;
      }

      if (result.code !== 0) {
        return `Execution failed (exit code ${result.code}):\n${output}`;
      }

      return output || "Code executed successfully (no output)";
    } catch (error) {
      const err = error as Error;
      return `Error executing code: ${err.message}`;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
    }
    }
})