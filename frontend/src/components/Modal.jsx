import { useEffect, useRef, useState } from 'react';
import { DAY_NAMES, pad2 } from '../dateUtils';

export default function Modal({ context, onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setName('');
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [context]);

  if (!context) return null;

  const title =
    context.type === 'slot'
      ? `Add Task — ${DAY_NAMES[context.day.getDay()]} ${pad2(context.hour)}:00`
      : 'Add Important Task';

  const confirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>
        <label className="modal-label">Task Name</label>
        <input
          ref={inputRef}
          className="modal-input"
          type="text"
          placeholder="e.g. Review Mathematics"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-actions">
          <button type="button" className="modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="modal-btn confirm" onClick={confirm}>Add</button>
        </div>
      </div>
    </div>
  );
}
