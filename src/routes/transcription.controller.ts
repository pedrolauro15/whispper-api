import type { FastifyRequest, FastifyReply } from 'fastify';
import { TranscriptionService } from '../services/transcription.service.js';
import type { ErrorResponse, FileUpload } from '../types/index.js';

export class TranscriptionController {
  private transcriptionService: TranscriptionService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
  }

  /**
   * Handler para o endpoint de transcrição
   */
  async transcribe(req: FastifyRequest, reply: FastifyReply) {
    try {
      req.log.info('TranscriptionController: Iniciando transcrição');

      // Obter arquivo do multipart
      const fileUpload = await (req as any).file() as FileUpload;

      if (!fileUpload) {
        return reply.code(400).send({
          error: 'Nenhum arquivo enviado'
        } as ErrorResponse);
      }

      req.log.info(`TranscriptionController: Arquivo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);

      // Validar tipo de arquivo
      if (!this.isValidAudioFile(fileUpload)) {
        return reply.code(400).send({
          error: 'Tipo de arquivo inválido. Envie um arquivo de áudio ou vídeo.',
          detail: `Tipo recebido: ${fileUpload.mimetype}`
        } as ErrorResponse);
      }

      // Processar transcrição
      const result = await this.transcriptionService.transcribeFile(fileUpload);

      req.log.info('TranscriptionController: Transcrição concluída');
      return reply.send(result);

    } catch (error: any) {
      req.log.error(`TranscriptionController: Erro na transcrição - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha na transcrição',
        detail: error?.message
      } as ErrorResponse);
    }
  }

  /**
   * Valida se o arquivo é um tipo de áudio/vídeo suportado
   */
  private isValidAudioFile(fileUpload: FileUpload): boolean {
    const mimetype = fileUpload.mimetype;
    
    if (!mimetype) return false;

    return mimetype.startsWith('audio/') || mimetype.startsWith('video/');
  }
}
