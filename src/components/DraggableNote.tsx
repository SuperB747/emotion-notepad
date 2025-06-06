import { Note, NotePosition } from '../types';
import { motion, useDragControls } from 'framer-motion';
import NoteEditor from './NoteEditor';

interface DraggableNoteProps {
    note: Note;
    position: NotePosition;
    isSelected: boolean;
    onSelect: (note: Note) => void;
    onDrag: (id: string, offset: { x: number; y: number }) => void;
    onUpdate: (id: string, content: string) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
}

const DraggableNote = ({
    note,
    position,
    isSelected,
    onSelect,
    onDrag,
    onUpdate,
    onDragStart,
    onDragEnd,
}: DraggableNoteProps) => {
    const controls = useDragControls();

    const startDrag = (event: React.PointerEvent) => {
        onDragStart();
        controls.start(event, { snapToCursor: false });
    };

    return (
        <motion.div
            drag
            dragListener={false}
            dragControls={controls}
            onDragEnd={(event, info) => {
                onDrag(note.id, { x: info.offset.x, y: info.offset.y });
                onDragEnd();
            }}
            onPointerDown={startDrag}
            onClick={() => onSelect(note)}
            className={`absolute cursor-grab active:cursor-grabbing p-4 rounded-lg shadow-lg bg-yellow-200 text-gray-800 transform-gpu transition-all duration-300 ease-in-out`}
            style={{
                width: 250,
                height: 250,
                x: position.x,
                y: position.y,
                zIndex: position.zIndex,
            }}
            animate={{
                x: position.x,
                y: position.y,
                rotate: position.rotate,
                zIndex: position.zIndex,
                scale: isSelected ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <NoteEditor note={note} onUpdate={onUpdate} isSelected={isSelected} />
        </motion.div>
    );
};

export default DraggableNote; 