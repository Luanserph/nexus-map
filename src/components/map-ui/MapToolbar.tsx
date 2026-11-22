import {
  Eye,
  EyeOff,
  MousePointer2,
  Route,
  Save,
  StickyNote,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { CustomRouteRecord, MapInteractionMode } from '../../types/schema';
import { GlassInput, GlassPanel, NeonButton } from '../glass';

export interface MapToolbarProps {
  mode: MapInteractionMode;
  onChangeMode: (mode: MapInteractionMode) => void;
  draftPointsCount: number;
  draftRouteColor: string;
  onChangeDraftColor: (color: string) => void;
  onUndoRoutePoint: () => void;
  onClearDraftRoute: () => void;
  onSaveDraftRoute: (name: string) => void;
  routes: CustomRouteRecord[];
  hiddenRouteIds: Set<string>;
  onToggleRouteVisibility: (routeId: string) => void;
  onDeleteRoute: (routeId: string) => void;
}

const ROUTE_COLOR_PRESETS = ['#00F0FF', '#D4AF37', '#FCEE0A', '#FF2A85', '#34D399'];

export function MapToolbar({
  mode,
  onChangeMode,
  draftPointsCount,
  draftRouteColor,
  onChangeDraftColor,
  onUndoRoutePoint,
  onClearDraftRoute,
  onSaveDraftRoute,
  routes,
  hiddenRouteIds,
  onToggleRouteVisibility,
  onDeleteRoute,
}: MapToolbarProps) {
  const [routeName, setRouteName] = useState('');
  const [showRoutesDrawer, setShowRoutesDrawer] = useState(false);

  function handleSave() {
    if (draftPointsCount < 2) return;
    onSaveDraftRoute(routeName.trim() || `Rota #${routes.length + 1}`);
    setRouteName('');
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {/* Contextual Hint / Route Builder Strip */}
      {mode === 'add-note' && (
        <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <StickyNote className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
            <span>Clique em qualquer ponto do mapa para fixar uma nota pessoal.</span>
            <button
              type="button"
              onClick={() => onChangeMode('explore')}
              aria-label="Sair do modo adicionar nota"
              className="cursor-pointer rounded p-0.5 text-[var(--text-muted)] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </GlassPanel>
      )}

      {mode === 'draw-route' && (
        <GlassPanel variant="elevated" padding="sm" className="pointer-events-auto w-[320px] sm:w-[440px]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                Traçar Rota{' '}
                <span className="font-mono text-[11px] text-[var(--accent-primary)]">
                  ({draftPointsCount} {draftPointsCount === 1 ? 'ponto' : 'pontos'})
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                {ROUTE_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChangeDraftColor(color)}
                    aria-label={`Cor da rota ${color}`}
                    className={[
                      'h-4 w-4 cursor-pointer rounded-full border transition-transform',
                      draftRouteColor === color
                        ? 'scale-115 border-white'
                        : 'border-white/25 opacity-75 hover:opacity-100',
                    ].join(' ')}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GlassInput
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Nome da rota (ex: Farm Sementes)"
                containerClassName="flex-1"
                className="h-8 text-xs"
              />
              <NeonButton
                size="sm"
                variant="ghost"
                disabled={draftPointsCount === 0}
                onClick={onUndoRoutePoint}
                title="Desfazer último ponto"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </NeonButton>
              <NeonButton
                size="sm"
                variant="ghost"
                disabled={draftPointsCount === 0}
                onClick={onClearDraftRoute}
                title="Limpar pontos"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </NeonButton>
              <NeonButton
                size="sm"
                variant="primary"
                disabled={draftPointsCount < 2}
                onClick={handleSave}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                Salvar
              </NeonButton>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Saved Routes Popover */}
      {showRoutesDrawer && routes.length > 0 && (
        <GlassPanel variant="elevated" padding="sm" className="pointer-events-auto w-[300px] sm:w-[340px]">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Rotas salvas nesta camada ({routes.length})
            </span>
            <button
              type="button"
              onClick={() => setShowRoutesDrawer(false)}
              className="cursor-pointer text-[var(--text-muted)] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {routes.map((route) => {
              const isHidden = hiddenRouteIds.has(route.id);
              return (
                <div
                  key={route.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-white/[0.07] bg-black/30 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: route.color,
                        opacity: isHidden ? 0.3 : 1,
                      }}
                    />
                    <span
                      className={[
                        'truncate',
                        isHidden
                          ? 'text-[var(--text-muted)] line-through'
                          : 'text-[var(--text-primary)]',
                      ].join(' ')}
                    >
                      {route.name}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      {route.points.length}p
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleRouteVisibility(route.id)}
                      title={isHidden ? 'Mostrar rota' : 'Ocultar rota'}
                      className="cursor-pointer rounded p-1 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                    >
                      {isHidden ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoute(route.id)}
                      title="Excluir rota"
                      className="cursor-pointer rounded p-1 text-rose-400/80 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* Main Discreet Floating Mode Toolbar */}
      <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
        <div
          className="flex items-center gap-1 px-2 py-1.5"
          role="toolbar"
          aria-label="Ferramentas do mapa"
        >
          <NeonButton
            size="sm"
            variant="glass"
            active={mode === 'explore'}
            onClick={() => onChangeMode('explore')}
            leftIcon={<MousePointer2 className="h-3.5 w-3.5" />}
          >
            Explorar
          </NeonButton>

          <NeonButton
            size="sm"
            variant="glass"
            active={mode === 'add-note'}
            onClick={() => onChangeMode(mode === 'add-note' ? 'explore' : 'add-note')}
            leftIcon={<StickyNote className="h-3.5 w-3.5" />}
          >
            Adicionar Nota
          </NeonButton>

          <NeonButton
            size="sm"
            variant="glass"
            active={mode === 'draw-route'}
            onClick={() =>
              onChangeMode(mode === 'draw-route' ? 'explore' : 'draw-route')
            }
            leftIcon={<Route className="h-3.5 w-3.5" />}
          >
            Traçar Rota
          </NeonButton>

          {routes.length > 0 && (
            <>
              <div className="mx-1 h-5 w-px bg-white/[0.10]" />
              <NeonButton
                size="sm"
                variant="ghost"
                active={showRoutesDrawer}
                onClick={() => setShowRoutesDrawer((prev) => !prev)}
              >
                Rotas ({routes.length})
              </NeonButton>
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
