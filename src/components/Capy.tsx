/**
 * Capy, the calm capybara shopping buddy riding in a shopping basket.
 * Original artwork drawn as SVG for Capy Shelf (side profile: long blunt snout,
 * eyes and ears high on the head, an orange balanced on top because nothing bothers Capy).
 */
export type CapyMood = "calm" | "happy" | "thinking" | "skip";

export function Capy({
  mood = "calm",
  size = 160,
  title = "Capy the capybara, sitting calmly in a shopping basket",
  className,
}: {
  mood?: CapyMood;
  size?: number;
  title?: string;
  className?: string;
}) {
  const fur = "#a0714f";
  const furDark = "#7c5236";
  const snout = "#b98a62";
  const ink = "#2b1c12";
  const basket = "#d9a441";
  const basketDark = "#a8761f";
  const eyesClosed = mood === "calm" || mood === "happy";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* basket handles (behind) */}
      <path d="M36 132 C 26 96, 62 84, 70 108" fill="none" stroke={basketDark} strokeWidth="7" strokeLinecap="round" />
      <path d="M164 132 C 174 96, 138 84, 130 108" fill="none" stroke={basketDark} strokeWidth="7" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="88" cy="124" rx="62" ry="34" fill={furDark} />
      <ellipse cx="80" cy="112" rx="40" ry="16" fill={fur} opacity="0.45" />
      {/* head: long, blocky, blunt snout */}
      <path
        d="M70 76 C 70 50, 92 38, 118 39 L 150 42 C 169 44, 179 57, 178 74 L 177 92 C 176 105, 166 112, 152 112 L 110 112 C 86 112, 70 98, 70 82 Z"
        fill={fur}
      />
      {/* lighter muzzle */}
      <path d="M146 60 C 166 58, 178 68, 177 84 L 176 94 C 175 106, 165 112, 152 112 L 140 112 C 132 98, 132 72, 146 60 Z" fill={snout} />
      {/* ear */}
      <ellipse cx="88" cy="45" rx="10" ry="8" fill={furDark} />
      <ellipse cx="89" cy="46" rx="5" ry="4" fill="#5c3b24" />
      {/* orange on head */}
      <circle cx="116" cy="29" r="12" fill="#f29b38" />
      <path d="M116 18 C 120 11, 129 11, 132 15 C 126 18, 121 19, 116 18 Z" fill="#4f8a4b" />
      <circle cx="112" cy="25" r="2.5" fill="#f7b968" />
      {/* eye */}
      {eyesClosed ? (
        <path d="M112 62 Q 119 68 126 62" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="119" cy="61" rx="4" ry="5" fill={ink} />
          <circle cx="120.5" cy="59" r="1.3" fill="#fff" />
        </>
      )}
      {mood === "thinking" && <path d="M110 50 L 128 48" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {/* nostril */}
      <ellipse cx="169" cy="67" rx="3.4" ry="2.2" fill={ink} transform="rotate(-20 169 67)" />
      {/* cheek */}
      <circle cx="134" cy="84" r="7" fill="#e58f7a" opacity={mood === "happy" ? 0.55 : 0.3} />
      {/* mouth */}
      {mood === "happy" && <path d="M154 98 Q 163 106 172 97" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {mood === "calm" && <path d="M158 100 Q 165 103 171 99" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {mood === "thinking" && <path d="M158 101 L 171 99" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {mood === "skip" && <path d="M158 103 Q 165 98 171 102" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {/* front paw on the rim */}
      <ellipse cx="142" cy="128" rx="13" ry="7" fill={furDark} />
      {/* basket */}
      <path d="M28 132 H172 L160 188 H40 Z" fill={basket} />
      <path d="M28 132 H172" stroke={basketDark} strokeWidth="6" strokeLinecap="round" />
      <path d="M34 152 H166 M37 170 H163" stroke={basketDark} strokeWidth="3" opacity="0.7" />
      <path d="M60 134 L64 186 M86 134 L88 186 M114 134 L112 186 M140 134 L136 186" stroke={basketDark} strokeWidth="3" opacity="0.7" />
      {mood === "happy" && <path d="M182 40 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#f2c94c" />}
      {mood === "skip" && (
        <g>
          <circle cx="182" cy="36" r="13" fill="#fff" stroke="#b3261e" strokeWidth="3" />
          <path d="M174 44 L190 28" stroke="#b3261e" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {mood === "thinking" && (
        <text x="180" y="46" fontSize="26" fontWeight="800" fill={ink} fontFamily="sans-serif">
          ?
        </text>
      )}
    </svg>
  );
}
