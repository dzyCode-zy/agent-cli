import { gateway } from "@ai-sdk/gateway";

/**
 * 跨模型的互联网万能网页搜索工具（由 Perplexity 提供技术支持）
 * 完美支持 DeepSeek、Anthropic、OpenAI 等任意大模型调用
 */
export const webSearch = gateway.tools.perplexitySearch() as any;
