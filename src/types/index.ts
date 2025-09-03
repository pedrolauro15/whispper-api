export interface WhisperResult {
  jsonPath: string;
  outDir: string;
}

export interface TranscriptionResponse {
  text: string;
  segments: Array<{
    id?: number;
    seek?: number;
    start?: number;
    end?: number;
    text?: string;
    tokens?: number[];
    temperature?: number;
    avg_logprob?: number;
    compression_ratio?: number;
    no_speech_prob?: number;
  }>;
}

export interface VideoWithSubtitlesResponse {
  transcription: TranscriptionResponse | null;
  videoBuffer: Buffer | null;
  videoPath: string | null;
  subtitlesPath: string | null;
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}

export interface FileUpload {
  filename?: string;
  mimetype?: string;
  encoding?: string;
  toBuffer(): Promise<Buffer>;
}

export interface TranscriptionContext {
  prompt?: string;
  vocabulary?: string[];
  topic?: string;
  speaker?: string;
  language?: string;
}

export interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  segments?: Array<{
    id?: number;
    start?: number;
    end?: number;
    originalText?: string;
    translatedText?: string;
  }>;
}
