import { configDotenv } from 'dotenv';

configDotenv();

export const config = {
  // Server
  port: Number(process.env.PORT || 3333),
  host: '0.0.0.0',
  
  // Whisper
  whisperBin: process.env.WHISPER_BIN || 'whisper-ctranslate2',
  fallbackBin: 'whisper',
  model: process.env.WHISPER_MODEL || 'base',
  language: process.env.WHISPER_LANG || '', // 'pt' ou '' (auto)
  
  // Upload limits
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 1,
  
  // Timeouts
  whisperTimeout: 30000, // 30 segundos
} as const;

export type Config = typeof config;
