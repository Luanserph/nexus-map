import {
  Crosshair,
  Play,
  Plug,
  Radio,
  Settings2,
  Square,
  Unplug,
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../core/i18n';
import type { UseLivePlayerResult } from '../../core/telemetry';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';

export interface LiveTelemetryWidgetProps {
  telemetry: UseLivePlayerResult;
}

export function LiveTelemetryWidget({ telemetry }: LiveTelemetryWidgetProps) {
  const { t } = useI18n();
  const [showConfig, setShowConfig] = useState(false);

  const isLive = telemetry.status === 'live';
  const isSimulated = telemetry.status === 'simulated';
  const isConnecting = telemetry.status === 'connecting';
  const isActive = isLive || isSimulated;

  const badgeVariant = isLive
    ? 'success'
    : isSimulated
      ? 'accent'
      : 'neutral';

  const statusLabel = isLive
    ? t('telemetry.live')
    : isSimulated
      ? t('telemetry.simulated')
      : isConnecting
        ? t('telemetry.connecting')
        : t('telemetry.offline');

  return (
    <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
      <div className="flex flex-col gap-2 px-3 py-2">
        {/* Compact Status & Primary Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <GlassBadge
            variant={badgeVariant}
            size="sm"
            dot
            icon={<Radio className="h-3 w-3" />}
          >
            {statusLabel}
          </GlassBadge>

          <NeonButton
            size="sm"
            variant="ghost"
            active={telemetry.followCamera}
            onClick={() => telemetry.setFollowCamera(!telemetry.followCamera)}
            leftIcon={<Crosshair className="h-3 w-3" />}
            title={t('telemetry.followCamera')}
          >
            {t('telemetry.followCamera')}
          </NeonButton>

          <NeonButton
            size="sm"
            variant="glass"
            active={telemetry.isSimulating}
            onClick={telemetry.toggleSimulation}
            leftIcon={
              telemetry.isSimulating ? (
                <Square className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )
            }
          >
            {telemetry.isSimulating
              ? t('telemetry.stopSimulate')
              : t('telemetry.simulate')}
          </NeonButton>

          <button
            type="button"
            onClick={() => setShowConfig((prev) => !prev)}
            aria-label="Configurar WebSocket de telemetria"
            title="Configurar WebSocket local"
            className="neon-focus-ring flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Heading & Position Readout */}
        {isActive && telemetry.player && (
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            <span>
              PLAYER: X {telemetry.player.x.toFixed(1)} · Y{' '}
              {telemetry.player.y.toFixed(1)}
            </span>
            <span className="text-[var(--accent-primary)]">
              HDG {telemetry.player.heading}°
            </span>
          </div>
        )}

        {/* Expandable WebSocket Config */}
        {showConfig && (
          <div className="space-y-2 border-t border-white/[0.07] pt-2">
            <div className="flex items-center gap-1.5">
              <GlassInput
                value={telemetry.wsUrl}
                onChange={(e) => telemetry.setWsUrl(e.target.value)}
                placeholder="ws://localhost:7777"
                aria-label="Endereço do WebSocket local"
                containerClassName="flex-1"
                className="h-8 font-mono text-[11px]"
              />
              {isLive || isConnecting ? (
                <NeonButton
                  size="sm"
                  variant="glass"
                  onClick={telemetry.disconnect}
                  leftIcon={<Unplug className="h-3 w-3" />}
                >
                  {t('telemetry.disconnect')}
                </NeonButton>
              ) : (
                <NeonButton
                  size="sm"
                  variant="primary"
                  onClick={telemetry.connect}
                  leftIcon={<Plug className="h-3 w-3" />}
                >
                  {t('telemetry.connect')}
                </NeonButton>
              )}
            </div>
            {telemetry.lastError && (
              <p className="text-[10px] text-rose-300">{telemetry.lastError}</p>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
