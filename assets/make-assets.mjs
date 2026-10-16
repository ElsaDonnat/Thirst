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

// A thin dark outline around the icon's edge, in the same ink as the art
const INK = "#2B1712";

// Samsung One UI's icon mask (Android's config_icon_mask on a 100x100 grid),
// read from the phone; iOS icons use a very similar rounded square
const ICON_MASK = "M99,50C99,6.935,77.063,1,50,1C22.935,1,1,6.935,1,50c0,43.063,21.935,49,49,49C77.063,99,99,93.063,99,50z";

/**
 * The outline traced along the icon mask, placed over a `size` square at
 * `offset`. The mask cuts away the outer half of the stroke, so `visible` px
 * of ink remain along the edge.
 */
function outlineSvg(canvas, offset, size, visible) {
  const scale = size / 100;
  const strokeUnits = (visible * 2) / scale;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">` +
      `<g transform="translate(${offset} ${offset}) scale(${scale})">` +
      `<path d="${ICON_MASK}" fill="none" stroke="${INK}" stroke-width="${strokeUnits}"/></g></svg>`,
  );
}

// iOS and legacy Android: the full square with the outline along the edge the
// system rounds off. iOS corners are a rounded rect of about 22.4% radius,
// much squarer than Samsung's mask, so they get their own outline.
const iosOutline = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">` +
    `<rect x="0" y="0" width="1024" height="1024" rx="229" fill="none" stroke="${INK}" stroke-width="24"/></svg>`,
);
for (const file of ["assets/icon.png", "assets/icon-only.png"]) {
  await sharp(logo).resize(1024, 1024).composite([{ input: iosOutline }]).png().toFile(file);
  console.log("wrote", file);
}

// Android adaptive icon: @capacitor/assets wraps this layer in a 16.7% inset,
// so the whole 1024 image maps onto the visible icon area, which the launcher
// then cuts to its shape. The art fills it edge to edge and the outline traces
// Samsung's mask along the very edge (circle launchers like Pixel's clip its
// corners).
await sharp(logo)
  .resize(1024, 1024)
  .composite([{ input: outlineSvg(1024, 0, 1024, 10) }])
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
