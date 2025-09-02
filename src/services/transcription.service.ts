import { promises as fs } from 'node:fs';
import { config } from '../lib/config.js';
import { FileService } from '../services/file.service.js';
import { WhisperService } from '../services/whisper.service.js';
import type { FileUpload, TranscriptionResponse } from '../types/index.js';

export class TranscriptionService {
  private fileService: FileService;
  private whisperService: WhisperService;

  constructor() {
    this.fileService = new FileService();
    this.whisperService = new WhisperService();
  }

  /**
   * Processa a transcrição completa de um arquivo
   */
  async transcribeFile(fileUpload: FileUpload): Promise<TranscriptionResponse> {
    let tmpPath: string | null = null;

    try {
      // 1. Processar e salvar o arquivo
      tmpPath = await this.fileService.processUploadedFile(fileUpload);

      // 2. Executar transcrição com timeout
      const result = await this.executeWithTimeout(tmpPath);

      // 3. Ler e processar resultado
      const transcription = await this.processTranscriptionResult(result.jsonPath);

      return transcription;

    } finally {
      // 4. Limpeza
      if (tmpPath) {
        await this.fileService.cleanup(tmpPath);
      }
    }
  }

  /**
   * Executa a transcrição com timeout
   */
  private async executeWithTimeout(filePath: string) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout de ${config.whisperTimeout / 1000}s no processamento`)),
        config.whisperTimeout
      );
    });

    return Promise.race([
      this.whisperService.transcribe(filePath),
      timeoutPromise
    ]) as Promise<{ jsonPath: string; outDir: string }>;
  }

  /**
   * Processa o resultado da transcrição
   */
  private async processTranscriptionResult(jsonPath: string): Promise<TranscriptionResponse> {
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(raw);

      console.log('TranscriptionService: Transcrição processada com sucesso');

      return {
        text: (data.text || '').trim(),
        segments: data.segments || []
      };

    } catch (error) {
      throw new Error(`Erro ao processar resultado da transcrição: ${error}`);
    }
  }
}
