import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { DeepSeekService } from './services/deepseek'
import { GameStorageService } from './services/storage'

// 加载环境变量
dotenv.config()

class App {
  private mainWindow: BrowserWindow | null = null
  private deepSeekService: DeepSeekService
  private storageService: GameStorageService

  constructor() {
    this.storageService = new GameStorageService()
    this.deepSeekService = new DeepSeekService(this.storageService)
    
    app.whenReady().then(() => {
      this.createWindow()
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow()
        }
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    this.setupIpcHandlers()
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hidden',
      backgroundColor: '#000000',
      show: false,
    })

    // 开发环境加载Vite服务器，生产环境加载构建后的文件
    if (process.env.NODE_ENV === 'development') {
      // 尝试不同的端口，因为 Vite 可能使用 3000, 3001, 3002 等
      const vitePort = process.env.VITE_PORT || '3002'
      const viteUrl = `http://localhost:${vitePort}`
      console.log(`Loading Vite URL: ${viteUrl}`)
      console.log(`Preload script path: ${path.join(__dirname, 'preload.js')}`)
      
      this.mainWindow.loadURL(viteUrl)
      this.mainWindow.webContents.openDevTools()
      
      // 添加错误处理
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load URL: ${validatedURL}`)
        console.error(`Error: ${errorCode} - ${errorDescription}`)
      })
      
      // 检查 preload 脚本是否正确加载
      this.mainWindow.webContents.once('dom-ready', () => {
        console.log('DOM ready, checking electronAPI...')
        this.mainWindow?.webContents.executeJavaScript(`
          console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
          console.log('electronAPI methods:', window.electronAPI ? Object.keys(window.electronAPI) : 'undefined');
        `)
      })
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'))
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })
  }

  private setupIpcHandlers(): void {
    // 处理AI对话请求
    ipcMain.handle('ai-chat', async (event, message: string, context?: any) => {
      try {
        const response = await this.deepSeekService.chat(message, context)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('AI chat error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 处理游戏命令
    ipcMain.handle('game-command', async (event, command: string, args?: any) => {
      try {
        const response = await this.handleGameCommand(command, args)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Game command error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 获取游戏状态
    ipcMain.handle('get-game-state', async () => {
      try {
        const gameState = this.storageService.getGameState()
        return { success: true, data: gameState }
      } catch (error: any) {
        console.error('Get game state error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 获取解锁的命令
    ipcMain.handle('get-unlocked-commands', async () => {
      try {
        const commands = this.storageService.getUnlockedCommands()
        return { success: true, data: commands }
      } catch (error: any) {
        console.error('Get unlocked commands error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 重置游戏
    ipcMain.handle('reset-game', async () => {
      try {
        this.storageService.resetGame()
        return { success: true, data: null }
      } catch (error: any) {
        console.error('Reset game error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 开始新的人生
    ipcMain.handle('start-new-life', async () => {
      try {
        const response = await this.deepSeekService.startNewLife()
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Start new life error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })

    // 处理用户选择
    ipcMain.handle('handle-choice', async (event, choiceId: 'A' | 'B', choiceData: any, situation: string) => {
      try {
        const response = await this.deepSeekService.handleChoice(choiceId, choiceData, situation)
        return { success: true, data: response }
      } catch (error: any) {
        console.error('Handle choice error:', error)
        return { success: false, error: error.message || String(error) }
      }
    })
  }

  private async handleGameCommand(command: string, args?: any): Promise<any> {
    switch (command) {
      case 'start':
        return await this.deepSeekService.handleStartCommand()
      case 'traversing':
        return await this.deepSeekService.handleTraversingCommand(args.year)
      case 'me':
        return await this.deepSeekService.handleMeCommand()
      case 'help':
        return await this.deepSeekService.handleHelpCommand()
      case 'status':
        return await this.deepSeekService.handleStatusCommand()
      default:
        return { message: 'Unknown command. Type /help for available commands.' }
    }
  }
}

new App() 