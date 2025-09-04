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
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024, // 200MB padrão
  maxFiles: 1,
  maxFieldSize: 10 * 1024 * 1024, // 10MB para campos de texto (segmentos traduzidos)
  maxFieldsSize: 20 * 1024 * 1024, // 20MB total para todos os campos
  
  // Timeouts
  whisperTimeout: 300000, // 300 segundos (5 minutos)
} as const;

export type Config = typeof config;
