import React from 'react';
import { OCEANScore } from '../types';

interface Props {
  ocean: OCEANScore;
}

const traitLabels: Record<keyof OCEANScore, string> = {
  openness: '开放性',
  conscientiousness: '尽责性',
  extraversion: '外向性',
  agreeableness: '亲和性',
  neuroticism: '神经质',
};

const traitColors: Record<keyof OCEANScore, string> = {
  openness: '#7c3aed',
  conscientiousness: '#0969da', 
  extraversion: '#f85149',
  agreeableness: '#3fb950',
  neuroticism: '#f0883e',
};

export const PersonalityPanel: React.FC<Props> = ({ ocean }) => (
  <div style={{ 
    padding: '16px 20px', 
    background: '#161b22', 
    borderRadius: 8, 
    border: '1px solid #21262d',
    marginBottom: 16
  }}>
    <div style={{ 
      fontWeight: '600', 
      marginBottom: 16, 
      color: '#e6edf3', 
      fontSize: 14,
      letterSpacing: '0.5px'
    }}>
      我的人格特质
    </div>
    {Object.entries(ocean).map(([key, value]) => (
      <div key={key} style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 6
        }}>
          <span style={{ 
            fontSize: 13, 
            color: '#e6edf3',
            fontWeight: '500'
          }}>
            {traitLabels[key as keyof OCEANScore]}
          </span>
          <span style={{ 
            fontFamily: 'SF Mono, Monaco, monospace', 
            color: traitColors[key as keyof OCEANScore],
            fontSize: 13,
            fontWeight: '600'
          }}>
            {value}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: 6,
          background: '#21262d',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${value}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${traitColors[key as keyof OCEANScore]}80, ${traitColors[key as keyof OCEANScore]})`,
            borderRadius: 3,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    ))}
  </div>
); 