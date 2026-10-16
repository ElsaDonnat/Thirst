// Renders the Thirst brand assets (icon + splash sources) from inline SVG.
// Re-run after design changes: node assets/make-assets.mjs && npx capacitor-assets generate
// The mark matches LogoMark in src/components/Logo.tsx (drawn on a 100x100 grid).
import sharp from "sharp";

const GRADIENT = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D4FE3"/>
      <stop offset="1" stop-color="#4527BD"/>
    </linearGradient>
  </defs>`;

const MARK = `
  <path d="M50 10 C50 10 41.5 22.5 41.5 27.5 a8.5 8.5 0 0 0 17 0 C58.5 22.5 50 10 50 10 Z" fill="#fff"/>
  <ellipse cx="50" cy="62" rx="27" ry="19" fill="#24106B" stroke="#fff" stroke-width="6"/>
  <path d="M36 74 Q36 65 50 65 Q64 65 64 74 V79 A14 14 0 0 1 36 79 Z" fill="#FF6F9C"/>
  <path d="M50 70 v11" stroke="#D9487A" stroke-width="2.5" stroke-linecap="round"/>`;

function svg(size, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${GRADIENT}${content}</svg>`;
}

const fill = (size) => `<rect width="${size}" height="${size}" fill="url(#bg)"/>`;
// Place the 100-unit mark centred, `span` px wide
const markAt = (center, span) =>
  `<g transform="translate(${center - span / 2} ${center - span / 2}) scale(${span / 100})">${MARK}</g>`;

const outputs = {
  "assets/icon.png": svg(1024, fill(1024) + markAt(512, 800)),
  "assets/icon-only.png": svg(1024, fill(1024) + markAt(512, 800)),
  // Adaptive icon: mark kept inside the ~62% safe zone, transparent background
  "assets/icon-foreground.png": svg(1024, markAt(512, 600)),
  "assets/icon-background.png": svg(1024, fill(1024)),
  "assets/splash.png": svg(2732, fill(2732) + markAt(1366, 900)),
  "assets/splash-dark.png": svg(2732, fill(2732) + markAt(1366, 900)),
};

for (const [file, content] of Object.entries(outputs)) {
  await sharp(Buffer.from(content)).png().toFile(file);
  console.log("wrote", file);
}
