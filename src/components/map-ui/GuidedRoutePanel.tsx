import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { OptimizedRouteResult } from '../../core/routing';
import type {
  Category,
  GuideFocus,
  GuideScope,
  GuideStartMode,
} from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';

export interface GuidedRoutePanelProps {
  routeResult: OptimizedRouteResult | null;
  activeStepIndex: number;
  foundMarkerIds: Set<string>;
  categoriesById: Record<string, Category>;
  scope: GuideScope;
  onChangeScope: (scope: GuideScope) => void;
  focus: GuideFocus;
  onChangeFocus: (focus: GuideFocus) => void;
  startMode: GuideStartMode;
  onChangeStartMode: (mode: GuideStartMode) => void;
  isPickingStartOnMap: boolean;
  onPickStartOnMap: () => void;
  hasLivePlayer: boolean;
  respectVisibleCategories: boolean;
  onToggleRespectVisibleCategories: () => void;
  onGenerateRoute: () => void;
  onSelectStep: (index: number) => void;
  onPreviousStep: () => void;
  onCompleteAndNext: () => void;
  onFocusCurrentStep: () => void;
  onClose: () => void;
}

const SCOPE_OPTIONS: { value: GuideScope; label: string }[] = [
  { value: 'all', label: 'Tudo 100%' },
  { value: 'base', label: 'Jogo Base' },
  { value: 'dlcs', label: 'DLCs' },
];

const FOCUS_OPTIONS: { value: GuideFocus; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'skills-power', label: 'Habilidades & Poder' },
  { value: 'gear-treasures', label: 'Equipamentos & Tesouros' },
  { value: 'quests-contracts', label: 'Missões & Contratos' },
];

