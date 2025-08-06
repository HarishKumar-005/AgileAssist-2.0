# **App Name**: AgileAssist

## Core Features:

- Chat History Display: Display a chat history of questions and answers, with user questions on the right and AI answers on the left. The display updates in real-time with new user questions, smooth scrolling, and is readable in both light and dark modes.
- Microphone Input: A prominent, stateful microphone button at the bottom center for voice input. The states include 'idle', 'listening', and 'loading,' with visual feedback, including icons from the lucide-react library for each.
- Multilingual Support: Language selection dropdown enabling multilingual support via a custom LanguageSelector component using icons. Options for English, Hindi, Tamil and Telugu with corresponding flags are included.
- Question Answering AI: Answer user questions using a Genkit flow, which employs the gemini-2.0-flash model and is presented as 'AgileAssist'.
- Text-to-Speech Generation: Generate audio from text using the gemini-2.5-flash-preview-tts model to create verbal responses and is exposed as a tool. Raw output is converted to base64-encoded data URIs.
- Audio Playback: Simple playback functionality via a Play/Pause AudioPlayer component.
- Configuration Verification: A health check endpoint verifies that the GEMINI_API_KEY environment variable is set to indicate configuration status.

## Style Guidelines:

- Primary color: Indigo (#4B0082) to convey professionalism and intellect.
- Background color: Light gray (#F0F0F0) to ensure readability and a modern, clean aesthetic.
- Accent color: Sky blue (#87CEEB) for interactive elements and highlights.
- Font: 'PT Sans' (sans-serif) for both headlines and body text for readability and accessibility.
- Lucide React's BrainCircuit icon for the logo, User and Sparkles for avatars, Mic/MicOff/LoaderCircle for the MicButton.
- Modern, clean card-based layout, with a focus on readability and a seamless user experience. Prominent microphone button centered at the bottom.
- Subtle animations during state transitions of UI components such as loading, listening, etc. Scroll chat smoothly to new messages as they come in.