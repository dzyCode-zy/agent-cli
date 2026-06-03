import { tool } from 'ai'
import { z } from 'zod';
import shell from 'shelljs';

export const executeShellCommand = tool({
    description: 'Execute a shell command and return the output. Use this tool for system operations, running scripts, or interacting with the operating system.',
    inputSchema: z.object({
        command: z.string().describe('The shell command to execute.'),
    }),
    execute: async ({ command }) => {
        const result = shell.exec(command, { silent: true });
        let output = '';
        if (result.stdout) {
            output += result.stdout;
        }
        if (result.stderr) {
            output += result.stderr;
        }
        if (result.code !== 0) {
            return 'Command failed with exit code ' + result.code + '. Output: ' + output;
        }
        return output || 'Command executed successfully with no output.';
    },
}); 