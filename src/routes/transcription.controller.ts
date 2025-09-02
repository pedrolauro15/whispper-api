import type { FastifyReply, FastifyRequest } from 'fastify';
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
   * Handler para o endpoint de vídeo com legendas
   */
  async transcribeVideoWithSubtitles(req: FastifyRequest, reply: FastifyReply) {
    try {
      req.log.info('TranscriptionController: Iniciando geração de vídeo com legendas');

      // Obter arquivo do multipart
      const fileUpload = await (req as any).file() as FileUpload;

      if (!fileUpload) {
        return reply.code(400).send({
          error: 'Nenhum arquivo enviado'
        } as ErrorResponse);
      }

      // Validar que é um arquivo de vídeo
      if (!this.isValidVideoFile(fileUpload)) {
        return reply.code(400).send({
          error: 'Tipo de arquivo inválido. Envie um arquivo de vídeo.',
          detail: `Tipo recebido: ${fileUpload.mimetype}`
        } as ErrorResponse);
      }

      req.log.info(`TranscriptionController: Vídeo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);

      // Obter parâmetros da query
      const query = req.query as any;
      const hardcodedSubs = query.hardcoded !== 'false'; // Default: true
      
      // Estilo das legendas (se fornecido)
      const subtitleStyle = {
        fontName: query.fontName || 'Arial',
        fontSize: parseInt(query.fontSize) || 24,
        fontColor: query.fontColor || '#ffffff',
        backgroundColor: query.backgroundColor || '#000000',
        borderWidth: parseInt(query.borderWidth) || 2,
        borderColor: query.borderColor || '#000000'
      };

      // Processar vídeo com legendas
      const result = await this.transcriptionService.transcribeAndAddSubtitlesToVideo(
        fileUpload,
        subtitleStyle,
        hardcodedSubs
      );

      if (!result.success) {
        return reply.code(500).send({
          error: 'Falha ao gerar vídeo com legendas',
          detail: result.message
        } as ErrorResponse);
      }

      req.log.info('TranscriptionController: Vídeo com legendas gerado com sucesso');

      // Definir headers para download do vídeo
      const fileName = fileUpload.filename 
        ? fileUpload.filename.replace(/\.[^/.]+$/, '_with_subtitles.mp4')
        : 'video_with_subtitles.mp4';

      reply.header('Content-Type', 'video/mp4');
      reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Enviar o buffer do vídeo
      return reply.send(result.videoBuffer);

    } catch (error: any) {
      req.log.error(`TranscriptionController: Erro ao gerar vídeo com legendas - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha ao gerar vídeo com legendas',
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

  /**
   * Valida se o arquivo é um tipo de vídeo suportado
   */
  private isValidVideoFile(fileUpload: FileUpload): boolean {
    const mimetype = fileUpload.mimetype;
    
    if (!mimetype) return false;

    return mimetype.startsWith('video/');
  }
}
