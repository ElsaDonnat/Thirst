// Cuts the mascot out of its flat cream background and writes a small
// transparent WebP for the app. Re-run if the source image changes:
//   node assets/make-mascot.mjs "<path to source image>"
import sharp from "sharp";

const source = process.argv[2] ?? "assets/mascot-source.jpg";
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const px = (x, y) => (y * width + x) * 4;

// Background colour, averaged from the four corners
const corners = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3)];
const bg = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + data[i + c], 0) / corners.length);
const distance = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c] - bg[c])));

// Flood fill from the edges through anything close to the background colour,
// so cream areas inside the drawing (inside outlines) are kept
const HARD = 18; // definitely background
const SOFT = 60; // anti-aliased edge: partly transparent
const seen = new Uint8Array(width * height);
const stack = [];
for (let x = 0; x < width; x++) stack.push(x, 0, x, height - 1);
for (let y = 0; y < height; y++) stack.push(0, y, width - 1, y);
while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  if (x < 0 || y < 0 || x >= width || y >= height) continue;
  const k = y * width + x;
  if (seen[k]) continue;
  seen[k] = 1;
  const i = k * 4;
  const d = distance(i);
  if (d > SOFT) continue;
  data[i + 3] = d <= HARD ? 0 : Math.round(((d - HARD) / (SOFT - HARD)) * 255);
  if (d <= HARD) stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// Enclosed bits of background (inside a bent arm, between the legs) are left
// as is: they match the beer foam exactly, so the app uses this same cream
// (#FFFAEF) as its background and they blend in.
await sharp(data, { raw: { width, height, channels: 4 } })
  .trim({ threshold: 1 })
  .resize({ height: 900, withoutEnlargement: true })
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile("src/assets/mascot.webp");
console.log("wrote src/assets/mascot.webp, background was", bg.map(Math.round));
