import { useState } from 'react';

function ImportantTaskItem({ task, onToggle, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.name);

  const finishEdit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed) {
      onDelete(task._id);
    } else if (trimmed !== task.name) {
      onRename(task._id, trimmed);
    }
  };

  return (
    <div className="important-task-item">
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(task._id, e.target.checked)}
      />
      {editing ? (
        <input
          className="task-inline-edit-input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') { setDraft(task.name); setEditing(false); }
          }}
        />
      ) : (
        <span
          className={'important-task-name' + (task.done ? ' completed' : '')}
          onClick={(e) => { e.stopPropagation(); setDraft(task.name); setEditing(true); }}
        >
          {task.name}
        </span>
      )}
      <div className="important-task-actions">
        <button
          type="button"
          className="task-action-btn edit"
          title="Edit item"
          onClick={(e) => { e.stopPropagation(); setDraft(task.name); setEditing(true); }}
        >
          ✏️
        </button>
        <button
          type="button"
          className="task-action-btn del"
          title="Delete item"
          onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ImportantTasks({ tasks, onToggle, onRename, onDelete, onAdd }) {
  return (
    <div className="important-section">
      <div className="important-header">
        <span className="important-badge">IMPORTANT</span>
      </div>
      <div className="important-tasks">
        {tasks.map((task) => (
          <ImportantTaskItem
            key={task._id}
            task={task}
            onToggle={onToggle}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button type="button" className="add-important-btn" onClick={onAdd}>
        + Add Task
      </button>
    </div>
  );
}
