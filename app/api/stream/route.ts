import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import getPort from 'get-port';
import path from 'path';

export async function POST(req: NextRequest) {
  const { magnet } = await req.json();
  if (!magnet || typeof magnet !== 'string') {
    return NextResponse.json({ error: 'Magnet link required' }, { status: 400 });
  }

  const port = await getPort();

  // Use node to spawn the main JS files directly (cross-platform)
  const peerflixMain = path.join(process.cwd(), 'node_modules', 'peerflix', 'app.js');
  const ltMain = path.join(process.cwd(), 'node_modules', 'localtunnel', 'bin', 'lt.js');

  const peerflix = spawn('node', [peerflixMain, magnet, '--port', port.toString()]);
  // Start LocalTunnel WITHOUT password
  const lt = spawn('node', [ltMain, '--port', port.toString()]);

  let url = '';
  let error = '';

  // Wait for LocalTunnel to print the public URL
  await new Promise((resolve, reject) => {
    lt.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/https?:\/\/[^\s]+/);
      if (match) {
        url = match[0];
        resolve(undefined);
      }
    });
    lt.stderr.on('data', (data) => {
      error += data.toString();
    });
    lt.on('error', (err) => {
      error += err.toString();
      reject(err);
    });
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Timeout waiting for LocalTunnel URL'));
    }, 10000);
  }).catch(() => {});

  if (!url) {
    return NextResponse.json({ error: 'Failed to start LocalTunnel', details: error }, { status: 500 });
  }

  return NextResponse.json({ url });
}