import { NextResponse } from 'next/server';
import { multilingualAssistance } from '@/ai/flows/multilingual-support';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { answerQuestion } from '@/ai/flows/answer-question';

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Backend not configured: GEMINI_API_KEY is missing.' },
      { status: 500 }
    );
  }

  try {
    const { action, payload } = await req.json();

    switch (action) {
      case 'answerQuestion': {
        const result = await answerQuestion(payload);
        return NextResponse.json(result);
      }
      case 'multilingualAssistance': {
        const result = await multilingualAssistance(payload);
        return NextResponse.json(result);
      }
      case 'textToSpeech': {
        const result = await textToSpeech(payload);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
