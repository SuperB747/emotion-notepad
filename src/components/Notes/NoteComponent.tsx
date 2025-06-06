import React from 'react';
import { Typography } from '@mui/material';
import { Note } from '../../types/noteTypes';
import { NOTE_COLORS } from '../../constants/noteConstants';

interface NoteComponentProps {
    note: Note;
    isBackground?: boolean;
    zIndex?: number;
}

export const NoteComponent: React.FC<NoteComponentProps> = ({ note, isBackground = false, zIndex }) => {
    const titleFontSize = isBackground ? '1rem' : '1.25rem';
    const contentFontSize = isBackground ? '0.75rem' : '0.9rem';
    const padding = isBackground ? '0.8rem' : '1rem';

    return (
        <div style={{
            backgroundColor: NOTE_COLORS[note.color || 'yellow'].bg,
            width: '100%',
            height: '100%',
            padding: padding,
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Typography variant="h6" sx={{ 
                fontSize: titleFontSize, 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {note.title}
            </Typography>
            <Typography sx={{ 
                fontSize: contentFontSize, 
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                flex: 1,
            }}>
                {note.content}
            </Typography>
            {isBackground && zIndex !== undefined && (
                <Typography sx={{ position: 'absolute', bottom: 5, right: 8, fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)' }}>
                    z: {zIndex}
                </Typography>
            )}
        </div>
    );
}; 