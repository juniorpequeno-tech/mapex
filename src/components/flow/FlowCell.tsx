import React, { useState } from 'react';
import { CellData, CellType, DropdownOption } from '@/types/flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Type, List, CalendarIcon, Paperclip, Plus, X, Palette, FileText, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CELL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280', 'transparent',
];

interface FlowCellProps {
  cell: CellData;
  onUpdate: (updates: Partial<CellData>) => void;
  onSetType: (type: CellType) => void;
  onTabNext?: () => void;
  onEnter?: () => void;
  onSetRowColor?: (color: string | undefined) => void;
  onOpenObservations?: () => void;
  onOpenMessages?: () => void;
}

const typeIcons: Record<CellType, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  dropdown: <List className="h-3 w-3" />,
  date: <CalendarIcon className="h-3 w-3" />,
  file: <Paperclip className="h-3 w-3" />,
  phone: <Phone className="h-3 w-3" />,
};

const typeLabels: Record<CellType, string> = {
  text: 'Texto',
  dropdown: 'Lista',
  date: 'Data',
  file: 'Anexo',
  phone: 'Telefone',
};

export function FlowCell({ cell, onUpdate, onSetType, onTabNext, onEnter, onSetRowColor, onOpenObservations, onOpenMessages }: FlowCellProps) {
  const [editingOptions, setEditingOptions] = useState(false);
  const [newOption, setNewOption] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ value: file.name, fileName: file.name });
    }
  };

  const addDropdownOption = () => {
    if (!newOption.trim()) return;
    const opt: DropdownOption = { id: Math.random().toString(36).substr(2, 9), label: newOption.trim() };
    onUpdate({ dropdownOptions: [...(cell.dropdownOptions || []), opt] });
    setNewOption('');
  };

  const removeDropdownOption = (id: string) => {
    onUpdate({ dropdownOptions: (cell.dropdownOptions || []).filter(o => o.id !== id) });
  };

  const ColorGrid = ({ onSelect }: { onSelect: (color: string | undefined) => void }) => (
    <div className="grid grid-cols-5 gap-1 p-1">
      {CELL_COLORS.map(c => (
        <button
          key={c}
          className={cn(
            "h-5 w-5 rounded border border-border hover:scale-110 transition-transform",
            c === 'transparent' && "bg-background relative after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(135deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]"
          )}
          style={c !== 'transparent' ? { backgroundColor: c } : undefined}
          onClick={() => onSelect(c === 'transparent' ? undefined : c)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-center gap-1 min-h-[32px] min-w-0 group/cell">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity">
            {typeIcons[cell.type]}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[160px]">
          {(Object.keys(typeLabels) as CellType[]).map(t => (
            <DropdownMenuItem key={t} onClick={() => onSetType(t)} className="gap-2">
              {typeIcons[t]}
              <span>{typeLabels[t]}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Palette className="h-3 w-3" />
              <span>Cor</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-0 min-w-[180px]">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-1">Célula</p>
                <ColorGrid onSelect={(color) => onUpdate({ bgColor: color })} />
              </div>
              <div className="border-t border-border px-2 py-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-1">Linha</p>
                <ColorGrid onSelect={(color) => onSetRowColor?.(color)} />
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => onOpenObservations?.()} className="gap-2">
            <MessageSquare className="h-3 w-3" />
            <span>Chat</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 min-w-0">
        {cell.type === 'text' && (
          <input
            className="w-full h-7 px-2 text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
            value={cell.value}
            onChange={e => onUpdate({ value: e.target.value })}
            placeholder="Digite aqui..."
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault();
                onTabNext?.();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                onEnter?.();
              }
            }}
          />
        )}

        {cell.type === 'dropdown' && (
          <div className="flex items-center gap-1">
            <Popover open={editingOptions} onOpenChange={setEditingOptions}>
              <PopoverTrigger asChild>
                <button className="opacity-0 group-hover/cell:opacity-100 h-5 w-5 rounded hover:bg-accent text-muted-foreground transition-opacity flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="start">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Gerenciar opções</p>
                <div className="flex gap-1 mb-2">
                  <Input
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDropdownOption()}
                    placeholder="Nova opção"
                    className="h-7 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={addDropdownOption}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(cell.dropdownOptions || []).map(opt => (
                    <div key={opt.id} className="flex items-center justify-between text-xs px-1 py-0.5 rounded hover:bg-accent">
                      <span>{opt.label}</span>
                      <button onClick={() => removeDropdownOption(opt.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Select value={cell.value} onValueChange={v => onUpdate({ value: v })}>
              <SelectTrigger className="h-7 border-0 border-b border-transparent hover:border-border text-sm shadow-none px-2 [&>span]:truncate [&>span]:block [&>span]:text-left [&>span]:whitespace-normal [&>span]:line-clamp-2">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(cell.dropdownOptions || []).map(opt => (
                  <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {cell.type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full h-7 px-2 text-sm text-left border-0 border-b border-transparent hover:border-border transition-colors flex items-center gap-1",
                !cell.value && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {cell.value ? format(new Date(cell.value), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={cell.value ? new Date(cell.value) : undefined}
                onSelect={d => d && onUpdate({ value: d.toISOString() })}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}

        {cell.type === 'phone' && (
          <div className="flex items-center gap-1 h-7">
            <Phone className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
            <input
              className="w-full h-7 px-2 text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              value={cell.value}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9()\-+\s]/g, '');
                onUpdate({ value: v });
              }}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              onKeyDown={e => {
                if (e.key === 'Tab') { e.preventDefault(); onTabNext?.(); }
                else if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); }
              }}
            />
            {cell.value && (
              <a
                href={`https://wa.me/55${cell.value.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-5 w-5 rounded hover:bg-accent text-green-500 hover:text-green-600 flex items-center justify-center shrink-0"
                title="Abrir WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {cell.type === 'file' && (
          <div className="flex items-center gap-1 h-7">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              className={cn(
                "w-full h-7 px-2 text-sm text-left border-0 border-b border-transparent hover:border-border transition-colors flex items-center gap-1",
                !cell.value && "text-muted-foreground"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3 w-3 shrink-0" />
              {cell.value || 'Anexar arquivo...'}
            </button>
            {cell.value && (
              <button
                className="h-5 w-5 rounded hover:bg-accent text-muted-foreground flex items-center justify-center shrink-0"
                onClick={() => onUpdate({ value: '', fileName: undefined })}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const MemoizedFlowCell = React.memo(FlowCell);
