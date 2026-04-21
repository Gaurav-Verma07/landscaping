import { getSignedUrl } from '@/lib/elevenlabs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = await getSignedUrl();
    return NextResponse.json({ signedUrl: url });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to get signed URL', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
