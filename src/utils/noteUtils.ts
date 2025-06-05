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

  const overlapLeft = Math.max(mainNoteLeft, bgNoteLeft);
  const overlapRight = Math.min(mainNoteRight, bgNoteRight);
  const overlapTop = Math.max(mainNoteTop, bgNoteTop);
  const overlapBottom = Math.min(mainNoteBottom, bgNoteBottom);

  if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
    const overlapWidth = overlapRight - overlapLeft;
    const overlapHeight = overlapBottom - overlapTop;
    const overlapArea = overlapWidth * overlapHeight;
    const bgNoteArea = bgNoteWidth * bgNoteHeight;
    const overlapPercent = (overlapArea / bgNoteArea) * 100;

    if (overlapPercent > LAYOUT.MAIN_NOTE_OVERLAP_PERCENT) {
      return 0;
    }
  }

  const dx = Math.max(mainNoteLeft - bgNoteRight, 0, bgNoteLeft - mainNoteRight);
  const dy = Math.max(mainNoteTop - bgNoteBottom, 0, bgNoteTop - mainNoteBottom);
  
  return Math.sqrt(dx * dx + dy * dy);
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
  const distanceFromMain = getDistanceFromMainNote(x, y);
  if (distanceFromMain === 0) {
    return false;
  }

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
  const sector = index % 8;
  const baseAngle = (sector * Math.PI / 4) + (Math.random() * 0.2 - 0.1);
  
  const maxScreenRadius = Math.min(
    containerSize.width / 2 - LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE - LAYOUT.SAFE_MARGIN,
    containerSize.height / 2 - LAYOUT.BACKGROUND_NOTE_HEIGHT * LAYOUT.BASE_SCALE - LAYOUT.SAFE_MARGIN
  );

  const effectiveMaxDistance = Math.min(LAYOUT.MAX_MAIN_NOTE_CLEARANCE, maxScreenRadius);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const minDistance = LAYOUT.MIN_MAIN_NOTE_CLEARANCE + LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE;
    const distance = minDistance + Math.random() * (effectiveMaxDistance - minDistance);
    
    const angleVariation = (Math.random() - 0.5) * Math.PI / 9;
    const angle = baseAngle + angleVariation;
    
    let x = Math.cos(angle) * distance;
    let y = Math.sin(angle) * distance;

    if (y < -LAYOUT.MAX_VERTICAL_OFFSET) {
      y = -LAYOUT.MAX_VERTICAL_OFFSET;
    }
    
    y += 50;

    if (isPositionValid(x, y, positions, currentNote, existingNotes, containerSize)) {
      return { x, y, zIndex: index + 1 };
    }
  }

  const safeDistance = LAYOUT.MIN_MAIN_NOTE_CLEARANCE + LAYOUT.BACKGROUND_NOTE_WIDTH * LAYOUT.BASE_SCALE + 
    Math.random() * (effectiveMaxDistance - LAYOUT.MIN_MAIN_NOTE_CLEARANCE) * 0.8;
  const safeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 12;
  let x = Math.cos(safeAngle) * safeDistance;
  let y = Math.sin(safeAngle) * safeDistance + 50;

  if (y < -LAYOUT.MAX_VERTICAL_OFFSET) {
    y = -LAYOUT.MAX_VERTICAL_OFFSET;
  }
  
  return { x, y, zIndex: index + 1 };
};
