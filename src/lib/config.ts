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
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB padrão
  maxFiles: 1,
  
  // Timeouts
  whisperTimeout: 120000, // 120 segundos (2 minutos)
} as const;

export type Config = typeof config;
