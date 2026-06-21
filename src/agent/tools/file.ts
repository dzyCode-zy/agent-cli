import { tool } from 'ai'; // 用来定义一个可被大模型调用的“工具函数”
import { z } from 'zod';
import fs from 'node:fs/promises';
import nodePath from 'node:path';

export const readFile = tool({
    description: 'Read the contents of a file at the specified path, always use this tool to read files.',
    inputSchema: z.object({
        path: z.string().describe('The path to the file to read.'),
    }),
    execute: async ({ path: filePath }) => {
        try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
        } catch (error) {
            return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

export const writeFile = tool({
    description: 'Write content to a file at the specified path, create the file if it does not exist, always use this tool to write files.',
    inputSchema: z.object({
        path: z.string().describe('The path to the file to write.'),
        content: z.string().describe('The content to write to the file.'),
    }),
    execute: async ({ path: filePath, content }) => {
        try {
            const dir = nodePath.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
            return `successfully wrote  ${content.length} characters to ${filePath}`;
        } catch (error) {
            return `Error writing file: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

export const listFiles = tool({
    description: 'List all files in the specified directory, always use this tool to list files.',
    inputSchema: z.object({
        directory: z.string().describe('The path to the directory to list files from.'),
    }),
    execute: async ({ directory }) => {
        try {
            const files = await fs.readdir(directory, { withFileTypes: true });
            const fileList = files.map(flie => {
                const type = flie.isDirectory() ? '[directory]' : '[file]';
                return `${type} ${flie.name}`;
            });
            return fileList.length > 0 ? fileList.join('\n') : `Directory ${directory} is empty.`;
        } catch (error) {
            return `Error listing files: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

export const deleteFile = tool({
    description: 'Delete the file at the specified path, use with caution as this action is irreversible.',
    inputSchema: z.object({
        path: z.string().describe('The path to the file you want to delete.'),

    }),
    execute: async ({ path: filePath }) => {
        try {
            await fs.unlink(filePath);
            return `Successfully deleted file at ${filePath}`;
        } catch (error) {
            return `Error deleting file: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

