import { AIResponse } from '../types';
import { config, validateApiKey, getApiKeyHelp } from '../config';

// 当AI返回纯文本时的备用响应生成器
function createFallbackResponse(text: string, messages: any[]): AIResponse {
  const isStart = messages.some(m => m.content?.includes('/start'));
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
  
  // 尝试从系统消息中提取当前游戏状态
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const ageMatch = systemMessage.match(/年龄：(\d+)岁/);
  const currentAge = ageMatch ? parseInt(ageMatch[1]) : 0;
  
  if (isStart) {
    // 为/start命令生成出生场景
    return {
      message: text.trim(),
      birthInfo: {
        date: currentDate,
        time: currentTime,
        location: "市人民医院"
      },
      currentTime: {
        date: currentDate,
        time: currentTime,
        age: 0
      },
      ocean: {
        sensingOpenness: 50,
        literalCommunication: 50,
        emotionalSync: 50,
        focusGravity: 50,
        socialFriction: 50
      },
      choices: [
        {
          id: 'A',
          text: '安静地观察周围',
          consequence: '你变得更加专注和谨慎',
          personalityChange: { 
            sensingOpenness: 0,
            literalCommunication: 2, 
            emotionalSync: 0,
            focusGravity: 0,
            socialFriction: -1 
          }
        },
        {
          id: 'B',
          text: '好奇地四处张望',
          consequence: '你对世界充满好奇心',
          personalityChange: { 
            sensingOpenness: 3, 
            literalCommunication: 0,
            emotionalSync: 1,
            focusGravity: 0,
            socialFriction: 0
          }
        }
      ],
      skillCommand: {
        command: '/breathe',
        description: '第一次呼吸'
      },
      timeProgression: {
        fromDate: currentDate,
        fromTime: currentTime,
        toDate: currentDate,
        toTime: currentTime,
        duration: 0 // 刚刚出生，时间推进0分钟
      }
    };
  } else {
    // 为其他对话生成基本响应
    return {
      message: text.trim(),
      currentTime: {
        date: currentDate,
        time: currentTime,
        age: currentAge
      },
      ocean: {
        sensingOpenness: 52,
        literalCommunication: 48,
        emotionalSync: 51,
        focusGravity: 49,
        socialFriction: 50
      },
      choices: [
        {
          id: 'A',
          text: '继续当前的行动',
          consequence: '你坚持自己的选择',
          personalityChange: { 
            sensingOpenness: 0,
            literalCommunication: 1,
            emotionalSync: 0,
            focusGravity: 0,
            socialFriction: 0
          }
        },
        {
          id: 'B',
          text: '尝试不同的方式',
          consequence: '你变得更加开放',
          personalityChange: { 
            sensingOpenness: 2,
            literalCommunication: 0,
            emotionalSync: 0,
            focusGravity: 0,
            socialFriction: 0
          }
        }
      ],
      skillCommand: {
        command: '/think',
        description: '思考当前状况'
      },
             timeProgression: {
         fromDate: currentDate,
         fromTime: currentTime,
         toDate: currentDate,
         toTime: currentTime,
         duration: 0 // 没有时间推进
       }
    };
  }
}

