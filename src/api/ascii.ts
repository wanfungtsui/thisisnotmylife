import { sendToAI } from './ai';

interface SceneInfo {
  location: string;
  characters: string[];
  mood: string;
  objects: string[];
  timeOfDay: string;
  weather?: string;
}

export class ASCIIGenerator {
  constructor() {
    // 使用导入的sendToAI函数
  }

  // 从AI消息中提取场景信息
  private extractSceneInfo(message: string): SceneInfo {
    // 简单的关键词提取，可以后续优化
    const location = this.extractKeyword(message, ['家', '学校', '公园', '医院', '办公室', '餐厅', '街道', '房间', '教室', '操场', '图书馆', '商店', '银行', '车站', '机场', '海边', '山上', '森林', '城市', '乡村']) || '房间';
    
    const characters = this.extractCharacters(message);
    
    const mood = this.extractKeyword(message, ['开心', '难过', '愤怒', '紧张', '兴奋', '害怕', '平静', '焦虑', '满足', '失望', '希望', '绝望', '爱', '恨', '困惑', '清醒']) || '平静';
    
    const objects = this.extractObjects(message);
    
    const timeOfDay = this.extractKeyword(message, ['早晨', '上午', '中午', '下午', '傍晚', '晚上', '深夜', '黎明', '黄昏']) || '白天';
    
    const weather = this.extractKeyword(message, ['晴天', '雨天', '雪天', '阴天', '多云', '刮风', '雷雨']) || undefined;

    return {
      location,
      characters,
      mood,
      objects,
      timeOfDay,
      weather
    };
  }

  private extractKeyword(text: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }
    return null;
  }

  private extractCharacters(text: string): string[] {
    const characters = [];
    const characterKeywords = ['妈妈', '爸爸', '老师', '同学', '朋友', '医生', '护士', '老板', '同事', '陌生人', '孩子', '老人', '年轻人', '男人', '女人'];
    
    for (const keyword of characterKeywords) {
      if (text.includes(keyword)) {
        characters.push(keyword);
      }
    }
    
    return characters;
  }

  private extractObjects(text: string): string[] {
    const objects = [];
    const objectKeywords = ['桌子', '椅子', '书', '电脑', '手机', '车', '树', '花', '门', '窗户', '灯', '床', '沙发', '电视', '镜子', '杯子', '食物', '钱', '钥匙', '包'];
    
    for (const keyword of objectKeywords) {
      if (text.includes(keyword)) {
        objects.push(keyword);
      }
    }
    
    return objects;
  }

  // 生成ASCII专用的提示词
  private generateASCIIPrompt(sceneInfo: SceneInfo): string {
    return `你是一个ASCII艺术大师，请根据以下场景信息生成一幅ASCII艺术图像：

场景信息：
- 地点：${sceneInfo.location}
- 人物：${sceneInfo.characters.join(', ') || '无'}
- 情绪氛围：${sceneInfo.mood}
- 物品：${sceneInfo.objects.join(', ') || '无'}
- 时间：${sceneInfo.timeOfDay}
${sceneInfo.weather ? `- 天气：${sceneInfo.weather}` : ''}

要求：
1. 使用标准ASCII字符（空格、点、线、斜杠、下划线、星号等）
2. 图像尺寸：宽度50字符，高度15行
3. 风格简洁明了，突出主要元素
4. 符合中文语境和文化背景
5. 只返回ASCII艺术，不要任何其他文字说明

请生成ASCII艺术：`;
  }

  // 生成ASCII图像
  async generateASCII(gameMessage: string): Promise<string> {
    try {
      // 提取场景信息
      const sceneInfo = this.extractSceneInfo(gameMessage);
      
      // 生成ASCII提示词
      const prompt = this.generateASCIIPrompt(sceneInfo);
      
      // 调用DeepSeek API
      const response = await sendToAI([
        { role: 'user', content: prompt }
      ]);

      // 处理返回的ASCII艺术，从AIResponse中提取message
      const asciiArt = this.processASCIIResponse(response.message);
      
      return asciiArt;
    } catch (error) {
      console.error('ASCII生成失败:', error);
      return this.getDefaultASCII();
    }
  }

  // 处理API返回的ASCII艺术
  private processASCIIResponse(response: string): string {
    // 移除多余的文字说明，只保留ASCII艺术
    const lines = response.split('\n');
    const asciiLines = [];
    
    for (const line of lines) {
      // 跳过明显的说明文字
      if (line.includes('ASCII') || line.includes('艺术') || line.includes('图像') || 
          line.includes('生成') || line.includes('以下') || line.includes('如下')) {
        continue;
      }
      
      // 保留包含ASCII字符的行
      if (line.trim().length > 0) {
        asciiLines.push(line);
      }
    }
    
    // 确保尺寸合适
    const result = asciiLines.slice(0, 15).map(line => {
      if (line.length > 50) {
        return line.substring(0, 50);
      }
      return line.padEnd(50, ' ');
    });
    
    // 填充到15行
    while (result.length < 15) {
      result.push(' '.repeat(50));
    }
    
    return result.join('\n');
  }

  // 默认ASCII图像（生成失败时使用）
  private getDefaultASCII(): string {
    return `                    人生模拟器                    
                                                  
           ╭─────────────────────────╮              
           │                         │              
           │       ◕     ◕           │              
           │                         │              
           │           ◡             │              
           │                         │              
           ╰─────────────────────────╯              
                                                  
              你的人生正在继续...                    
                                                  
                                                  
                                                  
                                                  
                                                  
                                                  `;
  }
} 