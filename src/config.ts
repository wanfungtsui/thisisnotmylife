// 配置文件
export const config = {
  // DeepSeek API配置
  deepseekApiKey: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '',
  deepseekApiUrl: 'https://api.deepseek.com/v1/chat/completions',
  
  // 开发模式配置
  isDevelopment: (import.meta as any).env?.DEV || false,
  
  // 游戏配置
  game: {
    maxTokens: 1500,
    temperature: 0.7,
    personalityChangeRange: { min: -10, max: 10 },
    oceanRange: { min: 0, max: 100 }
  }
};

// API密钥检查函数
export function validateApiKey(): boolean {
  return Boolean(config.deepseekApiKey && config.deepseekApiKey.trim() !== '');
}

// 获取API密钥提示信息
export function getApiKeyHelp(): string {
  return `
请设置DeepSeek API密钥：
1. 访问 https://platform.deepseek.com/api_keys 获取API密钥
2. 在项目根目录创建 .env 文件
3. 添加以下内容：
   VITE_DEEPSEEK_API_KEY=你的API密钥

或者在终端中运行：
export VITE_DEEPSEEK_API_KEY=你的API密钥
  `.trim();
} 