/**
 * The Thirst mark: an open mouth with the tongue out and a drop about to
 * land in it. Drawn for a purple background. Keep in step with the icon
 * source in assets/make-assets.mjs.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M50 10 C50 10 41.5 22.5 41.5 27.5 a8.5 8.5 0 0 0 17 0 C58.5 22.5 50 10 50 10 Z" fill="#fff" />
      <ellipse cx="50" cy="62" rx="27" ry="19" fill="#24106B" stroke="#fff" strokeWidth="6" />
      <path d="M36 74 Q36 65 50 65 Q64 65 64 74 V79 A14 14 0 0 1 36 79 Z" fill="#FF6F9C" />
      <path d="M50 70 v11" stroke="#D9487A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** The mark on its purple tile, like the app icon */
export function LogoTile({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-[28%] bg-gradient-to-br from-[#6D4FE3] to-[#4527BD] shadow-lg ${className}`}>
      <LogoMark className="h-[78%] w-[78%]" />
    </div>
  );
}
