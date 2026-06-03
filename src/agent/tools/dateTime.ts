import { tool } from 'ai'; //用来定义一个可被大模型调用的“工具函数”
import { z } from 'zod';

export const dateTime = tool({
    description: 'get the current date and time',
    input: z.object({}), //这个工具函数不需要输入参数
    execute: async () => {
        return new Date().toString();
    }
});
