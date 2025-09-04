import type { FastifyReply, FastifyRequest } from 'fastify';
import { TranscriptionService } from '../services/transcription.service.js';
import type { ErrorResponse, FileUpload, TranscriptionContext } from '../types/index.js';

export class TranscriptionController {
  private transcriptionService: TranscriptionService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
  }

  /**
   * Transcreve um arquivo de áudio/vídeo
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

      // Validar que é um arquivo de áudio/vídeo
      if (!this.isValidAudioFile(fileUpload)) {
        return reply.code(400).send({
          error: 'Tipo de arquivo inválido. Envie um arquivo de áudio ou vídeo.',
          detail: `Tipo recebido: ${fileUpload.mimetype}`
        } as ErrorResponse);
      }

      req.log.info(`TranscriptionController: Arquivo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);

      // Extrair contexto dos campos do formulário (temporariamente desabilitado)
      // const context = await this.extractContextFromRequest(req);
      const context = undefined;

      // Processar transcrição
      const result = await this.transcriptionService.transcribeFile(fileUpload, context);

      // O TranscriptionResponse sempre contém text e segments
      req.log.info('TranscriptionController: Transcrição concluída com sucesso');
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
   * Gera vídeo com legendas
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
   * Gera vídeo com legendas traduzidas
   */
  async generateVideoWithTranslatedSubtitles(req: FastifyRequest, reply: FastifyReply) {
    try {
      req.log.info('TranscriptionController: Iniciando geração de vídeo com legendas traduzidas');

      // Processar multipart para obter arquivo e segmentos
      let fileUpload: FileUpload | null = null;
      let translatedSegments: any[] | null = null;
      let partsProcessed = 0;

      // Usar abordagem que processa todas as partes do multipart
      req.log.info('TranscriptionController: Iniciando processamento multipart...');
      const parts = (req as any).parts();
      
      for await (const part of parts) {
        partsProcessed++;
        req.log.info(`TranscriptionController: Processando parte ${partsProcessed}/${parts.length} - tipo: ${part.type}`);

        if (part.type === 'file') {
          fileUpload = part as FileUpload;
          req.log.info(`TranscriptionController: Arquivo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);
        } else if (part.type === 'field') {
          req.log.info(`TranscriptionController: Campo recebido - ${part.fieldname}`);
          
          if (part.fieldname === 'translatedSegments') {
            try {
              // Ler o valor do campo
              const value = part.value;
              req.log.info(`TranscriptionController: Campo translatedSegments recebido (${value.length} chars)`);
              
              translatedSegments = JSON.parse(value);
              req.log.info(`TranscriptionController: ${translatedSegments?.length || 0} segmentos traduzidos processados`);
              
              if (translatedSegments && translatedSegments.length > 0) {
                req.log.info(`TranscriptionController: Primeiro segmento: "${translatedSegments[0].text?.substring(0, 50)}..."`);
              }
            } catch (parseError) {
              req.log.error(`Erro ao fazer parse dos segmentos: ${parseError}`);
            }
          }
        }
        
        // Evitar loop infinito
        if (partsProcessed > 10) {
          req.log.warn('TranscriptionController: Limite de partes atingido, parando');
          break;
        }
      }

      req.log.info(`TranscriptionController: Multipart processado - ${partsProcessed} partes, arquivo: ${!!fileUpload}, segmentos: ${!!translatedSegments}`);

      if (!fileUpload) {
        return reply.code(400).send({
          error: 'Nenhum arquivo enviado'
        } as ErrorResponse);
      }

      if (!this.isValidVideoFile(fileUpload)) {
        return reply.code(400).send({
          error: 'Tipo de arquivo inválido. Envie um arquivo de vídeo.',
          detail: `Tipo recebido: ${fileUpload.mimetype}`
        } as ErrorResponse);
      }

      if (!translatedSegments || !Array.isArray(translatedSegments) || translatedSegments.length === 0) {
        return reply.code(400).send({
          error: 'Segmentos traduzidos são obrigatórios',
          detail: 'Envie os segmentos traduzidos via campo "translatedSegments" no formulário multipart'
        } as ErrorResponse);
      }

      // Obter parâmetros da query
      const query = req.query as any;
      const hardcodedSubs = query.hardcoded !== 'false'; // Default: true
      
      // Estilo das legendas
      const subtitleStyle = {
        fontName: query.fontName || 'Arial',
        fontSize: parseInt(query.fontSize) || 18,
        fontColor: query.fontColor || '#ffffff',
        backgroundColor: query.backgroundColor || '#000000',
        borderWidth: parseInt(query.borderWidth) || 1,
        borderColor: query.borderColor || '#000000',
        marginVertical: parseInt(query.marginVertical) || 20
      };

      req.log.info('TranscriptionController: Iniciando processamento do vídeo com segmentos traduzidos');

      // Usar o método que gera vídeo com segmentos customizados
      const result = await this.transcriptionService.generateVideoWithCustomSegments(
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

      // Headers para download
      const fileName = fileUpload.filename 
        ? fileUpload.filename.replace(/\.[^/.]+$/, '_with_translated_subtitles.mp4')
        : 'video_with_translated_subtitles.mp4';

      reply.header('Content-Type', 'video/mp4');
      reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
      
      return reply.send(result.videoBuffer);

    } catch (error: any) {
      req.log.error(`TranscriptionController: Erro ao gerar vídeo com legendas traduzidas - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha ao gerar vídeo com legendas traduzidas',
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

      return hasContext ? context : undefined;

    } catch (error) {
      // Se houver erro ao extrair contexto, continuar sem contexto
      console.log('Erro ao extrair contexto:', error);
      return undefined;
    }
  }
}
