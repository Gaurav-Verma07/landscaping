import { getConversationToken } from '@/lib/elevenlabs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tok = await getConversationToken();
    return NextResponse.json({ token: tok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to get conversation token', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
