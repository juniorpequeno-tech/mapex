import React, { useState } from 'react';
import { FlowRow as FlowRowType, Label } from '@/types/flow';
import { FlowCell } from './FlowCell';
import { CellData, CellType } from '@/types/flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tag, MessageSquare, FileText, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight } from 'lucide-react';

interface FlowRowProps {
  row: FlowRowType;
  labels: Label[];
  columnCount: number;
  onUpdateCell: (cellId: string, updates: Partial<CellData>) => void;
  onSetCellType: (cellId: string, type: CellType) => void;
  onToggleLabel: (labelId: string) => void;
  onAddLabel: (name: string) => void;
  onAddObservation: (text: string) => void;
  onAddMessage: (to: string, text: string) => void;
  onDelete: () => void;
  onFocusCell?: (cellIndex: number) => void;
  onEnter?: () => void;
  cellRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onSetRowColor?: (color: string | undefined) => void;
}

export function FlowRowComponent({
  row, labels, columnCount, onUpdateCell, onSetCellType,
  onToggleLabel, onAddLabel, onAddObservation, onAddMessage, onDelete,
  onFocusCell, onEnter, cellRefs, onSetRowColor,
}: FlowRowProps) {
  const [newLabelName, setNewLabelName] = useState('');
  const [msgTo, setMsgTo] = useState('');
  const [msgText, setMsgText] = useState('');
  const [obsText, setObsText] = useState('');
  const [obsOpen, setObsOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const obsTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const msgInputRef = React.useRef<HTMLInputElement>(null);

  const activeLabels = labels.filter(l => row.labels.includes(l.id));

  const openObservationChat = () => {
    // Use Dialog instead of Popover when opened from cell menu to avoid DropdownMenu conflicts
    setTimeout(() => setChatDialogOpen(true), 150);
  };

  const openMessages = () => {
    setTimeout(() => setMsgOpen(true), 200);
  };

  return (
    <div data-flow-row className="group relative flex items-stretch border-b border-border hover:bg-accent/30 transition-colors" style={row.bgColor ? { backgroundColor: row.bgColor + '22' } : undefined}>
      {/* Cells */}
      <div className="flex flex-1 items-center">
        {row.cells.map((cell, i) => (
          <React.Fragment key={cell.id}>
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-0.5" />
            )}
            <div
              className="flex-1 min-w-[180px] px-1 border-r border-border/50 rounded-sm"
              style={cell.bgColor ? { backgroundColor: cell.bgColor + '22' } : undefined}
              ref={el => { if (cellRefs) cellRefs.current[i] = el; }}
            >
              <FlowCell
                cell={cell}
                onUpdate={updates => onUpdateCell(cell.id, updates)}
                onSetType={type => onSetCellType(cell.id, type)}
                onTabNext={() => onFocusCell?.(i + 1)}
                onEnter={onEnter}
                onSetRowColor={onSetRowColor}
                onOpenObservations={openObservationChat}
                onOpenMessages={openMessages}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Active labels display */}
      {activeLabels.length > 0 && (
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          {activeLabels.map(l => (
            <span
              key={l.id}
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}

      {/* Action icons */}
      <div className="flex items-center gap-0.5 px-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Labels */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3" align="end">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Etiquetas</p>
            <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
              {labels.map(l => (
                <button
                  key={l.id}
                  className="flex items-center gap-2 w-full text-xs px-2 py-1 rounded hover:bg-accent"
                  onClick={() => onToggleLabel(l.id)}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="flex-1 text-left">{l.name}</span>
                  {row.labels.includes(l.id) && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newLabelName.trim()) {
                    onAddLabel(newLabelName.trim());
                    setNewLabelName('');
                  }
                }}
                placeholder="Nova etiqueta"
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => {
                  if (newLabelName.trim()) {
                    onAddLabel(newLabelName.trim());
                    setNewLabelName('');
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Observations - Chat log */}
        <Popover open={obsOpen} onOpenChange={setObsOpen}>
          <PopoverTrigger asChild>
            <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground relative">
              <FileText className="h-3.5 w-3.5" />
              {(row.observation?.entries?.length ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-3"
            align="end"
            onOpenAutoFocus={event => {
              event.preventDefault();
              obsTextareaRef.current?.focus();
            }}
          >
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              Observações — {row.cells[0]?.value || 'Nova Etapa'}
            </p>
            {(row.observation?.entries?.length ?? 0) > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {row.observation!.entries.map(entry => (
                  <div key={entry.id} className="text-xs p-2 rounded-lg bg-accent/50 border border-border/50">
                    <p className="text-foreground">{entry.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                      {', '}
                      {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={obsTextareaRef}
                value={obsText}
                onChange={e => setObsText(e.target.value)}
                placeholder="Escreva uma observação..."
                className="text-xs min-h-[40px] flex-1"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (obsText.trim()) {
                      onAddObservation(obsText.trim());
                      setObsText('');
                    }
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => {
                  if (obsText.trim()) {
                    onAddObservation(obsText.trim());
                    setObsText('');
                  }
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Messages */}
        <Popover open={msgOpen} onOpenChange={setMsgOpen}>
          <PopoverTrigger asChild>
            <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center text-muted-foreground relative">
              <MessageSquare className="h-3.5 w-3.5" />
              {row.messages.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-3"
            align="end"
            onOpenAutoFocus={event => {
              event.preventDefault();
              msgInputRef.current?.focus();
            }}
          >
            <p className="text-xs font-medium mb-2 text-muted-foreground">Recados</p>
            {row.messages.length > 0 && (
              <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
                {row.messages.map(m => (
                  <div key={m.id} className="text-xs p-1.5 rounded bg-accent">
                    <span className="font-medium">@{m.to}</span>: {m.text}
                  </div>
                ))}
              </div>
            )}
            <Input
              ref={msgInputRef}
              value={msgTo}
              onChange={e => setMsgTo(e.target.value)}
              placeholder="Para quem?"
              className="h-7 text-xs mb-1"
            />
            <Textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Mensagem..."
              className="text-xs min-h-[40px] mb-1"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs w-full"
              onClick={() => {
                if (msgTo.trim() && msgText.trim()) {
                  onAddMessage(msgTo.trim(), msgText.trim());
                  setMsgTo('');
                  setMsgText('');
                }
              }}
            >
              Enviar
            </Button>
          </PopoverContent>
        </Popover>

        {/* Delete */}
        <button
          className="h-6 w-6 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chat Dialog - opened from cell menu */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Chat — {row.cells[0]?.value || 'Nova Etapa'}
            </DialogTitle>
          </DialogHeader>
          {(row.observation?.entries?.length ?? 0) > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {row.observation!.entries.map(entry => (
                <div key={entry.id} className="text-xs p-2 rounded-lg bg-accent/50 border border-border/50">
                  <p className="text-foreground">{entry.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                    {', '}
                    {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={obsText}
              onChange={e => setObsText(e.target.value)}
              placeholder="Escreva uma observação..."
              className="text-xs min-h-[40px] flex-1"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (obsText.trim()) {
                    onAddObservation(obsText.trim());
                    setObsText('');
                  }
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => {
                if (obsText.trim()) {
                  onAddObservation(obsText.trim());
                  setObsText('');
                }
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

