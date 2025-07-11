import React from 'react'
import Terminal from './components/Terminal'

function App() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0d1117', // GitHub深色主题背景
      color: '#e6edf3',
      fontFamily: 'JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #21262d',
        background: 'linear-gradient(90deg, #161b22 0%, #0d1117 100%)',
        fontSize: '14px',
        textAlign: 'center',
        color: '#7c3aed',
        fontWeight: '600',
        letterSpacing: '0.5px'
      }}>
        这不是我想要的人生
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <Terminal />
      </div>
    </div>
  )
}

export default App 