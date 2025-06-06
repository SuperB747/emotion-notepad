import { LAYOUT } from '../constants/noteConstants';
import type { Note, NotePosition } from '../types/noteTypes';

// 두 점 사이의 거리 계산
export const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// 두 사각형이 겹치는지 확인하는 함수
export const isRectanglesOverlap = (
  rect1: { left: number; right: number; top: number; bottom: number },
  rect2: { left: number; right: number; top: number; bottom: number }
): boolean => {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
};

// 메인 노트와의 거리 계산
export const getDistanceFromMainNote = (x: number, y: number): number => {
  const mainNoteLeft = -LAYOUT.MAIN_NOTE_WIDTH / 2;
  const mainNoteRight = LAYOUT.MAIN_NOTE_WIDTH / 2;
  const mainNoteTop = -LAYOUT.MAIN_NOTE_HEIGHT / 2;
  const mainNoteBottom = LAYOUT.MAIN_NOTE_HEIGHT / 2;

  const bgNoteWidth = LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE;
  const bgNoteHeight = LAYOUT.BACKGROUND_NOTE_HEIGHT * LAYOUT.BASE_SCALE;
  const bgNoteHalfWidth = bgNoteWidth / 2;
  const bgNoteHalfHeight = bgNoteHeight / 2;

  const bgNoteLeft = x - bgNoteHalfWidth;
  const bgNoteRight = x + bgNoteHalfWidth;
  const bgNoteTop = y - bgNoteHalfHeight;
  const bgNoteBottom = y + bgNoteHalfHeight;

  // 메인 노트와 배경 노트가 겹치는 영역 계산
  const overlapLeft = Math.max(mainNoteLeft, bgNoteLeft);
  const overlapRight = Math.min(mainNoteRight, bgNoteRight);
  const overlapTop = Math.max(mainNoteTop, bgNoteTop);
  const overlapBottom = Math.min(mainNoteBottom, bgNoteBottom);

  // 겹치는 영역이 있다면, 그 넓이를 계산하여 허용치를 넘는지 확인
  if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
    const overlapWidth = overlapRight - overlapLeft;
    const overlapHeight = overlapBottom - overlapTop;
    const overlapArea = overlapWidth * overlapHeight;
    const bgNoteArea = bgNoteWidth * bgNoteHeight;
    const overlapPercent = (overlapArea / bgNoteArea) * 100;

    // 겹치는 비율이 설정된 허용치보다 크면, 유효하지 않은 위치로 간주 (거리 0 반환)
    if (overlapPercent > LAYOUT.MAIN_NOTE_OVERLAP_PERCENT) {
      return 0; // 0은 '충돌' 또는 '유효하지 않음'을 의미
    }
  }

  // 겹치지 않는 경우, 가장 가까운 모서리까지의 거리를 반환
  const dx = Math.max(mainNoteLeft - bgNoteRight, 0, bgNoteLeft - mainNoteRight);
  const dy = Math.max(mainNoteTop - bgNoteBottom, 0, bgNoteTop - mainNoteBottom);
  
  return Math.sqrt(dx * dx + dy * dy) + (overlapLeft < overlapRight && overlapTop < overlapBottom ? 0.1 : 1);
};

