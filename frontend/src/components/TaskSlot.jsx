import { useState } from 'react';
import { pad2 } from '../dateUtils';

export default function TaskSlot({ day, hour, taskName, isCompleted, onToggle, onSave, onDelete, onOpenAdd }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(taskName || '');

  const startEdit = () => {
    setDraft(taskName || '');
    setEditing(true);
  };

  const finishEdit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed) {
      if (trimmed !== taskName) onSave(day, hour, trimmed);
    } else if (taskName) {
      onDelete(day, hour);
    }
  };

  const handleSlotClick = () => {
    if (!taskName && !editing) onOpenAdd(day, hour);
  };

  return (
    <div className={'task-slot' + (taskName ? ' has-task' : '')} onClick={taskName ? undefined : handleSlotClick}>
      <input
        type="checkbox"
        checked={isCompleted}
        aria-label={taskName ? `${taskName} at ${pad2(hour)}:00` : `Add task at ${pad2(hour)}:00`}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onToggle(day, hour, e.target.checked)}
      />

      {editing ? (
        <input
          className="task-inline-edit-input"
          autoFocus
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span
          className={'task-slot-name' + (isCompleted ? ' completed' : '')}
          onClick={(e) => {
            e.stopPropagation();
            if (taskName) startEdit();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
        >
          {taskName || ''}
        </span>
      )}

      {!editing && taskName && (
        <div className="task-slot-actions">
          <button
            type="button"
            className="task-action-btn edit"
            title="Edit task"
            onClick={(e) => { e.stopPropagation(); startEdit(); }}
          >
            ✏️
          </button>
          <button
            type="button"
            className="task-action-btn del"
            title="Remove task"
            onClick={(e) => { e.stopPropagation(); onDelete(day, hour); }}
          >
            ✕
          </button>
        </div>
      )}

      {!editing && !taskName && (
        <button
          type="button"
          className="add-slot-btn"
          onClick={(e) => { e.stopPropagation(); onOpenAdd(day, hour); }}
        >
          + Add
        </button>
      )}
    </div>
  );
}
