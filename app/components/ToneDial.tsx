'use client';

import { useState, useRef, useEffect } from 'react';
import ToneEditModal from './ToneEditModal';

interface ToneLabel {
  title: string;
  description: string;
}

interface ToneLabels {
  top: ToneLabel;
  right: ToneLabel;
  bottom: ToneLabel;
  left: ToneLabel;
}

interface ToneDialProps {
  id: string;
  onToneSelect: (coordinates: { x: number; y: number }, labels: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  }) => void;
}

const DEFAULT_LABELS: ToneLabels = {
  top: {
    title: 'Gen Z',
    description: 'informal, internet slang, emojis'
  },
  right: {
    title: 'Millennial',
    description: 'casual, friendly, some emojis'
  },
  bottom: {
    title: 'Gen X',
    description: 'straightforward, slightly cynical'
  },
  left: {
    title: 'Boomer',
    description: 'formal, traditional'
  }
};

const ToneDial: React.FC<ToneDialProps> = ({ id, onToneSelect }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [editingPosition, setEditingPosition] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [labels, setLabels] = useState<ToneLabels>(DEFAULT_LABELS);
  const dialRef = useRef<HTMLDivElement>(null);

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`dial-${id}-settings`);
    if (savedSettings) {
      setLabels(JSON.parse(savedSettings));
    }
  }, [id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    updatePosition(e);
    onToneSelect(
      { x: position.x, y: position.y },
      {
        top: `${labels.top.title} style (${labels.top.description})`,
        right: `${labels.right.title} style (${labels.right.description})`,
        bottom: `${labels.bottom.title} style (${labels.bottom.description})`,
        left: `${labels.left.title} style (${labels.left.description})`
      }
    );
  };

  const updatePosition = (e: React.MouseEvent) => {
    if (!dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setPosition({ x, y });
  };

  const handleLabelEdit = (position: 'top' | 'right' | 'bottom' | 'left') => {
    setEditingPosition(position);
  };

  const handleSaveLabel = (title: string, description: string) => {
    if (!editingPosition) return;

    const newLabels = {
      ...labels,
      [editingPosition]: { title, description }
    };

    setLabels(newLabels);
    localStorage.setItem(`dial-${id}-settings`, JSON.stringify(newLabels));
    setEditingPosition(null);
  };

  const LabelButton = ({ position, className }: { position: 'top' | 'right' | 'bottom' | 'left', className: string }) => {
    let posStr = 'left-3'
    if (position === 'left') posStr = 'bottom-3'
    if (position === 'right') posStr = 'top-3'

    return <button
      onClick={(e) => {
        e.stopPropagation();
        handleLabelEdit(position);
      }}
      className={`${className} ${posStr} group relative flex items-center gap-1.5 justify-center`}
    >
      <span className="group-hover:bg-black group-hover:text-white p-2 rounded transition-colors flex items-center gap-2">
        <span>{labels[position].title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </span>
    </button>
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <LabelButton position="top" className="text-center font-bold text-sm" />
      <div className="flex items-center">
        <LabelButton position="left" className="text-right p-2 font-bold text-sm [writing-mode:vertical-rl] rotate-180" />
        <div
          ref={dialRef}
          className="relative w-48 h-48 cursor-pointer"
          style={{
            background: 'url(/tone-dial-bg.png)',
            backgroundSize: 'cover'
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
          />
        </div>
        <LabelButton position="right" className="font-bold p-2 text-sm [writing-mode:vertical-rl]" />
      </div>
      <LabelButton position="bottom" className="text-center font-bold text-sm" />

      <ToneEditModal
        isOpen={editingPosition !== null}
        onClose={() => setEditingPosition(null)}
        onSave={handleSaveLabel}
        initialTitle={editingPosition ? labels[editingPosition].title : ''}
        initialDescription={editingPosition ? labels[editingPosition].description : ''}
        position={editingPosition || 'top'}
      />
    </div>
  );
};

export default ToneDial; 