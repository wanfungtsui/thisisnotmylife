import React from 'react';
import { AIChoice } from '../types';

interface Props {
  choices: AIChoice[];
  onSelect: (choice: AIChoice) => void;
  disabled?: boolean;
}

export const ChoiceButtons: React.FC<Props> = ({ choices, onSelect, disabled }) => (
  <div>
    <div style={{ display: 'flex', gap: 16, margin: '16px 0' }}>
      {choices.map(choice => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '16px 20px',
            fontSize: 14,
            border: '1px solid #30363d',
            background: disabled ? '#21262d' : '#238636',
            color: disabled ? '#7d8590' : '#fff',
            borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            lineHeight: 1.4,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#2ea043';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#238636';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <div style={{ 
            fontWeight: '700', 
            fontSize: 16, 
            marginBottom: 4,
            color: choice.id === 'A' ? '#58a6ff' : '#f85149'
          }}>
            {choice.id}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {choice.text}
          </div>
          {choice.consequence && (
            <div style={{ 
              fontSize: 11, 
              opacity: 0.7, 
              marginTop: 6,
              fontStyle: 'italic'
            }}>
              {choice.consequence}
            </div>
          )}
        </button>
      ))}
    </div>
    <div style={{ 
      fontSize: 12, 
      color: '#7d8590', 
      textAlign: 'center',
      marginTop: 8
    }}>
      💡 点击选项会直接发送选择，或者你可以在下方输入框中自由输入内容
    </div>
  </div>
); 