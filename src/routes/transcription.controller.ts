import type { FastifyReply, FastifyRequest } from 'fastify';
import { TranscriptionService } from '../services/transcription.service.js';
import type { ErrorResponse, FileUpload, TranscriptionContext } from '../types/index.js';

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

      // Extrair contexto dos campos do formulário (temporariamente desabilitado)
      // const context = await this.extractContextFromRequest(req);
      const context = undefined;

      // Processar transcrição
      const result = await this.transcriptionService.transcribeFile(fileUpload, context);

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

      // Extrair contexto dos campos do formulário (temporariamente desabilitado)
      // const context = await this.extractContextFromRequest(req);
      const context = undefined;

      // Obter parâmetros da query
      const query = req.query as any;
      const hardcodedSubs = query.hardcoded !== 'false'; // Default: true
      
      // Estilo das legendas (otimizado para tamanho compacto)
      const subtitleStyle = {
        fontName: query.fontName || 'Arial',
        fontSize: parseInt(query.fontSize) || 18, // Reduzido de 24 para 18
        fontColor: query.fontColor || '#ffffff',
        backgroundColor: query.backgroundColor || '#000000',
        borderWidth: parseInt(query.borderWidth) || 1, // Reduzido de 2 para 1
        borderColor: query.borderColor || '#000000',
        marginVertical: parseInt(query.marginVertical) || 20 // Margem menor
      };

      // Processar vídeo com legendas
      const result = await this.transcriptionService.transcribeAndAddSubtitlesToVideo(
        fileUpload,
        subtitleStyle,
        hardcodedSubs,
        context
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
   * Extrai contexto de transcrição dos campos do formulário multipart
   */
  private async extractContextFromRequest(req: FastifyRequest): Promise<TranscriptionContext | undefined> {
    try {
      const context: TranscriptionContext = {};
      let hasContext = false;

      // Iterar sobre os campos do formulário multipart
      const parts = (req as any).parts();
      
      for await (const part of parts) {
        if (part.type === 'field') {
          const fieldName = part.fieldname;
          const fieldValue = part.value;

          switch (fieldName) {
            case 'prompt':
              if (fieldValue && fieldValue.trim()) {
                context.prompt = fieldValue.trim();
                hasContext = true;
              }
              break;
            
            case 'vocabulary':
              if (fieldValue && fieldValue.trim()) {
                // Dividir por vírgulas e limpar espaços
                const vocabularyItems = fieldValue.split(',').map((v: string) => v.trim()).filter((v: string) => v);
                if (vocabularyItems.length > 0) {
                  context.vocabulary = vocabularyItems;
                  hasContext = true;
                }
              }
              break;
            
            case 'topic':
              if (fieldValue && fieldValue.trim()) {
                context.topic = fieldValue.trim();
                hasContext = true;
              }
              break;
            
            case 'speaker':
              if (fieldValue && fieldValue.trim()) {
                context.speaker = fieldValue.trim();
                hasContext = true;
              }
              break;
            
            case 'language':
              if (fieldValue && fieldValue.trim()) {
                context.language = fieldValue.trim();
                hasContext = true;
              }
              break;
          }
        }
      }

      if (hasContext) {
        req.log.info(`TranscriptionController: Contexto extraído: ${JSON.stringify(context)}`);
        return context;
      }

      return undefined;
    } catch (error) {
      req.log.warn(`TranscriptionController: Erro ao extrair contexto: ${String(error)}`);
      return undefined;
    }
  }

  /**
   * Valida se o arquivo é um tipo de vídeo suportado
   */
  private isValidVideoFile(fileUpload: FileUpload): boolean {
    const mimetype = fileUpload.mimetype;
    
    if (!mimetype) return false;

    return mimetype.startsWith('video/');
  }

  /**
   * Gera vídeo com legendas traduzidas (usa método existente otimizado)
   */
  async generateVideoWithTranslatedSubtitles(req: FastifyRequest, reply: FastifyReply) {
    try {
      req.log.info('TranscriptionController: Iniciando geração de vídeo com legendas traduzidas');

      let fileUpload: FileUpload | null = null;
      let translatedSegments: any[] | null = null;

      // Processar multipart para obter arquivo e segmentos traduzidos
      const parts = (req as any).parts();
      
      for await (const part of parts) {
        if (part.type === 'file' && !fileUpload) {
          fileUpload = part as FileUpload;
        } else if (part.type === 'field' && part.fieldname === 'translatedSegments') {
          try {
            translatedSegments = JSON.parse(part.value);
          } catch (error) {
            req.log.error(`Erro ao fazer parse dos segmentos traduzidos: ${error}`);
          }
        }
        
        // Sair do loop se já temos ambos
        if (fileUpload && translatedSegments) {
          break;
        }
      }

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

      if (!translatedSegments || !Array.isArray(translatedSegments) || translatedSegments.length === 0) {
        return reply.code(400).send({
          error: 'Segmentos traduzidos são obrigatórios',
          detail: 'O campo translatedSegments deve ser um array de segmentos traduzidos'
        } as ErrorResponse);
      }

      req.log.info(`TranscriptionController: Vídeo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);
      req.log.info(`TranscriptionController: ${translatedSegments.length} segmentos traduzidos recebidos`);

      // Obter parâmetros da query
      const query = req.query as any;
      const hardcodedSubs = query.hardcoded !== 'false'; // Default: true
      
      // Estilo das legendas (otimizado para tamanho compacto)
      const subtitleStyle = {
        fontName: query.fontName || 'Arial',
        fontSize: parseInt(query.fontSize) || 18, // Reduzido de 24 para 18
        fontColor: query.fontColor || '#ffffff',
        backgroundColor: query.backgroundColor || '#000000',
        borderWidth: parseInt(query.borderWidth) || 1, // Reduzido de 2 para 1
        borderColor: query.borderColor || '#000000',
        marginVertical: parseInt(query.marginVertical) || 20 // Margem menor
      };

      // Usar o método existente, mas passando os segmentos traduzidos
      const result = await this.transcriptionService.generateVideoFromExistingTranscription(
        fileUpload,
        { 
          text: translatedSegments.map(s => s.text).join(' '), 
          segments: translatedSegments 
        },
        subtitleStyle,
        hardcodedSubs
      );

      if (!result.success) {
        return reply.code(500).send({
          error: 'Falha ao gerar vídeo com legendas traduzidas',
          detail: result.message
        } as ErrorResponse);
      }

      req.log.info('TranscriptionController: Vídeo com legendas traduzidas gerado com sucesso');

      // Definir headers para download do vídeo
      const fileName = fileUpload.filename 
        ? fileUpload.filename.replace(/\.[^/.]+$/, '_with_translated_subtitles.mp4')
        : 'video_with_translated_subtitles.mp4';

      reply.header('Content-Type', 'video/mp4');
      reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Enviar o buffer do vídeo
      return reply.send(result.videoBuffer);

    } catch (error: any) {
      req.log.error(`TranscriptionController: Erro ao gerar vídeo com legendas traduzidas - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha ao gerar vídeo com legendas traduzidas',
        detail: error?.message
      } as ErrorResponse);
    }
  }
}
