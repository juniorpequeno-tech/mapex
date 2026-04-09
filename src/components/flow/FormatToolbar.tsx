import React, { useState } from 'react';
import { Paintbrush, PaintBucket, Grid3X3, Type } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6b7280',
  '#1e293b', '#ffffff', 'transparent',
];

const BORDER_COLORS = [
  '#000000', '#374151', '#6b7280', '#ef4444', '#3b82f6',
  '#22c55e', '#eab308', '#8b5cf6', 'transparent',
];

interface FormatToolbarProps {
  onPaintCell: (color: string | undefined) => void;
  onPaintRow: (color: string | undefined) => void;
  onSetBorder: (color: string | undefined) => void;
  onSetFontSize: (size: number) => void;
  currentCellColor?: string;
  currentRowColor?: string;
  currentBorder?: string;
  currentFontSize?: number;
  disabled?: boolean;
}

function ColorPicker({ colors, onSelect, current }: { colors: string[]; onSelect: (c: string | undefined) => void; current?: string }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 p-2">
      {colors.map(c => (
        <button
          key={c}
          className={cn(
            "h-6 w-6 rounded-md border-2 hover:scale-110 transition-transform",
            current === c ? "border-primary ring-1 ring-primary" : "border-border",
            c === 'transparent' && "bg-background relative after:content-[''] after:absolute after:inset-0 after:rounded-md after:bg-[linear-gradient(135deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]",
            c === '#ffffff' && "bg-white"
          )}
          style={c !== 'transparent' && c !== '#ffffff' ? { backgroundColor: c } : c === '#ffffff' ? { backgroundColor: '#ffffff' } : undefined}
          onClick={() => onSelect(c === 'transparent' ? undefined : c)}
          title={c === 'transparent' ? 'Remover' : c}
        />
      ))}
    </div>
  );
}

export function FormatToolbar({
  onPaintCell, onPaintRow, onSetBorder, onSetFontSize,
  currentCellColor, currentRowColor, currentBorder, currentFontSize = 14,
  disabled,
}: FormatToolbarProps) {
  if (disabled) return null;

  return (
    <div className="border-b border-border px-4 py-1.5 flex items-center gap-1 bg-muted/30 shrink-0">
      <span className="text-[10px] text-muted-foreground mr-2 font-medium">Cabeçalho:</span>

      {/* Paint Cell */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-7 px-2 rounded hover:bg-accent flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Pintar célula"
          >
            <PaintBucket className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Célula</span>
            {currentCellColor && (
              <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: currentCellColor }} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <p className="text-xs font-medium text-muted-foreground px-2 pt-2">Cor da célula</p>
          <ColorPicker colors={COLORS} onSelect={onPaintCell} current={currentCellColor} />
        </PopoverContent>
      </Popover>

      {/* Paint Row */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-7 px-2 rounded hover:bg-accent flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Pintar linha"
          >
            <Paintbrush className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Linha</span>
            {currentRowColor && (
              <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: currentRowColor }} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <p className="text-xs font-medium text-muted-foreground px-2 pt-2">Cor da linha</p>
          <ColorPicker colors={COLORS} onSelect={onPaintRow} current={currentRowColor} />
        </PopoverContent>
      </Popover>

      {/* Border */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-7 px-2 rounded hover:bg-accent flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Bordas"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Borda</span>
            {currentBorder && (
              <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: currentBorder }} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <p className="text-xs font-medium text-muted-foreground px-2 pt-2">Cor da borda</p>
          <ColorPicker colors={BORDER_COLORS} onSelect={onSetBorder} current={currentBorder} />
        </PopoverContent>
      </Popover>

      {/* Font Size */}
      <div className="h-5 w-px bg-border mx-1" />
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-7 px-2 rounded hover:bg-accent flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Tamanho da fonte"
          >
            <Type className="h-3.5 w-3.5" />
            <span>{currentFontSize}px</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="text-xs font-medium text-muted-foreground mb-3">Tamanho da fonte</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">10</span>
            <Slider
              value={[currentFontSize]}
              onValueChange={([v]) => onSetFontSize(v)}
              min={10}
              max={24}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground">24</span>
          </div>
          <div className="flex gap-1 mt-2 justify-center">
            {[12, 14, 16, 18, 20].map(s => (
              <button
                key={s}
                className={cn(
                  "h-7 w-9 rounded text-xs border transition-colors",
                  currentFontSize === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                )}
                onClick={() => onSetFontSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
