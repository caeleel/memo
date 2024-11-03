'use client';

import React from 'react';
import { EditorState } from 'draft-js';

interface InlineToolbarProps {
  editorState: EditorState;
  onToggle: (style: string) => void;
  position: { top: number; left: number } | null;
}

const InlineToolbar: React.FC<InlineToolbarProps> = ({ editorState, onToggle, position }) => {
  if (!position) return null;

  const currentStyle = editorState.getCurrentInlineStyle();

  const ToolbarButton = ({ style, label }: { style: string; label: string }) => {
    // Style mapping for visual representation
    const textStyle = {
      BOLD: 'font-bold',
      ITALIC: 'italic',
      UNDERLINE: 'underline'
    }[style];

    return (
      <button
        className={`
          w-8 h-8 text-sm flex items-center justify-center
          ${currentStyle.has(style)
            ? 'bg-gray-100 text-gray-800'
            : 'text-gray-600 hover:bg-gray-50'
          }
          rounded transition-all
          ${textStyle}
        `}
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent editor from losing focus
          onToggle(style);
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed z-10 flex p-1 rounded-lg shadow-lg bg-white border border-gray-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%) translateY(-5px)',
      }}
    >
      <ToolbarButton style="BOLD" label="B" />
      <ToolbarButton style="ITALIC" label="I" />
      <ToolbarButton style="UNDERLINE" label="U" />
    </div>
  );
};

export default InlineToolbar; 