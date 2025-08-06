'use server';
/**
 * @fileOverview A multilingual question answering AI agent.
 *
 * - multilingualAssistance - A function that handles the multilingual question answering process.
 * - MultilingualAssistanceInput - The input type for the multilingualAssistance function.
 * - MultilingualAssistanceOutput - The return type for the multilingualAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultilingualAssistanceInputSchema = z.object({
  question: z.string().describe('The question to be answered.'),
  languageCode: z
    .string()
    .describe(
      'The language code for the desired response language (e.g., hi-IN, ta-IN, te-IN).'
    ),
});
export type MultilingualAssistanceInput = z.infer<typeof MultilingualAssistanceInputSchema>;

const MultilingualAssistanceOutputSchema = z.object({
  answer: z.string().describe('The answer to the question in the specified language.'),
});
export type MultilingualAssistanceOutput = z.infer<typeof MultilingualAssistanceOutputSchema>;

export async function multilingualAssistance(
  input: MultilingualAssistanceInput
): Promise<MultilingualAssistanceOutput> {
  return multilingualAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multilingualAssistancePrompt',
  input: {schema: MultilingualAssistanceInputSchema},
  output: {schema: MultilingualAssistanceOutputSchema},
  prompt: `You are AgileAssist, a friendly and helpful assistant for college teachers.

  Your primary task is to answer the user's question.

  IMPORTANT: Analyze the user's question to determine the desired language for the response.
  - If the user explicitly asks for an answer in a specific language (e.g., "in Tamil", "in Hindi"), you MUST provide the answer in that language.
  - If no specific language is requested, answer in the same language the question was asked.

  User's Question: {{{question}}}

  Answer:`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const multilingualAssistanceFlow = ai.defineFlow(
  {
    name: 'multilingualAssistanceFlow',
    inputSchema: MultilingualAssistanceInputSchema,
    outputSchema: MultilingualAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
