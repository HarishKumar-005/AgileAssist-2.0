'use server';

/**
 * @fileOverview Text-to-speech flow for AgileAssist to provide audio feedback for answers.
 *
 * - textToSpeech - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  languageCode: z.string().describe('The language code for the desired language (e.g., en-US, hi-IN).'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe('The base64-encoded data URI of the audio in WAV format.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// Map language codes to specific, high-quality voices.
const getVoiceForLanguage = (languageCode: string): string => {
  switch (languageCode) {
    case 'hi-IN':
      return 'en-IN-Wavenet-A'; // A common voice for Indian English, often supports Hindi
    case 'ta-IN':
      return 'ta-IN-Wavenet-A';
    case 'te-IN':
      return 'te-IN-Standard-A';
    case 'en-US':
    default:
      return 'en-US-News-K'; // A clear, standard English voice
  }
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    // Note: The gemini-2.5-flash-preview-tts model does not officially support voice selection yet.
    // The underlying speech API it uses, however, does. We are providing the voice name here
    // for future compatibility and in case the model passes it through.
    // The primary way language is handled is via the text content itself.
    const voiceName = getVoiceForLanguage(input.languageCode);

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Although not officially documented for this model, we pass the desired voice.
            // The model is trained to recognize the language from the prompt text.
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
