import type { NOTE_COLORS } from "../constants/noteConstants";

export type NoteColor = keyof typeof NOTE_COLORS;

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  userId: string;
  color?: NoteColor;
  position?: {
    x: number;
    y: number;
    rotate: number;
  };
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
  isOpen?: boolean;
}

export interface NotePosition {
  x: number;
  y: number;
  rotate: number;
  zIndex?: number;
}

export interface FolderLayout {
  id: string;
  isOCDMode: boolean;
  folderName: string | null;
  updatedAt?: any;
  positions: Record<string, any>;
}
