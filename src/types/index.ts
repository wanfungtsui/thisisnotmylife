// 人格五维分数
export interface OCEANScore {
  sensingOpenness: number;      // 感官开放度
  literalCommunication: number; // 语言风格化
  emotionalSync: number;        // 情绪节奏感
  focusGravity: number;         // 聚焦强度
  socialFriction: number;       // 社交摩擦力
}

// 技能指令
export interface SkillCommand {
  command: string; // 例如 /cry
  description?: string;
}

// 单条对话历史
export interface DialogueEntry {
  id: string;
  timestamp: string;
  userInput: string;
  aiResponse: string;
  userChoice?: 'A' | 'B';
  skillCommand?: SkillCommand;
  oceanChange?: Partial<OCEANScore>;
  timeProgression?: {
    fromDate: string;
    fromTime: string;
    toDate: string;
    toTime: string;
    duration: number; // 改为数字，表示推进的分钟数
  };
}

// 游戏状态
export interface GameState {
  birthInfo: {
    date: string;
    time: string;
    location: string;
  };
  currentTime: {
    date: string;
    time: string;
    age: number;
  };
  ocean: OCEANScore;
  dialogueHistory: DialogueEntry[];
  skillCommands: SkillCommand[];
}

// AI响应格式
export interface AIChoice {
  id: 'A' | 'B';
  text: string;
  consequence: string;
  personalityChange: Partial<OCEANScore>;
}

export interface AIResponse {
  message: string;
  birthInfo?: {
    date: string;
    time: string;
    location: string;
  };
  currentTime?: {
    date: string;
    time: string;
    age: number;
  };
  ocean?: OCEANScore;
  choices: AIChoice[];
  skillCommand?: SkillCommand;
  asciiArt?: string;
  timeProgression?: {
    fromDate: string;
    fromTime: string;
    toDate: string;
    toTime: string;
    duration: number; // 改为数字，表示推进的分钟数
  };
} 