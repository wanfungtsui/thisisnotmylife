// 游戏相关类型定义

export interface AIResponse {
  message: string;
  choices?: AIChoice[];
  skillCommand?: SkillCommand;
  oceanChange?: Partial<OCEANScore>;
  timeProgression?: TimeProgression;
}

export interface AIChoice {
  id: 'A' | 'B';
  text: string;
  impact?: string;
}

export interface SkillCommand {
  command: string;
  description: string;
}

export interface OCEANScore {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface TimeProgression {
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  duration: number;
}

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

export interface DialogueEntry {
  id: string;
  timestamp: string;
  userInput: string;
  aiResponse: string;
  userChoice?: 'A' | 'B';
  skillCommand?: SkillCommand;
  oceanChange?: Partial<OCEANScore>;
  timeProgression?: TimeProgression;
}

export interface GameCommand {
  command: string;
  description: string;
  unlocked: boolean;
} 