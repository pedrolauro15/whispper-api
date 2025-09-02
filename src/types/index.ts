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
