// All tools combined for the agent
import {writeFile,listFiles, deleteFile,readFile} from "./file.ts";
import { executeShellCommand } from "./shell.ts";
import { executeCode } from "./codeExecution.ts";
import {dateTime} from "./dateTime.ts";
export const tools = {
    writeFile,
    listFiles,
    deleteFile,
    readFile,
    executeShellCommand,
    executeCode,
    dateTime
};

export const dateTimeTools = {
    dateTime
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