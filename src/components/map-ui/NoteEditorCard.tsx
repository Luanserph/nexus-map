import { Save, StickyNote, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useI18n } from '../../core/i18n';
import type { UserNoteRecord } from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';

export interface NoteEditorCardProps {
  /** Existing note when editing, or draft coordinates when creating a new note. */
  note?: UserNoteRecord;
  draftCoords?: [number, number];
  onSave: (data: { id?: string; title: string; content: string; coords: [number, number] }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function NoteEditorCard({
  note,
  draftCoords,
  onSave,
  onDelete,
  onClose,
}: NoteEditorCardProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const coords = note?.coords ?? draftCoords ?? [512, 512];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({
      id: note?.id,
      title: title.trim() || t('note.new'),
      content: content.trim(),
      coords,
    });
  }

  return (
    <GlassPanel
      variant="elevated"
      padding="md"
      cornerMarks
      accentActive
      className="w-[310px] sm:w-[340px]"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <GlassBadge
            variant="accent"
            icon={<StickyNote className="h-3 w-3" />}
          >
            {note ? t('note.edit') : t('note.new')}
          </GlassBadge>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar editor de nota"
            className="neon-focus-ring flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[var(--text-muted)] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="font-mono text-[10px] text-[var(--text-muted)]">
          {t('note.coords')}: [{coords[0].toFixed(1)}, {coords[1].toFixed(1)}]
        </div>

        <GlassInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('note.titlePlaceholder')}
          aria-label={t('note.titlePlaceholder')}
          autoFocus
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={t('note.contentPlaceholder')}
          aria-label={t('note.contentPlaceholder')}
          className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[rgba(7,9,13,0.68)] p-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[color-mix(in_srgb,var(--accent-primary)_65%,transparent)] focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          {note && onDelete ? (
            <NeonButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(note.id)}
              leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-400" />}
              className="text-rose-300 hover:text-rose-200"
            >
              {t('note.delete')}
            </NeonButton>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            <NeonButton type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('marker.cancel')}
            </NeonButton>
            <NeonButton
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              {t('note.save')}
            </NeonButton>
          </div>
        </div>
      </form>
    </GlassPanel>
  );
}