// 화면 범위 체크
export const isWithinScreen = (
  x: number, y: number, rotation: number,
  containerSize: { width: number; height: number }
): boolean => {
  const bgNoteHalfWidth = (LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE) / 2;
  const bgNoteHalfHeight = (LAYOUT.BACKGROUND_NOTE_HEIGHT * LAYOUT.BASE_SCALE) / 2;
  
  const angleRad = (rotation * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  const corners = [
    { x: -bgNoteHalfWidth, y: -bgNoteHalfHeight },
    { x: bgNoteHalfWidth, y: -bgNoteHalfHeight },
    { x: bgNoteHalfWidth, y: bgNoteHalfHeight },
    { x: -bgNoteHalfWidth, y: bgNoteHalfHeight }
  ].map(point => ({
    x: x + (point.x * cosAngle - point.y * sinAngle),
    y: y + (point.x * sinAngle + point.y * cosAngle)
  }));
  
  const minX = Math.min(...corners.map(p => p.x));
  const maxX = Math.max(...corners.map(p => p.x));
  const minY = Math.min(...corners.map(p => p.y));
  const maxY = Math.max(...corners.map(p => p.y));

  return (
    minX >= -containerSize.width / 2 + LAYOUT.SAFE_MARGIN &&
    maxX <= containerSize.width / 2 - LAYOUT.SAFE_MARGIN &&
    minY >= -containerSize.height / 2 + LAYOUT.SAFE_MARGIN &&
    maxY <= containerSize.height / 2 - LAYOUT.SAFE_MARGIN
  );
};

// 위치 유효성 검사
export const isPositionValid = (
    x: number, y: number, 
    positions: Record<string, NotePosition>, 
    currentNote: Note, 
    existingNotes: Note[],
    containerSize: { width: number; height: number }
): boolean => {
  // 메인 노트와 허용치 이상으로 겹치는지 확인
  if (getDistanceFromMainNote(x, y) === 0) {
    return false;
  }

  // 다른 배경 노트와 최소 거리 이상 떨어져 있는지 확인
  for (let i = 0; i < existingNotes.length; i++) {
    const otherNote = existingNotes[i];
    const pos = positions[otherNote.id];
    if (!pos) continue;

    const dist = getDistance(x, y, pos.x, pos.y);
    const minRequiredDistance = currentNote.color && otherNote.color && currentNote.color === otherNote.color
      ? LAYOUT.MIN_SAME_COLOR_DISTANCE
      : LAYOUT.MIN_DISTANCE;

    if (dist < minRequiredDistance) {
      return false;
    }
  }

  const rotation = (Math.random() - 0.5) * 2 * LAYOUT.MAX_ROTATION;
  if (!isWithinScreen(x, y, rotation, containerSize)) {
    return false;
  }
  
  return true;
};

// 랜덤 위치 생성
export const generateRandomPosition = (
  index: number,
  positions: Record<string, NotePosition>,
  currentNote: Note,
  existingNotes: Note[],
  containerSize: { width: number; height: number },
  maxAttempts: number = LAYOUT.PLACEMENT_ATTEMPTS
): { x: number; y: number; zIndex: number } => {
  const maxScreenRadius = Math.min(
    containerSize.width / 2 - LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE,
    containerSize.height / 2 - LAYOUT.BACKGROUND_NOTE_HEIGHT * LAYOUT.BASE_SCALE
  ) - LAYOUT.SAFE_MARGIN;
  
  // 노트를 고르게 분포시키기 위해 8개의 섹터로 나눔
  const sectorCount = 8;
  const baseAngle = (index % sectorCount) * (2 * Math.PI / sectorCount);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const minRadius = (Math.max(LAYOUT.MAIN_NOTE_WIDTH, LAYOUT.MAIN_NOTE_HEIGHT) / 2) + LAYOUT.MIN_MAIN_NOTE_CLEARANCE;
    const maxRadius = Math.min(maxScreenRadius, minRadius + LAYOUT.MAX_MAIN_NOTE_CLEARANCE);

    const distance = minRadius + Math.random() * (maxRadius - minRadius);
    
    // 각 섹터 내에서 약간의 무작위 각도 추가
    const angleVariation = (Math.random() - 0.5) * (2 * Math.PI / sectorCount);
    const angle = baseAngle + angleVariation;
    
    let x = Math.cos(angle) * distance;
    let y = Math.sin(angle) * distance;
    
    // 메인 노트 위로 너무 올라가지 않도록 y 위치 제한
    const yLimit = -(LAYOUT.MAIN_NOTE_HEIGHT / 2) - LAYOUT.MAX_Y_OFFSET_ABOVE_MAIN;
    if (y < yLimit) {
      y = yLimit;
    }

    if (isPositionValid(x, y, positions, currentNote, existingNotes, containerSize)) {
      return { x, y, zIndex: index + 1 };
    }
  }

  // Fallback: 유효한 위치를 못 찾으면, 최소 반경에서 시작하여 각도를 조금씩 돌리면서 빈 공간을 찾음
  let radius = (Math.max(LAYOUT.MAIN_NOTE_WIDTH, LAYOUT.MAIN_NOTE_HEIGHT) / 2) + LAYOUT.MIN_MAIN_NOTE_CLEARANCE;
  for (let j = 0; j < 10; j++) { // 반경을 점차 늘려가며 시도
    for (let i = 0; i < 36; i++) { // 10도씩 회전하며 검사
      const angle = baseAngle + (i * 10 * Math.PI / 180);
      
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle) * radius;

      const yLimit = -(LAYOUT.MAIN_NOTE_HEIGHT / 2) - LAYOUT.MAX_Y_OFFSET_ABOVE_MAIN;
      if (y < yLimit) {
        y = yLimit;
      }

      if (isPositionValid(x, y, positions, currentNote, existingNotes, containerSize)) {
        return { x, y, zIndex: index + 1 };
      }
    }
    radius += 20; // 반경을 20px 늘려서 다시 시도
  }

  // 최후의 수단: 그래도 유효한 위치를 찾지 못하면, 원래 계산된 각도의 최소 반경에 배치.
  // 이 경우 일부 겹침이 발생할 수 있으나, 모든 노트가 배치되도록 보장함.
  const finalRadius = (Math.max(LAYOUT.MAIN_NOTE_WIDTH, LAYOUT.MAIN_NOTE_HEIGHT) / 2) + LAYOUT.MIN_MAIN_NOTE_CLEARANCE;
  const angle = baseAngle;
  let x = Math.cos(angle) * finalRadius;
  let y = Math.sin(angle) * finalRadius;
  const yLimit = -(LAYOUT.MAIN_NOTE_HEIGHT / 2) - LAYOUT.MAX_Y_OFFSET_ABOVE_MAIN;
  if (y < yLimit) {
    y = yLimit;
  }
  
  return { x, y, zIndex: index + 1 };
};
