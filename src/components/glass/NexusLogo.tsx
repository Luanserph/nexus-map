export interface NexusLogoProps {
  className?: string;
}

/**
 * Authorial Nexus Maps emblem: hexagonal tactical compass + cartographic pin.
 * Consumes --accent-primary and --accent-glow dynamically.
 */
export function NexusLogo({ className = 'h-5 w-5' }: NexusLogoProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Outer architectural hexagon */}
      <path
        d="M18 2.5L31.4 10.25V25.75L18 33.5L4.6 25.75V10.25L18 2.5Z"
        stroke="var(--accent-primary)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--accent-primary) 10%, transparent)"
      />
      {/* Cardinal crosshair ticks */}
      <path
        d="M18 5.8V9.2M18 26.8V30.2M7.5 18H10.8M25.2 18H28.5"
        stroke="var(--accent-primary)"
        strokeOpacity="0.6"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Stylized cartographic diamond / compass needle */}
      <path
        d="M18 9.8L23.2 18L18 26.2L12.8 18L18 9.8Z"
        stroke="var(--accent-primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="color-mix(in srgb, var(--accent-primary) 20%, transparent)"
      />
      {/* Center precision pin core */}
      <circle cx="18" cy="18" r="2.4" fill="var(--accent-primary)" />
    </svg>
  );
}
