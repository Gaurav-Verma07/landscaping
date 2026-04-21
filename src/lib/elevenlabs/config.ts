/** ElevenLabs config, constants, types. */

export const ELEVENLABS_MODELS = {
  MULTILINGUAL_V2: "eleven_multilingual_v2",
  MULTILINGUAL_V1: "eleven_multilingual_v1",
  MONOLINGUAL_V1: "eleven_monolingual_v1",
  TURBO_V2: "eleven_turbo_v2",
  TURBO_V2_5: "eleven_turbo_v2_5",
  FLASH_V2: "eleven_flash_v2",
} as const;

export const DEFAULT_VOICE_MODEL = ELEVENLABS_MODELS.MULTILINGUAL_V2;

export const ELEVENLABS_VOICES = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  DOMI: "AZnzlk1XvdvUeBnXmlld",
  BELLA: "EXAVITQu4vr4xnSDxMaL",
  ANTONI: "ErXwobaYiN019PkySvjV",
  ELLI: "MF3mGyEYCl7XYWbV9V6O",
  JOSH: "TxGEqnHWrfWFTfGW9XjX",
  ARNOLD: "VR6AewLTigWG4xSOukaG",
  ADAM: "pNInz6obpgDQGcFmaJgB",
  SAM: "yoZ06aMxZJJ28mfd3POQ",
} as const;

export const DEFAULT_VOICE_ID = ELEVENLABS_VOICES.RACHEL;

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

export const AUDIO_FORMATS = {
  MP3_44100_128: "mp3_44100_128",
  MP3_44100_192: "mp3_44100_192",
  PCM_16000: "pcm_16000",
  PCM_22050: "pcm_22050",
  PCM_24000: "pcm_24000",
  PCM_44100: "pcm_44100",
  ULAW_8000: "ulaw_8000",
} as const;

export const ELEVENLABS_ENDPOINTS = {
  TEXT_TO_SPEECH: "/v1/text-to-speech",
  VOICES: "/v1/voices",
  USER: "/v1/user",
  MODELS: "/v1/models",
  HISTORY: "/v1/history",
  VOICE_GENERATION: "/v1/voice-generation",
} as const;

export interface ConvAIConfig {
  agentId: string;
  avatarUrl?: string;
  customStyles?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const FALLBACK_AID = "agent_7101kb4mp5daf74anmw887vthzbr";

export function getConvAIAgentId(): string {
  const aid = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  if (!aid) {
    console.warn('NEXT_PUBLIC_ELEVENLABS_AGENT_ID not set. Using default.');
    return FALLBACK_AID;
  }
  return aid;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  settings?: VoiceSettings;
}

export interface ElevenLabsUser {
  subscription: {
    tier: string;
    character_count: number;
    character_limit: number;
    can_extend_character_limit: boolean;
    next_character_count_reset_unix: number;
  };
}

export interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
  outputFormat?: string;
}
