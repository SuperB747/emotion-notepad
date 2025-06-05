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
  THRESHOLD: 80,         // z-index 리셋 임계값
  REDUCTION: 50,         // z-index 감소량
  DRAGGING: 150,         // 드래그 중인 노트
  MIN: 1,               // 최소값
  MAX: 1000             // 최대값
} as const;

// 드래그 관련 상수와 ref
export const DRAG_THRESHOLD = 5;

// 레이아웃 계산 관련 상수
export const LAYOUT = {
  MAX_ROTATION: 5, // 최대 회전 각도
  SAFE_MARGIN: 150, // 화면 경계와의 최소 간격
  MIN_DISTANCE: 250, // 노트 간 최소 거리
  MIN_SAME_COLOR_DISTANCE: 350, // 같은 색상 노트 간 최소 거리
  MIN_MAIN_NOTE_CLEARANCE: 100, // 메인 노트와의 최소 거리
  MAX_MAIN_NOTE_CLEARANCE: 300, // 메인 노트와의 최대 거리
  MAX_VERTICAL_OFFSET: 200, // 위쪽으로 최대 거리 제한
  PLACEMENT_ATTEMPTS: 40, // 시도 횟수
  BASE_SCALE: 0.65, // 배경 노트 기본 스케일
  HOVER_SCALE: 0.85, // 배경 노트 호버 스케일
  MAIN_NOTE_WIDTH: 400, // 메인 노트 너비
  MAIN_NOTE_HEIGHT: 300, // 메인 노트 높이
  BACKGROUND_NOTE_WIDTH: 300, // 배경 노트 너비
  BACKGROUND_NOTE_HEIGHT: 220, // 배경 노트 높이
  FRAME_WIDTH: 1200, // 노트 표시 프레임 너비
  FRAME_HEIGHT: 750, // 노트 표시 프레임 높이
  MAIN_NOTE_OVERLAP_PERCENT: 30, // 메인 노트와 배경 노트가 겹칠 수 있는 최대 비율 (0-100)
} as const;