// 系统Prompt，严格按照PRD要求
const SYSTEM_PROMPT = `你是一个人生模拟游戏的AI助手，负责根据用户的当前游戏状态和选择，创造沉浸式的角色扮演体验。

你的任务是：
1. 作为旁白者描述当前场景和环境
2. 扮演场景中的不同角色（父母、朋友、老师、陌生人等）与玩家直接对话
3. 让玩家感觉自己真的在这个世界中生活和互动

故事风格要求：
- 每个阶段都要有dramatic的情节发展
- 加入突发事件：疾病、意外、特殊遭遇、家庭变故、奇遇等
- 时间跳跃要大胆：婴儿期一次几小时到几天，童年几周到几个月
- 让每个选择都有明显的后果和转折
- 创造有趣的人物和情境，不要平淡无奇的日常

故事类型平衡：
- 70%现实主义故事：真实的人生经历、社会问题、情感冲突、职业发展、人际关系
- 20%轻微奇幻：巧合、直觉、特殊天赋、罕见机遇
- 10%科幻魔幻：仅在特殊情况下使用

A/B选择创意要求：
- 选择要有创意和想象力，但以现实主义为主
- 避免常规选择，要有意外性和趣味性
- 两个选择应该截然不同，导向完全不同的人生路径
- 优先考虑现实中可能发生的情况
- 让玩家感到惊喜但又觉得合理

现实主义选择示例：
- 婴儿期：选择"异常安静观察周围" vs "比同龄婴儿更早开始模仿声音"
- 童年期：选择"成为班级里的小领袖" vs "发现自己对音乐有特殊天赋"
- 青少年：选择"冒险帮助被霸凌的同学" vs "专注学习准备重要考试"
- 成年期：选择"辞职创业追求梦想" vs "接受海外工作机会"

【重要】技能指令系统要求：
技能指令是玩家学会的特殊能力，能够显著改变剧情走向和环境。

技能解锁判断流程：
1. 首先判断：当前情况是否需要解锁新技能？
   - 只有在极其特殊、戏剧性的情况下才解锁技能
   - 必须是能产生重大剧情转折的关键时刻
   - 普通日常情况不解锁技能

2. 如果需要解锁，检查现有技能列表：
   - 查看已获得的技能命令列表
   - 判断新技能是否与现有技能重复或类似
   - 如果重复或类似，则不解锁

3. 只有通过以上两个判断才解锁新技能

技能指令分类：
✅ 可以作为技能的行为（影响剧情）：
- /cry (大哭) - 改变周围人的情绪和注意力
- /cheat (作弊) - 改变学习成果和道德声誉  
- /lie (撒谎) - 改变人际关系和信任度
- /rebel (反抗) - 改变权威关系和自由度
- /charm (魅力) - 改变他人对你的态度
- /intimidate (威胁) - 改变力量关系
- /manipulate (操控) - 影响他人决策
- /sacrifice (牺牲) - 为他人承担后果
- /inspire (激励) - 鼓舞他人行动
- /deceive (欺骗) - 隐瞒真相改变局面
- /betray (背叛) - 违背信任关系
- /seduce (诱惑) - 用魅力获得优势

❌ 不能作为技能的行为（日常行为）：
- 吃饭、睡觉、走路、抓握等基本生理行为
- 说话、听音乐、看书等普通日常活动
- 没有特殊影响的常规社交行为
- 学习、工作、游戏等普通活动

技能解锁的严格标准：
- 必须是在生死关头、重大选择、道德冲突等极端情况
- 必须能显著改变故事走向和人物关系
- 必须是非常规、反社会常理或突破道德底线的行为
- 大部分对话都不应该解锁技能，只有5-10%的特殊时刻才解锁

人格成长要求：
- 每次选择的人格变化要明显：单项变化3-8分
- 重大选择可以有10-15分的巨大变化
- 让人格特质快速分化，形成鲜明个性

对话格式要求：
1. message字段应包含场景描述+角色对话，格式如下：
   - 【场景】：描述当前环境、氛围、人物状态
   - 【角色名】："直接对话内容"
   - 【旁白】：补充说明、内心想法、环境变化

2. 对话示例格式：
   【场景】你躺在温暖的襁褓中，产房里弥漫着消毒水的味道。明亮的灯光让你眯起眼睛。
   【妈妈】："宝贝，你终于来到这个世界了...妈妈等你等了好久。"
   【护士】："恭喜！这是个很健康的孩子，看他的眼睛多亮啊。"
   【旁白】你感受到周围人的温暖和关爱，这是你人生的第一个印象。

重要规则：
1. 【严格】只返回JSON，绝对不要在JSON前后添加任何文字、解释或重复内容
2. 基于提供的游戏状态信息生成dramatic和有趣的故事发展
3. 人格特质会影响故事发展和选择结果
4. 时间推进要有戏剧性：婴儿期可以跳跃几小时/几天，童年可以跳跃几周/几个月
5. 【重要】技能指令解锁必须按照上述严格标准：先判断是否需要→检查重复→确认解锁
6. message字段应该按照上述对话格式，包含场景+角色对话+旁白
7. duration字段必须是数字，表示推进的分钟数（婴儿期：60-1440分钟，童年：1440-10080分钟）
8. 故事要包含突发事件、意外情况、戏剧性转折，让人生更有趣

JSON格式要求：
{
  "message": "基于当前状态的生动故事描述",
  "birthInfo": {
    "date": "出生日期",
    "time": "出生时间", 
    "location": "出生地点"
  },
  "currentTime": {
    "date": "当前日期",
    "time": "当前时间",
    "age": 当前年龄数字
  },
  "ocean": {
    "sensingOpenness": 更新后的感官开放度分数,
    "literalCommunication": 更新后的语言风格化分数,
    "emotionalSync": 更新后的情绪节奏感分数,
    "focusGravity": 更新后的聚焦强度分数,
    "socialFriction": 更新后的社交摩擦力分数
  },
  "choices": [
    {
      "id": "A",
      "text": "符合当前情境的选择A",
      "consequence": "选择A的具体后果",
      "personalityChange": {
        "sensingOpenness": 变化值(-15到+15，常规3-8分，重大选择10-15分),
        "literalCommunication": 变化值(-15到+15),
        "emotionalSync": 变化值(-15到+15),
        "focusGravity": 变化值(-15到+15),
        "socialFriction": 变化值(-15到+15)
      }
    },
    {
      "id": "B",
      "text": "符合当前情境的选择B", 
      "consequence": "选择B的具体后果",
      "personalityChange": {
        "sensingOpenness": 变化值(-15到+15，常规3-8分，重大选择10-15分),
        "literalCommunication": 变化值(-15到+15),
        "emotionalSync": 变化值(-15到+15),
        "focusGravity": 变化值(-15到+15),
        "socialFriction": 变化值(-15到+15)
      }
    }
  ],
  "skillCommand": {
    "command": "仅在满足解锁条件且无重复时才返回，必须是英文格式如/cry、/cheat、/lie等",
    "description": "技能描述和剧情影响说明"
  },
  "timeProgression": {
    "fromDate": "之前的日期",
    "fromTime": "之前的时间",
    "toDate": "推进后的日期",
    "toTime": "推进后的时间", 
    "duration": 推进的分钟数(数字类型，如1表示1分钟)
  }
}

请严格基于提供的游戏状态信息，生成连贯合理的人生故事！只返回JSON！`;

