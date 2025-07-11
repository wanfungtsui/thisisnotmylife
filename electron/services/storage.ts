import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface GameStorageData {
  gameState: any;
  unlockedCommands: string[];
  conversationHistory: any[];
  lastPlayTime: string;
}

export class GameStorageService {
  private readonly storageDir: string
  private readonly storageFile: string

  constructor() {
    // 获取应用数据目录
    this.storageDir = path.join(app.getPath('userData'), 'gameData')
    this.storageFile = path.join(this.storageDir, 'game.json')
    
    // 确保目录存在
    this.ensureStorageDir()
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
    }
  }

  /**
   * 清除所有缓存数据
   */
  public clearAllCache(): void {
    try {
      // 清除存储文件
      if (fs.existsSync(this.storageFile)) {
        fs.unlinkSync(this.storageFile)
        console.log('已清除游戏存储文件缓存')
      }

      // 清除整个存储目录
      if (fs.existsSync(this.storageDir)) {
        fs.rmSync(this.storageDir, { recursive: true, force: true })
        console.log('已清除游戏存储目录缓存')
      }

      // 重新创建目录
      this.ensureStorageDir()
      console.log('缓存清除完成，已重新创建存储目录')
    } catch (error) {
      console.error('清除缓存时发生错误:', error)
    }
  }

  /**
   * 获取游戏状态
   */
  public getGameState(): any {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8')
        const parsed = JSON.parse(data) as GameStorageData
        return parsed.gameState
      }
      return null
    } catch (error) {
      console.error('读取游戏状态时发生错误:', error)
      return null
    }
  }

  /**
   * 保存游戏状态
   */
  public saveGameState(gameState: any): void {
    try {
      const existingData = this.loadStorageData()
      const newData: GameStorageData = {
        ...existingData,
        gameState,
        lastPlayTime: new Date().toISOString()
      }
      
      fs.writeFileSync(this.storageFile, JSON.stringify(newData, null, 2))
      console.log('游戏状态已保存')
    } catch (error) {
      console.error('保存游戏状态时发生错误:', error)
    }
  }

  /**
   * 获取解锁的命令
   */
  public getUnlockedCommands(): string[] {
    try {
      const data = this.loadStorageData()
      return data.unlockedCommands || []
    } catch (error) {
      console.error('获取解锁命令时发生错误:', error)
      return []
    }
  }

  /**
   * 重置游戏
   */
  public resetGame(): void {
    try {
      const emptyData: GameStorageData = {
        gameState: null,
        unlockedCommands: [],
        conversationHistory: [],
        lastPlayTime: new Date().toISOString()
      }
      
      fs.writeFileSync(this.storageFile, JSON.stringify(emptyData, null, 2))
      console.log('游戏已重置')
    } catch (error) {
      console.error('重置游戏时发生错误:', error)
    }
  }

  /**
   * 加载存储数据
   */
  private loadStorageData(): GameStorageData {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8')
        return JSON.parse(data) as GameStorageData
      }
    } catch (error) {
      console.error('加载存储数据时发生错误:', error)
    }
    
    // 返回默认数据
    return {
      gameState: null,
      unlockedCommands: [],
      conversationHistory: [],
      lastPlayTime: new Date().toISOString()
    }
  }
} 