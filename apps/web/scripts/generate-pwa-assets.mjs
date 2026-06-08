// PWA asset generator. Run with: node scripts/generate-pwa-assets.mjs
// Source: public/mopd_fav.png (official MoPD circular emblem).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");
const favSource = join(publicDir, "mopd_fav.png");

// Brand palette (mirrors globals.css)
const BRAND = { r: 0x58, g: 0x87, b: 0x4b }; // #58874b primary
const WHITE = { r: 0xff, g: 0xff, b: 0xff };

/** Trim the square black canvas around the circular emblem. */
async function loadEmblem() {
  return sharp(favSource).trim({ threshold: 12 }).png().toBuffer();
}

async function contained(emblem, size, padRatio, background) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const emblemBuf = await sharp(emblem)
    .resize(inner, inner, { fit: "contain", background: { ...WHITE, alpha: 0 } })
    .toBuffer();
  const bg =
    background === "transparent"
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { ...background, alpha: 1 };
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  }).composite([{ input: emblemBuf, gravity: "center" }]);
}

async function run() {
  await mkdir(iconsDir, { recursive: true });
  const emblem = await loadEmblem();

  // Regular "any" icons — emblem on white (matches install prompt / home screen).
  await (await contained(emblem, 192, 0.08, WHITE))
    .png()
    .toFile(join(iconsDir, "icon-192.png"));
  await (await contained(emblem, 512, 0.08, WHITE))
    .png()
    .toFile(join(iconsDir, "icon-512.png"));

  // Maskable icons — brand green background, safe-zone padding (~18%).
  await (await contained(emblem, 192, 0.18, BRAND))
    .png()
    .toFile(join(iconsDir, "icon-maskable-192.png"));
  await (await contained(emblem, 512, 0.18, BRAND))
    .png()
    .toFile(join(iconsDir, "icon-maskable-512.png"));

  // Apple touch icon — white background (iOS applies its own corner radius).
  await (await contained(emblem, 180, 0.1, WHITE))
    .png()
    .toFile(join(iconsDir, "apple-touch-icon.png"));

  // Social share image — brand canvas + centered emblem.
  const ogEmblem = await sharp(emblem)
    .resize(400, 400, { fit: "contain", background: { ...WHITE, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { ...BRAND, alpha: 1 } },
  })
    .composite([{ input: ogEmblem, gravity: "center" }])
    .png()
    .toFile(join(publicDir, "og-image.png"));

  console.log("PWA assets generated from mopd_fav.png → public/icons/ and public/og-image.png");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