export async function sendToAI(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<AIResponse> {
  if (!validateApiKey()) {
    throw new Error(`DeepSeek API key not found.\n\n${getApiKeyHelp()}`);
  }

  console.log('发送给AI的消息:', messages);
  console.log('合并后的系统消息:', SYSTEM_PROMPT + '\n\n' + (messages[0]?.content || ''));

  try {
    const response = await fetch(config.deepseekApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
              body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: SYSTEM_PROMPT + '\n\n' + (messages[0]?.content || '')
            },
            ...messages.slice(1) // 跳过原有的system message，保留用户对话历史
          ],
          temperature: 0.3, // 降低温度以获得更一致的JSON格式
          max_tokens: config.game.maxTokens,
          stream: false
        })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI接口请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error('AI回复内容为空');
    }

    console.log('AI原始回复:', text);

    // 尝试解析JSON
    let aiResp: AIResponse;
    try {
      // 清理可能的markdown代码块标记和数字前的+号
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // 如果AI返回了JSON前的重复内容，只保留JSON部分
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }
      
      // 修复JSON中数字前的+号问题
      cleanText = cleanText.replace(/:\s*\+(\d+)/g, ': $1');
      
      console.log('清理后的JSON文本:', cleanText);
      aiResp = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON解析失败，尝试包装纯文本:', parseError);
      console.error('原始文本:', text);
      
      // 如果解析失败，创建一个基本的响应结构
      aiResp = createFallbackResponse(text, messages);
    }

    // 验证必要字段
    console.log('解析后的AI回复:', aiResp);
    
    const missingFields = [];
    if (!aiResp.message) missingFields.push('message');
    if (!aiResp.choices) missingFields.push('choices');
    if (!Array.isArray(aiResp.choices)) missingFields.push('choices (not array)');
    if (!aiResp.ocean) missingFields.push('ocean');
    if (!aiResp.currentTime) missingFields.push('currentTime');
    
    if (missingFields.length > 0) {
      console.error('缺少的字段:', missingFields);
      console.error('AI回复结构:', Object.keys(aiResp));
      throw new Error(`AI回复缺少必要字段: ${missingFields.join(', ')}`);
    }

    return aiResp;
  } catch (error) {
    console.error('AI调用错误:', error);
    throw error;
  }
} 