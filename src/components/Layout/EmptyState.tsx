import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
    message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
    return (
        <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'text.secondary'
        }}>
            <Typography>{message}</Typography>
        </Box>
    );
}; 