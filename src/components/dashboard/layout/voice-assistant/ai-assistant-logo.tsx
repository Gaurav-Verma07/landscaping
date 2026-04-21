import { cn } from "@/lib/utils"

type AiAssistantLogoProps = {
  className?: string
}

export function AiAssistantLogo({ className }: AiAssistantLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Siri orb"
      className={cn(className)}
      fill="none"
    >
      <defs>
        <linearGradient id="orb-stroke" x1="8" y1="10" x2="56" y2="56">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="orb-wisp-stroke" x1="6" y1="20" x2="58" y2="44">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="orb-core" cx="32" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="orb-glow" cx="32" cy="32" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <filter id="orb-wisp" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
        <filter id="orb-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#orb-glow)" filter="url(#orb-soft)" />
      <circle cx="32" cy="32" r="22" fill="url(#orb-core)" />
      <circle cx="32" cy="32" r="25.5" stroke="url(#orb-stroke)" strokeWidth="2.4" opacity="0.85" />
      <circle cx="32" cy="32" r="23.5" stroke="url(#orb-stroke)" strokeWidth="1.2" opacity="0.65" filter="url(#orb-blur)" />
      <path
        d="M12 30c6-11 20-16 32-10 9 4 13 14 8 23-4 9-17 13-27 8-9-4-13-12-13-21z"
        stroke="url(#orb-wisp-stroke)"
        strokeWidth="1.8"
        opacity="0.55"
        filter="url(#orb-wisp)"
        fill="none"
      />
      <path
        d="M16 22c5-7 17-10 26-5 7 4 9 11 5 17-3 6-13 9-20 6-7-3-11-8-11-18z"
        stroke="url(#orb-wisp-stroke)"
        strokeWidth="1.2"
        opacity="0.4"
        filter="url(#orb-wisp)"
        fill="none"
      />
      <path
        d="M20 40c3 6 12 10 20 8 7-2 10-8 8-14-2-7-10-10-17-9-7 1-11 6-11 15z"
        stroke="url(#orb-wisp-stroke)"
        strokeWidth="1.1"
        opacity="0.35"
        filter="url(#orb-wisp)"
        fill="none"
      />
    </svg>
  )
}
