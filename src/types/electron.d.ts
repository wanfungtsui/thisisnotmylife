import { AIResponse, GameState, GameCommand } from '../../electron/types/game'

export interface ElectronAPI {
  aiChat: (message: string, context?: any) => Promise<{
    success: boolean
    data?: AIResponse
    error?: string
  }>
  gameCommand: (command: string, args?: any) => Promise<{
    success: boolean
    data?: any
    error?: string
  }>
  getGameState: () => Promise<{
    success: boolean
    data?: GameState
    error?: string
  }>
  getUnlockedCommands: () => Promise<{
    success: boolean
    data?: GameCommand[]
    error?: string
  }>
  resetGame: () => Promise<{
    success: boolean
    data?: null
    error?: string
  }>
  startNewLife: () => Promise<{
    success: boolean
    data?: AIResponse
    error?: string
  }>
  handleChoice: (choiceId: 'A' | 'B', choiceData: any, situation: string) => Promise<{
    success: boolean
    data?: AIResponse
    error?: string
  }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {} 