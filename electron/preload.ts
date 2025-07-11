import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的API
const electronAPI = {
  // AI对话
  aiChat: (message: string, context?: any) => 
    ipcRenderer.invoke('ai-chat', message, context),
  
  // 游戏命令
  gameCommand: (command: string, args?: any) => 
    ipcRenderer.invoke('game-command', command, args),

  // 获取游戏状态
  getGameState: () => 
    ipcRenderer.invoke('get-game-state'),

  // 获取解锁的命令
  getUnlockedCommands: () => 
    ipcRenderer.invoke('get-unlocked-commands'),

  // 重置游戏
  resetGame: () => 
    ipcRenderer.invoke('reset-game'),

  // 开始新的人生
  startNewLife: () => 
    ipcRenderer.invoke('start-new-life'),

  // 处理用户选择
  handleChoice: (choiceId: 'A' | 'B', choiceData: any, situation: string) => 
    ipcRenderer.invoke('handle-choice', choiceId, choiceData, situation),
}

// 安全地暴露API到window对象
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明，供TypeScript使用
declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
} 