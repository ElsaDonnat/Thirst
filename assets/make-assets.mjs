// Renders the Thirst icon and splash sources.
// Re-run after design changes:
//   node assets/make-assets.mjs && npx capacitor-assets generate --android --ios
// Icon: the raised beer mug artwork (assets/logo-source.jpg).
// Splash: the mascot (src/assets/mascot.webp) on the app's cream.
import sharp from "sharp";

const CREAM = "#FFFAEF";
const LOGO_CREAM = { r: 254, g: 248, b: 236 };

/**
 * The logo artwork comes with its own rounded corners on white. Phones apply
 * their own icon mask, so the art has to fill the square: the white corners
 * are flood-filled with the artwork's cream.
 */
async function fullBleedLogo() {
  const { data, info } = await sharp("assets/logo-source.jpg").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const isWhite = (i) => data[i] >= 246 && data[i + 1] >= 246 && data[i + 2] >= 246;
  const seen = new Uint8Array(width * height);
  const stack = [0, 0, width - 1, 0, 0, height - 1, width - 1, height - 1];
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const k = y * width + x;
    if (seen[k]) continue;
    seen[k] = 1;
    const i = k * channels;
    if (!isWhite(i)) continue;
    data[i] = LOGO_CREAM.r;
    data[i + 1] = LOGO_CREAM.g;
    data[i + 2] = LOGO_CREAM.b;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

const logo = await fullBleedLogo();

// iOS and legacy Android: the full square, the system rounds the corners
for (const file of ["assets/icon.png", "assets/icon-only.png"]) {
  await sharp(logo).resize(1024, 1024).png().toFile(file);
  console.log("wrote", file);
}

// Android adaptive icon: launchers show roughly the middle two thirds and may
// mask it to a circle, so the art is scaled down a little over a cream layer
const inner = await sharp(logo).resize(840, 840).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { ...LOGO_CREAM, alpha: 0 } } })
  .composite([{ input: inner, gravity: "centre" }])
  .png()
  .toFile("assets/icon-foreground.png");
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { ...LOGO_CREAM, alpha: 1 } } })
  .png()
  .toFile("assets/icon-background.png");
console.log("wrote assets/icon-foreground.png, assets/icon-background.png");

// The same art for use inside the app
await sharp(logo).resize(384, 384).webp({ quality: 88 }).toFile("src/assets/logo.webp");
console.log("wrote src/assets/logo.webp");

// Splash: the mascot centred on cream, about 40% of the screen height
const mascot = await sharp("src/assets/mascot.webp").resize({ height: 1100 }).png().toBuffer();
for (const file of ["assets/splash.png", "assets/splash-dark.png"]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: CREAM } })
    .composite([{ input: mascot, gravity: "centre" }])
    .png()
    .toFile(file);
  console.log("wrote", file);
}
