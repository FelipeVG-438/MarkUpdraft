import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ term, definition, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    const tooltipWidth = 280;
    const offset = 8;
    
    let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top + window.scrollY - offset;

    // Viewport edge collision detection and correction
    const padding = 12;
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isHovered) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-highlight"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {isHovered &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '280px',
              transform: 'translateY(-100%)',
              zIndex: 9999,
            }}
            className="bg-slate-900 text-slate-100 text-xs rounded-lg p-3 shadow-2xl pointer-events-none border border-slate-700/50 transition-opacity duration-200"
          >
            <div className="font-bold text-indigo-300 mb-1 text-sm border-b border-slate-800 pb-1 flex justify-between items-center">
              <span>{term}</span>
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded">EXPLANATION</span>
            </div>
            <p className="leading-relaxed text-slate-200">{definition}</p>
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-900"
            />
          </div>,
          document.body
        )}
    </>
  );
};
