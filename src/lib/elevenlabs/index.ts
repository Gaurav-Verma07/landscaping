/**
 * ElevenLabs Module
 * 
 * This module provides utilities for integrating ElevenLabs Conversational AI
 * into your Next.js application.
 * 
 * ## Client-Side Usage
 * Import from '@/lib/elevenlabs/client' for browser-side code
 * 
 * ## Server-Side Usage
 * Import from '@/lib/elevenlabs/server' for API routes and server components
 * 
 * ## Configuration
 * Import from '@/lib/elevenlabs/config' for constants and types
 */

// Re-export client utilities
export { fetchConversationToken, fetchSignedUrl, getAgentId } from './client';

// Re-export configuration and constants
export {
  ELEVENLABS_MODELS,
  DEFAULT_VOICE_MODEL,
  ELEVENLABS_VOICES,
  DEFAULT_VOICE_ID,
  DEFAULT_VOICE_SETTINGS,
  AUDIO_FORMATS,
  ELEVENLABS_ENDPOINTS,
  getConvAIAgentId,
  type ConvAIConfig,
  type VoiceSettings,
  type ElevenLabsVoice,
  type ElevenLabsUser,
  type TextToSpeechOptions,
} from './config';

// Note: server utilities are NOT re-exported here to prevent accidental client-side usage
// Import them directly from './server' when needed in server-side code
