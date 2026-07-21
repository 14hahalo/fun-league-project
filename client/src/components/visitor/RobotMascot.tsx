import { useId } from 'react';

interface RobotMascotProps {
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

export const RobotMascot = ({ className = 'w-8 h-8', animated = true, glow = false }: RobotMascotProps) => {
  const uid = useId();
  const gradientId = `robot-gradient-${uid}`;
  const coreGlowId = `robot-core-glow-${uid}`;
  const bgGlowId = `robot-bg-glow-${uid}`;
  const ink = '#1a0b2e';

  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id={coreGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f0abfc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={bgGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {glow && <circle cx="32" cy="34" r="32" fill={`url(#${bgGlowId})`} />}

      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-1.5; 0,0"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        )}

        {/* antenna */}
        <line x1="32" y1="3" x2="32" y2="11" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="3" r="3.5" fill={`url(#${gradientId})`} stroke={ink} strokeWidth="1.5">
          {animated && <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />}
        </circle>

        {/* ear lights */}
        <circle cx="9" cy="24" r="2.6" fill="#22d3ee" stroke={ink} strokeWidth="1">
          {animated && <animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite" />}
        </circle>
        <circle cx="55" cy="24" r="2.6" fill="#22d3ee" stroke={ink} strokeWidth="1">
          {animated && <animate attributeName="opacity" values="0.25;1;0.25" dur="1.2s" repeatCount="indefinite" />}
        </circle>

        {/* arms */}
        <circle cx="10" cy="46" r="4.5" fill={`url(#${gradientId})`} stroke={ink} strokeWidth="2" />
        <circle cx="54" cy="46" r="4.5" fill={`url(#${gradientId})`} stroke={ink} strokeWidth="2" />

        {/* head - blobby capsule, no hard corners */}
        <rect x="13" y="9" width="38" height="30" rx="15" fill={`url(#${gradientId})`} stroke={ink} strokeWidth="2.5" />

        {/* eyes */}
        <g>
          <ellipse cx="24" cy="24" rx="4.2" ry="5.2" fill="#fff" stroke={ink} strokeWidth="1.2">
            {animated && (
              <animate
                attributeName="ry"
                values="5.2;5.2;0.6;5.2;5.2"
                keyTimes="0;0.85;0.9;0.95;1"
                dur="3.5s"
                repeatCount="indefinite"
              />
            )}
          </ellipse>
          <circle cx="25" cy="25" r="2" fill={ink} />

          <ellipse cx="40" cy="24" rx="4.2" ry="5.2" fill="#fff" stroke={ink} strokeWidth="1.2">
            {animated && (
              <animate
                attributeName="ry"
                values="5.2;5.2;0.6;5.2;5.2"
                keyTimes="0;0.85;0.9;0.95;1"
                dur="3.5s"
                repeatCount="indefinite"
              />
            )}
          </ellipse>
          <circle cx="41" cy="25" r="2" fill={ink} />
        </g>

        {/* smile */}
        <path d="M23 33 Q32 39 41 33" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />

        {/* body - blobby capsule */}
        <rect x="15" y="38" width="34" height="21" rx="10.5" fill={`url(#${gradientId})`} stroke={ink} strokeWidth="2.5" />

        {/* chest core */}
        <circle cx="32" cy="48" r="8.5" fill={`url(#${coreGlowId})`} />
        <circle cx="32" cy="48" r="4" fill="#fff" stroke={ink} strokeWidth="1.5">
          {animated && <animate attributeName="r" values="4;4.7;4" dur="1.8s" repeatCount="indefinite" />}
        </circle>
      </g>
    </svg>
  );
};