export function GuidedRoutePanel({
  routeResult,
  activeStepIndex,
  foundMarkerIds,
  categoriesById,
  scope,
  onChangeScope,
  focus,
  onChangeFocus,
  startMode,
  onChangeStartMode,
  isPickingStartOnMap,
  onPickStartOnMap,
  hasLivePlayer,
  respectVisibleCategories,
  onToggleRespectVisibleCategories,
  onGenerateRoute,
  onSelectStep,
  onPreviousStep,
  onCompleteAndNext,
  onFocusCurrentStep,
  onClose,
}: GuidedRoutePanelProps) {
  const steps = routeResult?.steps ?? [];
  const totalMatching = routeResult?.totalMatchingCount ?? 0;
  const alreadyFoundAtGeneration = routeResult?.alreadyFoundCount ?? 0;
  const newlyFoundInRoute = steps.filter((s) =>
    foundMarkerIds.has(s.marker.id)
  ).length;
  const totalFound = Math.min(
    totalMatching,
    alreadyFoundAtGeneration + newlyFoundInRoute
  );
  const realPercent =
    totalMatching > 0 ? Math.round((totalFound / totalMatching) * 100) : 0;

  const clampedIdx =
    steps.length > 0 ? Math.min(activeStepIndex, steps.length - 1) : 0;
  const currentStep = steps[clampedIdx];
  const isLastStep = steps.length === 0 || clampedIdx >= steps.length - 1;
  const isCurrentDone = currentStep
    ? foundMarkerIds.has(currentStep.marker.id)
    : false;

  // Upcoming window preview (current + next 10 steps for crisp performance)
  const upcomingSteps = steps.slice(clampedIdx, clampedIdx + 12);

  return (
    <GlassPanel
      variant="elevated"
      padding="md"
      cornerMarks
      accentActive
      className="max-h-[calc(100svh-7.5rem)] w-[332px] overflow-y-auto sm:w-[376px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <GlassBadge
            variant="accent"
            size="sm"
            dot
            icon={<Compass className="h-3 w-3" />}
          >
            Gerador Dinâmico 100%
          </GlassBadge>
          <h3
            className="mt-1.5 text-sm font-bold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--nexus-font-display)' }}
          >
            Modo Guia 100% Otimizado
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar Modo Guia 100%"
          className="neon-focus-ring flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[var(--text-muted)] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scope & Focus Controls */}
      <div className="mt-3 space-y-2.5 rounded-lg border border-white/[0.07] bg-black/30 p-2.5">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Escopo
          </div>
          <div className="flex flex-wrap gap-1">
            {SCOPE_OPTIONS.map((opt) => (
              <NeonButton
                key={opt.value}
                size="sm"
                variant="glass"
                active={scope === opt.value}
                onClick={() => onChangeScope(opt.value)}
              >
                {opt.label}
              </NeonButton>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Foco
          </div>
          <div className="flex flex-wrap gap-1">
            {FOCUS_OPTIONS.map((opt) => (
              <NeonButton
                key={opt.value}
                size="sm"
                variant="glass"
                active={focus === opt.value}
                onClick={() => onChangeFocus(opt.value)}
              >
                {opt.label}
              </NeonButton>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Ponto de Partida
          </div>
          <div className="flex flex-wrap gap-1">
            <NeonButton
              size="sm"
              variant="glass"
              active={startMode === 'fast-travel' && !isPickingStartOnMap}
              onClick={() => onChangeStartMode('fast-travel')}
              leftIcon={<MapPin className="h-3 w-3" />}
            >
              Viagem Rápida
            </NeonButton>
            <NeonButton
              size="sm"
              variant="glass"
              active={startMode === 'map-click' || isPickingStartOnMap}
              onClick={onPickStartOnMap}
              leftIcon={<Crosshair className="h-3 w-3" />}
            >
              {isPickingStartOnMap ? 'Clique no mapa...' : 'Escolher no Mapa'}
            </NeonButton>
            <NeonButton
              size="sm"
              variant="glass"
              disabled={!hasLivePlayer}
              active={startMode === 'live-player'}
              onClick={() => onChangeStartMode('live-player')}
              leftIcon={<Radio className="h-3 w-3" />}
              title={
                hasLivePlayer
                  ? 'Iniciar da posição atual do Live Player'
                  : 'Ative o Live Telemetry ou Simulação para usar a posição do jogador'
              }
            >
              Live Player
            </NeonButton>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={onToggleRespectVisibleCategories}
            className={[
              'inline-flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-[11px] transition-colors',
              respectVisibleCategories
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>
              {respectVisibleCategories
                ? 'Respeitando filtros da sidebar'
                : 'Usar filtros da sidebar'}
            </span>
          </button>

          <NeonButton
            size="sm"
            variant="primary"
            onClick={onGenerateRoute}
            leftIcon={<RefreshCw className="h-3 w-3" />}
          >
            Gerar / Recalcular
          </NeonButton>
        </div>
      </div>

      {/* Real 100% Progress Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-secondary)]">
            Progresso 100% ({totalFound}/{totalMatching})
          </span>
          <span className="font-mono font-semibold text-[var(--accent-primary)]">
            {realPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-400"
            style={{
              width: `${realPercent}%`,
              backgroundColor: 'var(--accent-primary)',
              boxShadow: realPercent > 0 ? '0 0 12px var(--accent-glow)' : 'none',
            }}
          />
        </div>
        {routeResult && (
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
            <span className="truncate">Partida: {routeResult.startLabel}</span>
            <span className="shrink-0">{steps.length} passos</span>
          </div>
        )}
      </div>

      {/* Current Step Card or 100% Completed State */}
      {currentStep ? (
        <>
          <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_38%,transparent)] bg-black/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Passo {currentStep.stepNumber} / {steps.length}
                </span>
                {currentStep.marker.level !== undefined && (
                  <GlassBadge
                    variant="neutral"
                    size="sm"
                    icon={<Shield className="h-2.5 w-2.5 text-amber-400" />}
                  >
                    Nv. {currentStep.marker.level}
                  </GlassBadge>
                )}
              </div>

              <button
                type="button"
                onClick={onFocusCurrentStep}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
              >
                <Navigation className="h-3 w-3 text-[var(--accent-primary)]" />
                Centralizar
              </button>
            </div>

            <h4 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {currentStep.marker.title}
            </h4>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">
              {categoriesById[currentStep.marker.category]?.name ??
                currentStep.marker.category}
              {currentStep.marker.region ? ` · ${currentStep.marker.region}` : ''}
            </p>

            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {currentStep.tip}
            </p>
          </div>

          {/* Step Navigation Controls */}
          <div className="mt-3 flex items-center gap-2">
            <NeonButton
              size="sm"
              variant="glass"
              disabled={clampedIdx <= 0}
              onClick={onPreviousStep}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Anterior
            </NeonButton>

            <NeonButton
              size="sm"
              variant="primary"
              onClick={onCompleteAndNext}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              rightIcon={
                !isLastStep ? <ChevronRight className="h-3.5 w-3.5" /> : undefined
              }
              className="flex-1"
            >
              {isLastStep
                ? isCurrentDone
                  ? '100% Concluído!'
                  : 'Concluir Último Passo'
                : 'Concluir e Próximo'}
            </NeonButton>
          </div>

          {/* Upcoming Steps Window (next 12 steps) */}
          <div className="mt-3 space-y-1 border-t border-white/[0.07] pt-2.5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <span>Próximos passos (destaque no mapa: 5)</span>
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {upcomingSteps.map((step, offset) => {
                const absIdx = clampedIdx + offset;
                const done = foundMarkerIds.has(step.marker.id);
                const active = offset === 0;
                const inHighlightWindow = offset < 6;

                return (
                  <button
                    key={step.marker.id}
                    type="button"
                    onClick={() => onSelectStep(absIdx)}
                    className={[
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-left text-[11px] transition-colors',
                      active
                        ? 'bg-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={[
                          'font-mono text-[10px]',
                          inHighlightWindow
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-muted)]',
                        ].join(' ')}
                      >
                        {done ? '✓' : `${step.stepNumber}.`}
                      </span>
                      <span
                        className={
                          done
                            ? 'truncate text-[var(--text-muted)] line-through'
                            : 'truncate'
                        }
                      >
                        {step.marker.title}
                      </span>
                    </span>
                    {step.marker.region && (
                      <span className="shrink-0 font-mono text-[9px] text-[var(--text-muted)]">
                        {step.marker.region}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-3 text-center text-xs text-emerald-200">
          {totalMatching === 0
            ? 'Nenhum objetivo encontrado para este escopo/foco neste mapa.'
            : 'Parabéns! 100% dos objetivos deste escopo já foram concluídos.'}
        </div>
      )}
    </GlassPanel>
  );
}
