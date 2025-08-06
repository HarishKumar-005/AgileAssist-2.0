import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return NextResponse.json({ status: 'ok' });
  } else {
    return NextResponse.json(
      { status: 'error', message: 'GEMINI_API_KEY is not configured.' },
      { status: 500 }
    );
  }
}
