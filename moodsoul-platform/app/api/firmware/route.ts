import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// CONFIGURATION
const LATEST_VERSION = "1.1";
// In a real app, this file would be uploaded by an admin. 
// For now, we assume it's placed manually in public/firmware.bin
const FIRMWARE_FILENAME = 'firmware.bin'; 

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currentVersion = searchParams.get('current_version');

  console.log(`[OTA] Device checking update. Current: ${currentVersion}, Server: ${LATEST_VERSION}`);

  // 1. Check Version
  if (currentVersion === LATEST_VERSION) {
    return new NextResponse(null, { status: 304 }); // Not Modified
  }

  // 2. Locate Firmware File
  const firmwarePath = path.join(process.cwd(), 'public', FIRMWARE_FILENAME);

  if (!fs.existsSync(firmwarePath)) {
    console.error(`[OTA] Firmware file not found at ${firmwarePath}`);
    return NextResponse.json(
      { error: "Firmware binary not found on server" }, 
      { status: 404 }
    );
  }

  // 3. Serve File
  try {
    const fileBuffer = fs.readFileSync(firmwarePath);
    const stats = fs.statSync(firmwarePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="moodsoul_v${LATEST_VERSION}.bin"`);
    headers.set('Content-Length', stats.size.toString());
    headers.set('X-Firmware-Version', LATEST_VERSION);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error("[OTA] Error reading firmware file:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
