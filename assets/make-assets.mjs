// Renders the Thirst brand assets (icon + splash sources) from inline SVG.
// Re-run after design changes: node assets/make-assets.mjs && npx capacitor-assets generate
import sharp from "sharp";

const GRADIENT = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D4FE3"/>
      <stop offset="1" stop-color="#4527BD"/>
    </linearGradient>
  </defs>`;

// White teardrop with a highlight, centered on a 1024 canvas
const DROP = `
  <path fill="#ffffff" d="M512 236 C512 236 318 518 318 642 A194 194 0 0 0 706 642 C706 518 512 236 512 236 Z"/>
  <circle cx="588" cy="418" r="34" fill="#ffffff" opacity="0.55"/>`;

function svg(size, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${GRADIENT}${content}</svg>`;
}

const fill = (size) => `<rect width="${size}" height="${size}" fill="url(#bg)"/>`;
const dropAt = (center, scale) => `<g transform="translate(${center} ${center}) scale(${scale}) translate(-512 -512)">${DROP}</g>`;

const outputs = {
  "assets/icon.png": svg(1024, fill(1024) + DROP),
  "assets/icon-only.png": svg(1024, fill(1024) + DROP),
  // Adaptive icon: drop shrunk into the ~62% safe zone, transparent background
  "assets/icon-foreground.png": svg(1024, dropAt(512, 0.62)),
  "assets/icon-background.png": svg(1024, fill(1024)),
  "assets/splash.png": svg(2732, fill(2732) + dropAt(1366, 1.1)),
  "assets/splash-dark.png": svg(2732, fill(2732) + dropAt(1366, 1.1)),
};

for (const [file, content] of Object.entries(outputs)) {
  await sharp(Buffer.from(content)).png().toFile(file);
  console.log("wrote", file);
}
