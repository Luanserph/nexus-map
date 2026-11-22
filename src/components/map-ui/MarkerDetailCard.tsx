import {
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  DoorOpen,
  ExternalLink,
  ImagePlus,
  MapPin,
  Maximize2,
  Shield,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FormEvent } from 'react';
import { useI18n } from '../../core/i18n';
import { compressImageToWebpDataUrl } from '../../core/storage';
import type {
  BadgeStyle,
  Category,
  MapMarker,
  UserContributionRecord,
} from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';

export interface MarkerDetailCardProps {
  marker: MapMarker;
  category?: Category;
  isFound: boolean;
  checkedChecklistKeys: Set<string>;
  contributions: UserContributionRecord[];
  linkedMapName?: string;
  badgeStyle?: BadgeStyle;
  onToggleFound: () => void;
  onToggleChecklistItem: (itemId: string) => void;
  onAddContribution: (input: {
    imageDataUrl?: string;
    requirementNote?: string;
  }) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
  onEnterLinkedMap?: (linkedMapId: string) => void;
  onClose: () => void;
}

interface GalleryItem {
  id: string;
  src: string;
  source: 'wiki' | 'local';
  contributionId?: string;
  caption?: string;
}

export function MarkerDetailCard({
  marker,
  category,
  isFound,
  checkedChecklistKeys,
  contributions,
  linkedMapName,
  badgeStyle = 'minimal',
  onToggleFound,
  onToggleChecklistItem,
  onAddContribution,
  onDeleteContribution,
  onEnterLinkedMap,
  onClose,
}: MarkerDetailCardProps) {
  const { t, resolveMarkerTitle, resolveMarkerDescription } = useI18n();
  const [copied, setCopied] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Hybrid contribution form state
  const [isAddingContribution, setIsAddingContribution] = useState(false);
  const [draftImageDataUrl, setDraftImageDataUrl] = useState<string | undefined>(
    undefined
  );
  const [draftRequirement, setDraftRequirement] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markerTitle = resolveMarkerTitle(marker);
  const markerDesc = resolveMarkerDescription(marker);
  const coordsLabel = `[${marker.coords[0].toFixed(1)}, ${marker.coords[1].toFixed(1)}]`;

  // Combine Wiki image + local user screenshots into a single navigable gallery
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [];
    if (marker.imageUrl && !failedUrls.has(marker.imageUrl)) {
      items.push({
        id: 'wiki-primary',
        src: marker.imageUrl,
        source: 'wiki',
        caption: markerTitle,
      });
    }
    for (const contrib of contributions) {
      if (contrib.imageDataUrl) {
        items.push({
          id: contrib.id,
          src: contrib.imageDataUrl,
          source: 'local',
          contributionId: contrib.id,
          caption: contrib.requirementNote || markerTitle,
        });
      }
    }
    return items;
  }, [marker.imageUrl, failedUrls, contributions, markerTitle]);

  const requirementContributions = useMemo(
    () => contributions.filter((c) => Boolean(c.requirementNote)),
    [contributions]
  );

  const safeSlideIndex =
    galleryItems.length > 0
      ? Math.min(activeSlideIndex, galleryItems.length - 1)
      : 0;
  const activeSlide = galleryItems[safeSlideIndex];

  useEffect(() => {
    if (!isLightboxOpen) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsLightboxOpen(false);
      }
    }
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isLightboxOpen]);

  async function handleCopyCoords() {
    try {
      await navigator.clipboard.writeText(coordsLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore if clipboard API unavailable
    }
  }

  async function processImageBlob(blob: Blob) {
    setIsCompressing(true);
    try {
      const compressed = await compressImageToWebpDataUrl(blob, 960, 0.78);
      setDraftImageDataUrl(compressed);
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await processImageBlob(file);
  }

  async function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (!isAddingContribution) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          event.preventDefault();
          await processImageBlob(blob);
          break;
        }
      }
    }
  }

  async function handleSubmitContribution(event: FormEvent) {
    event.preventDefault();
    if (!draftImageDataUrl && !draftRequirement.trim()) return;

    await onAddContribution({
      imageDataUrl: draftImageDataUrl,
      requirementNote: draftRequirement.trim() || undefined,
    });

    setDraftImageDataUrl(undefined);
    setDraftRequirement('');
    setIsAddingContribution(false);
    if (draftImageDataUrl) {
      setActiveSlideIndex(galleryItems.length);
    }
  }

  const checklist = marker.checklist ?? [];
  const checkedCount = checklist.filter((item) =>
    checkedChecklistKeys.has(`${marker.id}:${item.id}`)
  ).length;

  const metadataEntries = marker.metadata
    ? Object.entries(marker.metadata).slice(0, 4)
    : [];

  return (
    <>
      <GlassPanel
        variant="elevated"
        padding="none"
        cornerMarks
        accentActive={!isFound}
        onPaste={(e) => void handlePaste(e)}
        className="max-h-[calc(100svh-7.5rem)] w-[320px] overflow-y-auto sm:w-[368px]"
      >
        {/* Hybrid Mini-Gallery (Wiki + Local User Screenshots) */}
        {activeSlide && (
          <div className="group/photo relative aspect-video w-full overflow-hidden border-b border-white/[0.08] bg-black/50">
            <img
              src={activeSlide.src}
              alt={activeSlide.caption ?? markerTitle}
              loading="lazy"
              onError={() =>
                setFailedUrls((prev) => new Set(prev).add(activeSlide.src))
              }
              onClick={() => setIsLightboxOpen(true)}
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover/photo:scale-105"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(7,9,13,0.85)] via-transparent to-black/30"
            />

            {/* Source Pill (Wiki vs Local Screenshot) */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <GlassBadge
                variant={activeSlide.source === 'local' ? 'accent' : 'neutral'}
                size="sm"
              >
                {activeSlide.source === 'local'
                  ? t('marker.sourceLocal')
                  : t('marker.sourceWiki')}
              </GlassBadge>
              {galleryItems.length > 1 && (
                <span className="rounded bg-black/65 px-1.5 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur-md">
                  {safeSlideIndex + 1}/{galleryItems.length}
                </span>
              )}
            </div>

            {/* Delete button for local user screenshots */}
            {activeSlide.source === 'local' && activeSlide.contributionId && (
              <button
                type="button"
                onClick={() => {
                  const id = activeSlide.contributionId;
                  if (id) void onDeleteContribution(id);
                }}
                title={t('marker.removeContribution')}
                aria-label={t('marker.removeContribution')}
                className="absolute top-2.5 right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-rose-400/35 bg-black/70 text-rose-300 backdrop-blur-md transition-colors hover:bg-rose-500/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Gallery Prev/Next Controls */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex(
                      (prev) =>
                        (prev - 1 + galleryItems.length) % galleryItems.length
                    )
                  }
                  aria-label="Imagem anterior"
                  className="absolute top-1/2 left-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/85 backdrop-blur-md hover:border-[var(--accent-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex((prev) => (prev + 1) % galleryItems.length)
                  }
                  aria-label="Próxima imagem"
                  className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/85 backdrop-blur-md hover:border-[var(--accent-primary)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Enlarge Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label={t('marker.enlarge')}
              className="absolute right-2.5 bottom-2.5 inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md transition-colors hover:border-[var(--accent-primary)] hover:text-white"
            >
              <Maximize2 className="h-3 w-3" />
              {t('marker.enlarge')}
            </button>
          </div>
        )}

        <div className="p-4">
          {/* Header: Category + Level Badge + Region + Close */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <GlassBadge
                variant={isFound ? 'success' : 'accent'}
                badgeStyle={badgeStyle}
                dot
              >
                {category?.name ?? marker.category}
              </GlassBadge>

              {marker.level !== undefined && (
                <GlassBadge
                  variant="neutral"
                  size="sm"
                  icon={<Shield className="h-3 w-3 text-amber-400" />}
                >
                  {t('marker.level')} {marker.level}
                </GlassBadge>
              )}

              {marker.region && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {marker.region}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes do pin"
              className="neon-focus-ring flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[var(--text-muted)] transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Title & Description (i18n translated with fallback) */}
          <div className="mt-3">
            <h3
              className="text-base font-semibold leading-snug text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--nexus-font-display)' }}
            >
              {markerTitle}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {markerDesc}
            </p>
          </div>

          {/* Interior / Sub-Map Portal Button */}
          {marker.linkedMapId && linkedMapName && onEnterLinkedMap && (
            <div className="mt-3">
              <NeonButton
                variant="glass"
                active
                size="md"
                onClick={() => onEnterLinkedMap(marker.linkedMapId!)}
                leftIcon={<DoorOpen className="h-4 w-4 text-[var(--accent-primary)]" />}
                className="w-full"
              >
                {t('marker.enterInterior')}: {linkedMapName}
              </NeonButton>
            </div>
          )}

          {/* Tags */}
          {marker.tags && marker.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {marker.tags.map((tag) => (
                <GlassBadge key={tag} variant="muted" size="sm">
                  #{tag}
                </GlassBadge>
              ))}
            </div>
          )}

          {/* User Requirement Notes (from local IndexedDB contributions) */}
          {requirementContributions.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] p-2.5">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-300/90">
                {t('marker.requirementsTitle')}
              </div>
              <div className="space-y-1.5">
                {requirementContributions.map((contrib) => (
                  <div
                    key={contrib.id}
                    className="flex items-start justify-between gap-2 text-xs text-[var(--text-primary)]"
                  >
                    <span>• {contrib.requirementNote}</span>
                    <button
                      type="button"
                      onClick={() => void onDeleteContribution(contrib.id)}
                      title={t('marker.removeContribution')}
                      className="shrink-0 cursor-pointer rounded p-0.5 text-[var(--text-muted)] hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini-Checklist persisted in IndexedDB */}
          {checklist.length > 0 && (
            <div className="mt-3.5 rounded-lg border border-white/[0.08] bg-black/35 p-2.5">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <span>{t('marker.checklist')}</span>
                <span className="text-[var(--accent-primary)]">
                  {checkedCount}/{checklist.length}
                </span>
              </div>
              <div className="space-y-1">
                {checklist.map((item) => {
                  const isChecked = checkedChecklistKeys.has(
                    `${marker.id}:${item.id}`
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggleChecklistItem(item.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-white/[0.06]"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
                      ) : (
                        <Square className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      )}
                      <span
                        className={
                          isChecked
                            ? 'text-[var(--text-muted)] line-through'
                            : 'text-[var(--text-primary)]'
                        }
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hybrid Contribution Section: Add Print (File or Ctrl+V) / Requirement */}
          <div className="mt-3.5">
            {!isAddingContribution ? (
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingContribution(true)}
                leftIcon={<Camera className="h-3.5 w-3.5 text-[var(--accent-primary)]" />}
                className="w-full border border-dashed border-white/15"
              >
                {t('marker.addContribution')}
              </NeonButton>
            ) : (
              <form
                onSubmit={(e) => void handleSubmitContribution(e)}
                className="space-y-2.5 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] bg-black/45 p-3"
              >
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {t('marker.pasteHint')}
                </p>

                {draftImageDataUrl ? (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-white/10">
                    <img
                      src={draftImageDataUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftImageDataUrl(undefined)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-black/75 text-white hover:bg-rose-500/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <NeonButton
                    type="button"
                    size="sm"
                    variant="glass"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
                    className="w-full"
                  >
                    {isCompressing ? '...' : t('marker.selectImage')}
                  </NeonButton>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFileSelect(e)}
                  className="hidden"
                />

                <GlassInput
                  value={draftRequirement}
                  onChange={(e) => setDraftRequirement(e.target.value)}
                  placeholder={t('marker.requirementPlaceholder')}
                  className="h-8 text-xs"
                />

                <div className="flex justify-end gap-1.5">
                  <NeonButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingContribution(false);
                      setDraftImageDataUrl(undefined);
                      setDraftRequirement('');
                    }}
                  >
                    {t('marker.cancel')}
                  </NeonButton>
                  <NeonButton
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={!draftImageDataUrl && !draftRequirement.trim()}
                  >
                    {t('marker.saveContribution')}
                  </NeonButton>
                </div>
              </form>
            )}
          </div>

          {/* Metadata Chips */}
          {metadataEntries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {metadataEntries.map(([key, value]) => {
                const formatted = Array.isArray(value)
                  ? value.join(', ')
                  : typeof value === 'boolean'
                    ? value
                      ? 'Sim'
                      : 'Não'
                    : String(value);

                return (
                  <span
                    key={key}
                    className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                  >
                    <strong className="font-medium text-[var(--text-primary)]">
                      {key}:
                    </strong>{' '}
                    {formatted}
                  </span>
                );
              })}
            </div>
          )}

          {/* Coordinates Bar */}
          <div className="mt-3.5 flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/35 px-2.5 py-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              <span>{coordsLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => void handleCopyCoords()}
              className="neon-focus-ring inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-300">{t('marker.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>{t('marker.copy')}</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Actions: Mark Found + Wiki Link */}
          <div className="mt-3.5 flex flex-col gap-2">
            <NeonButton
              variant={isFound ? 'glass' : 'primary'}
              active={isFound}
              size="md"
              onClick={onToggleFound}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              className="w-full"
            >
              {isFound ? t('marker.foundUnmark') : t('marker.markFound')}
            </NeonButton>

            {marker.wikiUrl && (
              <a
                href={marker.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-focus-ring inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] hover:text-[var(--text-primary)]"
              >
                <span>{t('marker.viewWiki')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Lightbox Modal for Active Gallery Image */}
      {isLightboxOpen && activeSlide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={markerTitle}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90svh] max-w-4xl overflow-hidden rounded-xl border border-white/15 bg-[#07090d] shadow-2xl"
          >
            <img
              src={activeSlide.src}
              alt={activeSlide.caption ?? markerTitle}
              className="max-h-[82svh] w-auto object-contain"
            />
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-2.5 text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                {activeSlide.caption ?? markerTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                {t('marker.closeEsc')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
