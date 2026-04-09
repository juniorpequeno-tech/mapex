import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AutofillHandleProps {
  anchorEl: HTMLElement | null;
  containerEl: HTMLElement | null;
  onAutofill: (count: number) => void;
  maxRows: number;
}

export function AutofillHandle({ anchorEl, containerEl, onAutofill, maxRows }: AutofillHandleProps) {
  const [dragging, setDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const [handlePos, setHandlePos] = useState<{ top: number; left: number } | null>(null);
  const startYRef = useRef(0);
  const rowHeightRef = useRef(0);

  // Position the handle at the bottom-right of the anchor cell
  useEffect(() => {
    if (!anchorEl || !containerEl) {
      setHandlePos(null);
      return;
    }
    const update = () => {
      const anchorRect = anchorEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setHandlePos({
        top: anchorRect.bottom - containerRect.top - 4,
        left: anchorRect.right - containerRect.left - 4,
      });
      // Estimate row height from the anchor's parent row
      const row = anchorEl.closest('[data-flow-row]');
      if (row) {
        rowHeightRef.current = row.getBoundingClientRect().height;
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchorEl);
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [anchorEl, containerEl]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    setDragCount(0);
    startYRef.current = e.clientY;

    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientY - startYRef.current;
      const rh = rowHeightRef.current || 36;
      const count = Math.max(0, Math.min(Math.round(diff / rh), maxRows));
      setDragCount(count);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragging(false);
      setDragCount(prev => {
        if (prev > 0) {
          // Use setTimeout to avoid state update during render
          setTimeout(() => onAutofill(prev), 0);
        }
        return 0;
      });
    };

    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [maxRows, onAutofill]);

  if (!handlePos) return null;

  // Render highlight overlay for target rows
  const highlights: React.ReactNode[] = [];
  if (dragging && dragCount > 0 && anchorEl) {
    const anchorRect = anchorEl.getBoundingClientRect();
    const containerRect = containerEl!.getBoundingClientRect();
    const rh = rowHeightRef.current || 36;
    const cellWidth = anchorRect.width;
    const cellLeft = anchorRect.left - containerRect.left;

    for (let i = 1; i <= dragCount; i++) {
      highlights.push(
        <div
          key={i}
          className="absolute pointer-events-none border-2 border-primary/60 bg-primary/10 rounded-sm z-30"
          style={{
            left: cellLeft,
            top: anchorRect.top - containerRect.top + (i * rh),
            width: cellWidth,
            height: rh,
          }}
        />
      );
    }
  }

  // Source cell highlight
  const sourceHighlight = dragging && anchorEl && containerEl ? (() => {
    const anchorRect = anchorEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    return (
      <div
        className="absolute pointer-events-none border-2 border-primary bg-primary/5 rounded-sm z-30"
        style={{
          left: anchorRect.left - containerRect.left,
          top: anchorRect.top - containerRect.top,
          width: anchorRect.width,
          height: anchorRect.height,
        }}
      />
    );
  })() : null;

  return (
    <>
      {sourceHighlight}
      {highlights}
      {/* The handle dot */}
      <div
        className="absolute z-40 w-[8px] h-[8px] bg-primary border border-primary-foreground rounded-sm cursor-crosshair hover:scale-150 transition-transform"
        style={{
          top: handlePos.top,
          left: handlePos.left,
        }}
        onMouseDown={onMouseDown}
        title="Arrastar para copiar"
      />
      {/* Drag count badge */}
      {dragging && dragCount > 0 && (
        <div
          className="absolute z-50 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none"
          style={{
            top: handlePos.top + ((dragCount + 0.5) * (rowHeightRef.current || 36)),
            left: handlePos.left + 12,
          }}
        >
          +{dragCount}
        </div>
      )}
    </>
  );
}
