import { GameState } from '../types';

const STORAGE_KEY = 'self_game_state_v1';

export function saveGameState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGameState(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearAllCache() {
  try {
    // 清除所有 localStorage 项
    localStorage.clear();
    
    // 清除所有 sessionStorage 项
    sessionStorage.clear();
    
    console.log('前端所有缓存已清除');
  } catch (error) {
    console.error('清除前端缓存时发生错误:', error);
  }
} 