'use client';

import { useState, useRef } from 'react';

interface ToneDialProps {
  onToneSelect: (x: number, y: number) => void;
}

const ToneDial: React.FC<ToneDialProps> = ({ onToneSelect }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const dialRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    updatePosition(e);
    onToneSelect(position.x, position.y);
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

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-center font-bold text-sm">Gen Z</div>
      <div className="flex items-center">
        <div className="text-right p-2 font-bold text-sm [writing-mode:vertical-rl] rotate-180">Boomer</div>
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
        <div className="p-2 font-bold text-sm [writing-mode:vertical-rl]">Millennial</div>
      </div>
      <div className="text-center font-bold text-sm">Gen X</div>
    </div>
  );
};

export default ToneDial; 