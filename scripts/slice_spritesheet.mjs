#!/usr/bin/env node
// Recorta la hoja de Mini Marie (public/assets/avatar/avatar_sheet.png,
// copia intacta de "MINI MARIE.png") en frame_1..6.png con alfa + atlas.json.
// Uso: node scripts/slice_spritesheet.mjs
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { computeAnchor } from './sprite/anchor.mjs';
import { estimateBackground } from './sprite/color.mjs';
import { labelComponents } from './sprite/components.mjs';
import { cutFrame } from './sprite/frame.mjs';
import { buildMasks, findShadowBand, removeShadow } from './sprite/mask.mjs';
import { groupPoses } from './sprite/poses.mjs';

const STATES = ['idle_1', 'idle_2', 'walk_left', 'walk_right', 'wave', 'jump'];
const MIN_POSE_AREA = 2000;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const avatarDir = join(root, 'public', 'assets', 'avatar');
const sheetPath = join(avatarDir, 'avatar_sheet.png');

async function main() {
  const { data, info } = await sharp(sheetPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = estimateBackground(data, W, H);
  const { fg, magenta } = buildMasks(data, W, H, bg);
  const shadow = findShadowBand(fg, magenta, W, H);
  const shadowRemoved = removeShadow(data, fg, W, H, shadow);
  const groundY = shadow.minY;

  const { labels, comps } = labelComponents(fg, W, H);
  const large = comps.filter((c) => c.area >= MIN_POSE_AREA);
  if (large.length < STATES.length) {
    throw new Error(`Solo ${large.length} componentes ≥ ${MIN_POSE_AREA} px`);
  }
  const poses = groupPoses(comps, STATES.length);

  const frames = [];
  for (const [i, pose] of poses.entries()) {
    const cut = cutFrame(data, labels, W, H, pose, bg);
    const anchor = computeAnchor(cut.inPose, cut.w, cut.h, cut.y, groundY);
    const file = `frame_${i + 1}.png`;
    await sharp(Buffer.from(cut.rgba), { raw: { width: cut.w, height: cut.h, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(join(avatarDir, file));
    frames.push({
      file,
      state: STATES[i],
      x: cut.x,
      y: cut.y,
      w: cut.w,
      h: cut.h,
      ...anchor,
    });
    console.log(
      `${file} ${STATES[i]}: caja x ${pose.minX}–${pose.maxX}, y ${pose.minY}–${pose.maxY}; ` +
        `piezas ${pose.ids.length}; footX ${anchor.footX}; offsetY ${anchor.offsetY}; ` +
        `despill ${cut.despilled}, descartados ${cut.dropped}`,
    );
  }

  const atlas = {
    source: 'avatar_sheet.png',
    sheet: { width: W, height: H },
    background: bg,
    groundY,
    shadow: { minX: shadow.minX, maxX: shadow.maxX, minY: shadow.minY, maxY: shadow.maxY },
    frames,
  };
  const atlasJson = `${JSON.stringify(atlas, null, 2)}\n`;
  await writeFile(join(avatarDir, 'atlas.json'), atlasJson);
  // Copia para el código (Vite no importa desde public/): AvatarSprite la usa síncrona.
  await writeFile(join(root, 'src', 'components', 'avatar', 'atlas.json'), atlasJson);
  console.log(
    `Fondo rgb(${bg.join(',')}); sombra x ${shadow.minX}–${shadow.maxX}, ` +
      `y ${shadow.minY}–${shadow.maxY} (${shadowRemoved} px oscuros quitados); ` +
      `componentes ≥ ${MIN_POSE_AREA} px: ${large.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
