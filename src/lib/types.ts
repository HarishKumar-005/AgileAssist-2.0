export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audio?: string;
  language?: string;
  isWelcome?: boolean; // Flag to identify the initial welcome message
}
