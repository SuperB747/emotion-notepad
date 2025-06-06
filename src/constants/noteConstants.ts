export const NOTE_COLORS = {
  yellow: {
    name: '형광 노랑',
    bg: '#ffff8d',
    hover: '#fff59d'
  },
  green: {
    name: '형광 초록',
    bg: '#b2ff59',
    hover: '#ccff90'
  },
  blue: {
    name: '형광 파랑',
    bg: '#81d4fa',
    hover: '#b3e5fc'
  },
  pink: {
    name: '형광 핑크',
    bg: '#ff80ab',
    hover: '#ff9ec7'
  },
  pastelPink: {
    name: '파스텔 핑크',
    bg: '#ffd1dc',
    hover: '#ffe4e9'
  },
  pastelBlue: {
    name: '파스텔 블루',
    bg: '#b5d8eb',
    hover: '#c9e3f0'
  },
  pastelGreen: {
    name: '파스텔 그린',
    bg: '#c1e1c1',
    hover: '#d4ebd4'
  },
  pastelPurple: {
    name: '파스텔 퍼플',
    bg: '#e0c1f0',
    hover: '#e8d3f3'
  },
  pastelOrange: {
    name: '파스텔 오렌지',
    bg: '#ffd4b8',
    hover: '#ffe2cf'
  },
  pastelYellow: {
    name: '파스텔 옐로우',
    bg: '#fff4bd',
    hover: '#fff7d1'
  }
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

// z-index 관련 상수
export const Z_INDEX = {
  MAIN: 95,              // 메인 노트 (고정)
  HOVER: 100,            // 호버 시
  BACKGROUND: 1,         // 기본 배경 노트
  DRAGGING: 150,         // 드래그 중인 노트
  MIN: 1,               // 최소값
  MAX: 1000             // 최대값
} as const;
