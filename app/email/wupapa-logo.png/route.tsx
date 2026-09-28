import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

/** Почтовики не показывают SVG — отдаём PNG 2× (в письме 148×20). */
const WIDTH = 888;
const HEIGHT = 120;

export async function GET() {
  const svg = await readFile(join(process.cwd(), 'public/images/wupapa-logo.svg'));
  const src = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={WIDTH} height={HEIGHT} alt="" />
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
