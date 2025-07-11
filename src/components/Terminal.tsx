import React, { useEffect, useRef, useState } from 'react';
import { sendToAI } from '../api/ai';
import { saveGameState, loadGameState, clearGameState } from '../api/storage';
import { GameState, DialogueEntry, AIChoice, AIResponse, OCEANScore, SkillCommand } from '../types';
import { PersonalityPanel } from './PersonalityPanel';
import { ChoiceButtons } from './ChoiceButtons';
import { validateApiKey, getApiKeyHelp } from '../config';
import { ASCIIGenerator } from '../api/ascii';

const initialOCEAN: OCEANScore = {
  openness: 50,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
};

// 默认的/start技能
const defaultStartSkill: SkillCommand = {
  command: '/start',
  description: '重新开始人生'
};

const defaultGameState: GameState = {
  birthInfo: { date: '', time: '', location: '' },
  currentTime: { date: '', time: '', age: 0 },
  ocean: initialOCEAN,
  dialogueHistory: [],
  skillCommands: [defaultStartSkill], // 默认包含/start技能
};

export const Terminal: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => loadGameState() || defaultGameState);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<AIChoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState(true);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [asciiLoading, setAsciiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const asciiGenerator = useRef(new ASCIIGenerator());

  // 检查API密钥
  useEffect(() => {
    const isValid = validateApiKey();
    setApiKeyValid(isValid);
    if (!isValid) {
      setError(`API配置错误\n\n${getApiKeyHelp()}`);
    }
  }, []);

  // 滚动到底部
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [game.dialogueHistory]);

  // 启动/恢复游戏
  useEffect(() => {
    if (!game.dialogueHistory.length && apiKeyValid) {
      handleCommand('/start');
    }
  }, [apiKeyValid]);

  // 保存游戏
  useEffect(() => {
    saveGameState(game);
  }, [game]);

  // 处理命令或自然输入
  async function handleCommand(cmd: string) {
    // 处理重启命令
    if (cmd === '/start' && game.dialogueHistory.length > 0) {
      handleRestart();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const messages = buildMessages(game, cmd);
      const aiResp = await sendToAI(messages);
      updateGameWithAI(aiResp, cmd);
    } catch (e: any) {
      setError(e.message || 'AI服务异常');
    } finally {
      setLoading(false);
      setInput('');
    }
  }

  // 处理重启游戏
  function handleRestart() {
    // 清除所有数据
    clearGameState();
    
    // 重置所有状态
    setGame(defaultGameState);
    setChoices([]);
    setError(null);
    setInput('');
    
    // 显示重启消息
    console.log('游戏已重启，正在开始新的人生...');
    
    // 自动开始新游戏
    setTimeout(async () => {
      if (apiKeyValid) {
        setLoading(true);
        try {
          const messages = buildMessages(defaultGameState, '/start');
          const aiResp = await sendToAI(messages);
          updateGameWithAI(aiResp, '/start');
        } catch (e: any) {
          setError(e.message || 'AI服务异常');
        } finally {
          setLoading(false);
        }
      }
    }, 500);
  }

  // 处理A/B选择 - 直接发送
  async function handleChoice(choice: AIChoice) {
    setLoading(true);
    setError(null);
    setChoices([]); // 清空选择
    
    try {
      const choiceText = `选择${choice.id}: ${choice.text}`;
      
      // 构建消息并发送给AI
      const messages = buildMessages(game, choiceText, choice.id);
      const aiResp = await sendToAI(messages);
      
      // 更新游戏状态，传入选择信息
      updateGameWithAI(aiResp, choiceText, choice);
    } catch (e: any) {
      setError(e.message || 'AI服务异常');
    } finally {
      setLoading(false);
    }
  }

  // 构建AI上下文
  function buildMessages(game: GameState, userInput: string, choiceId?: 'A' | 'B') {
    // 构建当前游戏状态上下文
    const skillsInfo = game.skillCommands.length > 0 
      ? game.skillCommands.map(cmd => `${cmd.command} - ${cmd.description}`).join('\n  ')
      : '无';
    
    const gameContext = `
当前游戏状态：
- 出生信息：${game.birthInfo.date} ${game.birthInfo.time} 于 ${game.birthInfo.location}
- 当前时间：${game.currentTime.date} ${game.currentTime.time}，年龄：${game.currentTime.age}岁
- 当前人格特质(OCEAN)：
  开放性: ${game.ocean.openness}
  尽责性: ${game.ocean.conscientiousness}  
  外向性: ${game.ocean.extraversion}
  宜人性: ${game.ocean.agreeableness}
  情绪稳定性: ${game.ocean.neuroticism}
- 已获得技能命令：
  ${skillsInfo}

【技能解锁检查】：
在决定是否解锁新技能时，请严格按照以下流程：
1. 判断当前情况是否达到解锁技能的标准（极其特殊、戏剧性、能产生重大剧情转折）
2. 如果需要解锁，检查上述已获得技能列表，确保新技能不与现有技能重复或类似
3. 只有通过以上两个判断才在skillCommand字段中返回新技能

请基于以上状态信息，生成连贯的人生模拟对话。`;

    // 构建对话历史，只取最近8轮对话以控制token数量
    const history = game.dialogueHistory.slice(-8).map(d => [
      { role: 'user' as const, content: d.userInput },
      { role: 'assistant' as const, content: d.aiResponse },
    ]).flat();

    // 构建用户消息
    const userMsg = userInput;
    
    return [
      { role: 'system' as const, content: gameContext },
      ...history,
      { role: 'user' as const, content: userMsg },
    ];
  }

  // 更新游戏状态
  function updateGameWithAI(ai: AIResponse, userInput: string, selectedChoice?: AIChoice) {
    // 计算人格变化 - 优先使用传入的选择，否则从choices中查找
    let personalityChange: Partial<OCEANScore> = {};
    
    if (selectedChoice) {
      // 直接使用传入的选择
      personalityChange = selectedChoice.personalityChange;
    } else if (userInput.includes('选择A:') || userInput.includes('选择B:')) {
      // 从当前choices中查找
      const choiceId = userInput.includes('选择A:') ? 'A' : 'B';
      const foundChoice = choices.find(c => c.id === choiceId);
      if (foundChoice) {
        personalityChange = foundChoice.personalityChange;
      }
    }
    
    // 调试信息
    console.log('人格变化计算:');
    console.log('- selectedChoice:', selectedChoice);
    console.log('- personalityChange:', personalityChange);
    console.log('- 当前OCEAN:', game.ocean);
    
    // 应用人格变化到当前OCEAN分数
    const newOcean: OCEANScore = {
      openness: Math.max(0, Math.min(100, game.ocean.openness + (personalityChange.openness || 0))),
      conscientiousness: Math.max(0, Math.min(100, game.ocean.conscientiousness + (personalityChange.conscientiousness || 0))),
      extraversion: Math.max(0, Math.min(100, game.ocean.extraversion + (personalityChange.extraversion || 0))),
      agreeableness: Math.max(0, Math.min(100, game.ocean.agreeableness + (personalityChange.agreeableness || 0))),
      neuroticism: Math.max(0, Math.min(100, game.ocean.neuroticism + (personalityChange.neuroticism || 0)))
    };
    
    console.log('- 计算后的newOcean:', newOcean);

    // 决定使用哪个OCEAN分数
    const finalOcean = Object.keys(personalityChange).length > 0 ? newOcean : (ai.ocean || newOcean);
    console.log('- 最终使用的OCEAN:', finalOcean);
    console.log('- personalityChange有变化:', Object.keys(personalityChange).length > 0);

    // 检查是否为/start命令，如果是则重置技能列表
    let updatedSkillCommands = game.skillCommands;
    if (userInput.trim() === '/start') {
      // 重置技能列表，只保留默认的/start技能
      updatedSkillCommands = [defaultStartSkill];
      console.log('检测到/start命令，重置技能列表');
    }
    
    // 检查技能指令是否可以添加（避免重复）
    let actualSkillCommand: SkillCommand | undefined = undefined;
    
    if (ai.skillCommand) {
      console.log('AI尝试解锁技能:', ai.skillCommand);
      console.log('当前已有技能:', updatedSkillCommands);
      
      // 检查完全相同的技能命令
      const exactMatch = updatedSkillCommands.find(skill => skill.command === ai.skillCommand!.command);
      
      // 检查类似的技能命令（基于描述或功能相似性）
      const similarMatch = updatedSkillCommands.find(skill => {
        const newCmd = ai.skillCommand!.command.toLowerCase();
        const existingCmd = skill.command.toLowerCase();
        
        // 检查命令名称相似性
        if (newCmd.includes(existingCmd.replace('/', '')) || existingCmd.includes(newCmd.replace('/', ''))) {
          return true;
        }
        
        // 检查功能相似性（基于描述关键词）
        const newDesc = ai.skillCommand!.description?.toLowerCase() || '';
        const existingDesc = skill.description?.toLowerCase() || '';
        
        // 如果任一描述为空，跳过相似性检查
        if (!newDesc || !existingDesc) {
          return false;
        }
        
        const similarityKeywords = [
          ['哭', '哭泣', '流泪', '大哭'],
          ['撒谎', '欺骗', '说谎', '谎言'],
          ['魅力', '诱惑', '迷人', '吸引'],
          ['威胁', '恐吓', '威胁'],
          ['反抗', '叛逆', '违抗'],
          ['操控', '控制', '影响', '操纵'],
          ['背叛', '出卖', '背叛'],
          ['牺牲', '奉献', '献身']
        ];
        
        for (const keywords of similarityKeywords) {
          const newHasKeyword = keywords.some(keyword => newDesc.includes(keyword));
          const existingHasKeyword = keywords.some(keyword => existingDesc.includes(keyword));
          if (newHasKeyword && existingHasKeyword) {
            return true;
          }
        }
        
        return false;
      });
      
      if (exactMatch) {
        console.log('技能完全重复，跳过添加:', ai.skillCommand.command);
      } else if (similarMatch) {
        console.log('技能功能类似，跳过添加:', ai.skillCommand.command, '类似于:', similarMatch.command);
      } else {
        // 技能可以添加
        actualSkillCommand = ai.skillCommand;
        updatedSkillCommands = [...updatedSkillCommands, ai.skillCommand];
        console.log('解锁新技能:', ai.skillCommand.command, '-', ai.skillCommand.description);
      }
    } else {
      console.log('AI未返回新技能');
    }

    // 创建对话记录，只包含真正被添加的技能
    const newDialogue: DialogueEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userInput,
      aiResponse: ai.message,
      userChoice: userInput.includes('选择A:') ? 'A' : userInput.includes('选择B:') ? 'B' : undefined,
      skillCommand: actualSkillCommand, // 只保存真正被添加的技能
      oceanChange: personalityChange,
      timeProgression: ai.timeProgression,
    };
    
    setGame(prev => ({
      ...prev,
      birthInfo: ai.birthInfo || prev.birthInfo,
      currentTime: ai.currentTime || prev.currentTime,
      ocean: finalOcean, // 使用计算出的最终OCEAN分数
      dialogueHistory: [...prev.dialogueHistory, newDialogue],
      skillCommands: updatedSkillCommands,
    }));
    
    // 更新选择选项
    console.log('AI返回的choices:', ai.choices);
    console.log('当前choices状态:', choices);
    setChoices(ai.choices || []);
    console.log('设置choices后:', ai.choices || []);
    
    // 生成ASCII图像
    generateASCIIForScene(ai.message);
  }

  // 生成ASCII图像
  async function generateASCIIForScene(aiMessage: string) {
    setAsciiLoading(true);
    try {
      const ascii = await asciiGenerator.current.generateASCII(aiMessage);
      setAsciiArt(ascii);
    } catch (error) {
      console.error('ASCII生成失败:', error);
      // 使用默认图像
      setAsciiArt(`                    人生模拟器                    
                                                  
           ╭─────────────────────────╮              
           │                         │              
           │       ◕     ◕           │              
           │                         │              
           │           ◡             │              
           │                         │              
           ╰─────────────────────────╯              
                                                  
              你的人生正在继续...                    
                                                  
                                                  
                                                  
                                                  
                                                  
                                                  `);
    } finally {
      setAsciiLoading(false);
    }
  }

  // 格式化对话内容为React组件
  function formatDialogue(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      // 场景描述
      if (line.includes('【场景】')) {
        const content = line.replace('【场景】', '').trim();
        elements.push(
          <div key={index} style={{ 
            color: '#ffd700', 
            fontStyle: 'italic', 
            marginBottom: 8,
            padding: '8px 12px',
            background: '#2d1b0e',
            borderRadius: 4,
            borderLeft: '3px solid #ffd700'
          }}>
            🎬 {content}
          </div>
        );
      }
      // 角色对话
      else if (line.match(/【([^】]+)】："([^"]+)"/)) {
        const match = line.match(/【([^】]+)】："([^"]+)"/);
        if (match) {
          const [, speaker, dialogue] = match;
          const speakerColors: { [key: string]: string } = {
            '妈妈': '#ff69b4',
            '爸爸': '#4169e1', 
            '护士': '#32cd32',
            '医生': '#32cd32',
            '老师': '#ffa500',
            '同学': '#87ceeb',
            '朋友': '#dda0dd',
            '陌生人': '#d3d3d3'
          };
          const color = speakerColors[speaker] || '#58a6ff';
          elements.push(
            <div key={index} style={{ marginBottom: 6 }}>
              <span style={{ color, fontWeight: '600' }}>💬 {speaker}：</span>
              <span style={{ color: '#e6edf3', marginLeft: 8 }}>"{dialogue}"</span>
            </div>
          );
        }
      }
      // 旁白
      else if (line.includes('【旁白】')) {
        const content = line.replace('【旁白】', '').trim();
        elements.push(
          <div key={index} style={{ 
            color: '#a5a5a5', 
            fontStyle: 'italic', 
            marginBottom: 6,
            fontSize: 13
          }}>
            💭 {content}
          </div>
        );
      }
      // 其他内容
      else if (line.trim()) {
        elements.push(
          <div key={index} style={{ color: '#e6edf3', marginBottom: 6 }}>
            {line}
          </div>
        );
      }
    });
    
    return <div>{elements}</div>;
  }

  // 提交输入
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    handleCommand(input.trim());
  }

  // 渲染对话历史
  function renderHistory() {
    return game.dialogueHistory.map((d, i) => (
      <div key={d.id} style={{ marginBottom: 24, padding: '16px 20px', background: '#161b22', borderRadius: 8, border: '1px solid #21262d' }}>
        <div style={{ color: '#58a6ff', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>你：</div>
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          marginBottom: 12, 
          color: '#e6edf3',
          lineHeight: 1.6,
          background: d.userInput.startsWith('/') ? '#0969da20' : 'transparent',
          padding: d.userInput.startsWith('/') ? '8px 12px' : '0',
          borderRadius: d.userInput.startsWith('/') ? 4 : 0,
          fontFamily: d.userInput.startsWith('/') ? 'inherit' : 'inherit'
        }}>
          {d.userInput.startsWith('/') ? (
            <span style={{ color: '#7c3aed' }}>{d.userInput}</span>
          ) : d.userInput}
        </div>
        
        <div style={{ color: '#f85149', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>游戏世界：</div>
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          marginBottom: 12, 
          color: '#e6edf3',
          lineHeight: 1.8,
          padding: '12px 16px',
          background: '#0d1117',
          borderRadius: 6,
          border: '1px solid #30363d'
        }}>
          {formatDialogue(d.aiResponse)}
        </div>
        
        {d.skillCommand && (
          <div style={{ 
            color: '#ffd700', 
            fontWeight: '700', 
            fontSize: 14,
            background: 'linear-gradient(45deg, #8b4513, #daa520)',
            padding: '10px 16px',
            borderRadius: 8,
            display: 'inline-block',
            marginBottom: 10,
            border: '2px solid #ffd700',
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
          }}>
            ⚡ 解锁新技能：<span style={{ color: '#fff', marginLeft: 8 }}>{d.skillCommand.command}</span>
            <div style={{ 
              fontSize: 11, 
              color: '#fff8dc', 
              marginTop: 4,
              fontWeight: '400'
            }}>
              {d.skillCommand.description}
            </div>
          </div>
        )}
        
        {d.oceanChange && Object.keys(d.oceanChange).length > 0 && (
          <div style={{ 
            fontSize: 12, 
            color: '#7d8590',
            background: '#21262d',
            padding: '8px 12px',
            borderRadius: 4,
            marginTop: 8,
            fontFamily: 'SF Mono, Monaco, monospace'
          }}>
            OCEAN变化：{Object.entries(d.oceanChange)
              .filter(([key, value]) => value !== 0)
              .map(([key, value]) => `${key}: ${value > 0 ? '+' : ''}${value}`)
              .join(', ') || '无变化'}
          </div>
        )}
        
        {d.timeProgression && (
          <div style={{ 
            fontSize: 12, 
            color: '#7d8590',
            background: '#21262d',
            padding: '8px 12px',
            borderRadius: 4,
            marginTop: 4,
            fontFamily: 'SF Mono, Monaco, monospace'
          }}>
            时间推进：{d.timeProgression.fromTime} → {d.timeProgression.toTime} ({d.timeProgression.duration}分钟)
          </div>
        )}
      </div>
    ));
  }

  // 渲染时间与日期
  function renderTime() {
    const { date, time } = game.currentTime;
    return (
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        background: '#161b22', 
        borderRadius: 8, 
        border: '1px solid #21262d' 
      }}>
        <div style={{ color: '#f0883e', fontWeight: '600', marginBottom: 8, fontSize: 13 }}>当前时间</div>
        <div style={{ color: '#e6edf3', fontSize: 14, fontFamily: 'SF Mono, Monaco, monospace' }}>
          日期：{date || '----年--月--日'}
        </div>
        <div style={{ color: '#e6edf3', fontSize: 14, fontFamily: 'SF Mono, Monaco, monospace' }}>
          时间：{time || '--:--'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      fontFamily: 'inherit', 
      background: '#0d1117',
      minWidth: '1200px', // 设置最小宽度
      width: '100%'
    }}>
      {/* 左侧信息区 */}
      <div style={{ 
        width: '300px', // 稍微减少左侧宽度
        minWidth: '280px', // 设置最小宽度
        maxWidth: '320px', // 设置最大宽度
        padding: 20, 
        borderRight: '1px solid #21262d', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#010409'
      }}>
        {renderTime()}
        
        {/* ASCII图像区 */}
        <div style={{ 
          height: 240, 
          border: '1px solid #30363d', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#7d8590',
          background: '#0d1117',
          borderRadius: 8,
          fontSize: 13,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {asciiLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ 
                width: 20, 
                height: 20, 
                border: '2px solid #58a6ff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <div style={{ color: '#58a6ff', fontSize: 12 }}>生成场景图像中...</div>
            </div>
          ) : asciiArt ? (
            <pre style={{
              color: '#e6edf3',
              fontSize: 10,
              lineHeight: 1.2,
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              margin: 0,
              padding: 8,
              whiteSpace: 'pre',
              overflow: 'hidden',
              textAlign: 'left',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {asciiArt}
            </pre>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              color: '#7d8590'
            }}>
              <div style={{ fontSize: 24 }}>🎨</div>
              <div style={{ fontSize: 12 }}>等待场景图像...</div>
            </div>
          )}
        </div>
        
        <PersonalityPanel ocean={game.ocean} />
      </div>
      
      {/* 中间主对话区 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        minWidth: '600px', // 确保中间区域有足够宽度
        maxWidth: 'calc(100% - 600px)' // 限制最大宽度，为左右两栏留空间
      }}>
        <div ref={chatRef} style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 32px', // 增加左右内边距
          background: '#0d1117'
        }}>
          {renderHistory()}
          
          {loading && (
            <div style={{ 
              color: '#58a6ff', 
              padding: '16px 20px',
              background: '#161b22',
              borderRadius: 8,
              border: '1px solid #21262d',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                border: '2px solid #58a6ff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              AI思考中...
            </div>
          )}
          
          {error && (
            <div style={{ 
              color: '#f85149',
              background: '#da363340',
              padding: '16px 20px',
              borderRadius: 8,
              border: '1px solid #f85149',
              whiteSpace: 'pre-wrap',
              fontFamily: 'SF Mono, Monaco, monospace',
              fontSize: 13,
              lineHeight: 1.6
            }}>
              {error}
            </div>
          )}
        </div>
        
        <div style={{ 
          borderTop: '1px solid #21262d', 
          padding: 20, 
          background: '#161b22'
        }}>
          {/* AI建议选项 */}
          {choices.length > 0 && !loading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                color: '#7d8590', 
                fontSize: 13, 
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>💡</span>
                <span>AI建议选项（点击直接发送）：</span>
              </div>
              <ChoiceButtons choices={choices} onSelect={handleChoice} />
            </div>
          )}
          
          {/* 用户输入框 - 始终显示 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder={choices.length > 0 ? "选择建议选项，或输入自定义内容..." : "输入命令或对话..."}
              style={{ 
                flex: 1, 
                fontSize: 14, 
                padding: '12px 16px', 
                border: '1px solid #30363d', 
                borderRadius: 6,
                background: '#0d1117',
                color: '#e6edf3',
                fontFamily: 'inherit'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              style={{ 
                fontSize: 14, 
                padding: '12px 24px', 
                background: loading || !input.trim() ? '#21262d' : '#238636', 
                color: loading || !input.trim() ? '#7d8590' : '#fff', 
                border: 'none', 
                borderRadius: 6,
                fontWeight: '600',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              发送
            </button>
          </form>
        </div>
      </div>

      {/* 右侧技能栏 */}
      <div style={{ 
        width: '300px', // 增加右侧宽度
        minWidth: '280px', // 设置最小宽度
        maxWidth: '320px', // 设置最大宽度
        padding: 20, 
        borderLeft: '1px solid #21262d', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#010409'
      }}>
        <div style={{ 
          border: '1px solid #30363d', 
          background: '#0d1117',
          borderRadius: 8,
          padding: 16,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            color: '#ffd700', 
            fontWeight: '600', 
            marginBottom: 12, 
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid #30363d',
            paddingBottom: 10
          }}>
            <span>⚡</span>
            <span>已解锁技能</span>
            <span style={{ 
              background: '#ffd70020', 
              color: '#ffd700', 
              fontSize: 11, 
              padding: '2px 6px', 
              borderRadius: 10,
              fontWeight: '500'
            }}>
              {game.skillCommands.length}
            </span>
          </div>
          
          {game.skillCommands.length > 0 ? (
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {game.skillCommands.map((skill, index) => (
                <div 
                  key={index} 
                  onClick={() => !loading && handleCommand(skill.command)}
                  className={`skill-card ${loading ? 'disabled' : ''}`}
                  style={{ 
                    padding: '14px 16px',
                    background: '#161b22',
                    borderRadius: 8,
                    border: '1px solid #30363d',
                    borderLeft: '3px solid #ffd700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ 
                    color: '#ffd700', 
                    fontWeight: '700',
                    fontSize: 12,
                    marginBottom: 4,
                    fontFamily: 'SF Mono, Monaco, monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{skill.command}</span>
                    {!loading && (
                      <span 
                        className="skill-arrow"
                        style={{ 
                          fontSize: 10, 
                          opacity: 0.7,
                          transition: 'all 0.2s ease',
                          transform: 'translateX(0)'
                        }}
                      >
                        ▶
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: '#e6edf3', 
                    fontSize: 10,
                    lineHeight: 1.3,
                    opacity: 0.8,
                    flex: 1
                  }}>
                    {skill.description}
                  </div>
                  
                  {!loading && (
                    <div 
                      className="skill-hint"
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 10,
                        fontSize: 9,
                        color: '#7d8590',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none'
                      }}
                    >
                      点击使用
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7d8590',
              fontSize: 14,
              textAlign: 'center',
              gap: 12
            }}>
              <div style={{ fontSize: 32, opacity: 0.5 }}>⚡</div>
              <div>
                <div style={{ fontWeight: '500' }}>暂无技能</div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                  在特殊情况下解锁技能
                </div>
              </div>
            </div>
          )}
          
          {/* 技能使用提示 */}
          {game.skillCommands.length > 0 && (
            <div 
              className="skill-tip"
              style={{
                marginTop: 12,
                padding: 10,
                background: '#0969da20',
                borderRadius: 6,
                border: '1px solid #0969da40',
                fontSize: 11,
                color: '#58a6ff',
                textAlign: 'center',
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 12 }}>💡</span>
              <span>点击技能卡片即可使用技能</span>
            </div>
          )}
        </div>
      </div>
      
      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* 技能卡片样式 */
        .skill-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .skill-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
          background: #21262d !important;
          border-color: #ffd700 !important;
        }
        
        .skill-card:hover .skill-hint {
          opacity: 1;
        }
        
        .skill-card:hover .skill-arrow {
          opacity: 1;
          transform: translateX(2px);
        }
        
        .skill-card:active {
          transform: translateY(0px) scale(0.98);
          transition: all 0.1s ease;
        }
        
        .skill-card.disabled {
          opacity: 0.6;
          cursor: not-allowed !important;
        }
        
        .skill-card.disabled:hover {
          transform: none !important;
          box-shadow: none !important;
          background: #161b22 !important;
          border-color: #30363d !important;
        }
        
        /* 技能使用提示动画 */
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        .skill-tip {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Terminal; 