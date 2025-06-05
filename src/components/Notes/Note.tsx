const Note = ({ note, isBackground = false }: NoteProps) => {
  const noteStyle = {
    backgroundColor: getBackgroundColor(note.color),
    color: getTextColor(note.color),
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: isBackground ? '200px' : '100%',
    height: isBackground ? '200px' : '100%',
    overflow: 'hidden',
    position: 'relative' as const,
    cursor: 'pointer',
  };

  const contentStyle = {
    fontSize: isBackground ? '0.8em' : '1em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: isBackground ? 3 : 'none',
    WebkitBoxOrient: 'vertical' as const,
    wordBreak: 'break-word' as const,
  };

  return (
    <div style={noteStyle}>
      <h3 style={{ 
        margin: '0 0 10px 0',
        fontSize: isBackground ? '1em' : '1.2em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {note.title}
      </h3>
      <div style={contentStyle}>
        {note.content}
      </div>
    </div>
  );
}; 