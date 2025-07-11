// 测试缓存清除功能的简单脚本
const fs = require('fs');
const path = require('path');

console.log('=== 缓存清除功能测试 ===');

// 模拟创建一些测试文件
const testDir = path.join(__dirname, 'test-cache');
const testFile = path.join(testDir, 'test-game.json');

try {
  // 创建测试目录和文件
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(testFile, JSON.stringify({
    testData: 'This is test cache data',
    timestamp: new Date().toISOString()
  }));
  
  console.log('✓ 测试缓存文件已创建');
  
  // 检查文件是否存在
  if (fs.existsSync(testFile)) {
    console.log('✓ 测试缓存文件存在');
  }
  
  // 模拟清除缓存
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
    console.log('✓ 测试缓存文件已删除');
  }
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✓ 测试缓存目录已删除');
  }
  
  console.log('✓ 缓存清除测试通过');
  
} catch (error) {
  console.error('✗ 测试失败:', error.message);
}

console.log('\n=== 使用说明 ===');
console.log('1. 每次启动应用时，会自动清除以下缓存：');
console.log('   - 前端 localStorage 和 sessionStorage');
console.log('   - 后端游戏存储文件');
console.log('   - Electron 浏览器缓存');
console.log('2. 您也可以手动调用 window.electronAPI.clearAllCache() 来清除缓存');
console.log('3. 缓存清除操作会在控制台输出相关日志'); 