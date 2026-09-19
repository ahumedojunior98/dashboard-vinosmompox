import { NextResponse } from "next/server";
import crypto from "crypto";

// GET /api/cloudinary-firma
// Firma los params de subida con CLOUDINARY_API_SECRET (SOLO servidor).
// El front usa esta firma para subir directo a Cloudinary sin exponer el secret.
export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const folder = "vino-mompox/productos";

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          "Faltan variables Cloudinary en .env.local: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET. Llénalas y reinicia con pnpm dev.",
      },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary firma: sha1("folder=...&timestamp=..." + apiSecret)
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
