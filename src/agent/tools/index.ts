// All tools combined for the agent
import {writeFile,listFiles, deleteFile,readFile} from "./file.ts";
import { executeShellCommand } from "./shell.ts";
import { executeCode } from "./codeExecution.ts";
export const tools = {
    writeFile,
    listFiles,
    deleteFile,
    readFile,
    executeShellCommand,
    executeCode
};


export const fileTools = {
    writeFile,
    listFiles,
    deleteFile,
    readFile
};

export const shellTools = {
    executeShellCommand,
    executeCode
};