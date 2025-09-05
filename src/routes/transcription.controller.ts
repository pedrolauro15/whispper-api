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

      let fileUpload: FileUpload | null = null;
      let translatedSegments: any[] = [];

      // Estratégia 1: Tentar processar todas as partes juntas
      req.log.info('TranscriptionController: Estratégia 1 - Processando multipart completo...');
      
      try {
        const parts = (req as any).parts();
        let partCount = 0;
        
        for await (const part of parts) {
          partCount++;
          req.log.info(`TranscriptionController: Parte ${partCount} - tipo: ${part.type}, fieldname: ${part.fieldname || 'N/A'}`);
          
          if (part.type === 'file') {
            fileUpload = part as FileUpload;
            req.log.info(`TranscriptionController: Arquivo recebido - ${fileUpload.filename} (${fileUpload.mimetype})`);
          } else if (part.type === 'field') {
            req.log.info(`TranscriptionController: Campo "${part.fieldname}" - valor: ${part.value?.length || 0} chars`);
            
            if (part.fieldname === 'translatedSegments') {
              try {
                const value = part.value;
                req.log.info(`TranscriptionController: ✅ Campo translatedSegments encontrado (${value?.length || 0} chars)`);
                
                if (value) {
                  // Log do início dos dados para debug
                  req.log.info(`TranscriptionController: Dados iniciais: ${value.substring(0, 200)}...`);
                  
                  translatedSegments = JSON.parse(value);
                  req.log.info(`TranscriptionController: ✅ ${translatedSegments?.length || 0} segmentos processados com sucesso`);
                  
                  // Log do primeiro segmento para validação
                  if (translatedSegments.length > 0) {
                    req.log.info(`TranscriptionController: Primeiro segmento: ${JSON.stringify(translatedSegments[0])}`);
                  }
                } else {
                  req.log.warn('TranscriptionController: ⚠️ Campo translatedSegments vazio');
                }
              } catch (parseError) {
                req.log.error(`TranscriptionController: ❌ Erro ao processar segmentos: ${parseError}`);
                req.log.error(`TranscriptionController: Dados problemáticos: ${part.value?.substring(0, 200)}...`);
              }
            } else if (part.fieldname === 'video' && !fileUpload) {
              // Caso o arquivo seja enviado como campo 'video' em vez de file
              req.log.info('TranscriptionController: Campo "video" detectado - pode ser o arquivo');
            }
          }
          
          // Limite de segurança
          if (partCount > 20) {
            req.log.warn('TranscriptionController: Limite de partes atingido');
            break;
          }
          
          // Parar early se já temos tudo que precisamos
          if (fileUpload && translatedSegments.length > 0) {
            req.log.info('TranscriptionController: ✅ Dados completos obtidos, parando processamento early');
            break;
          }
        }
        
        req.log.info(`TranscriptionController: Estratégia 1 concluída - arquivo: ${!!fileUpload}, segmentos: ${translatedSegments.length}`);
        
      } catch (strategy1Error) {
        req.log.error(`Estratégia 1 falhou: ${strategy1Error}`);
        
        // Estratégia 2: Processar separadamente
        req.log.info('TranscriptionController: Estratégia 2 - Processamento separado...');
        
        try {
          // Tentar obter arquivo primeiro
          if (!fileUpload) {
            const filePart = await (req as any).file();
            if (filePart) {
              fileUpload = filePart;
              req.log.info(`TranscriptionController: Arquivo obtido via estratégia 2 - ${filePart.filename}`);
            }
          }
          
          // Tentar obter campos via query params ou body como fallback
          if (translatedSegments.length === 0) {
            const body = req.body as any;
            if (body && body.translatedSegments) {
              try {
                translatedSegments = Array.isArray(body.translatedSegments) ? 
                  body.translatedSegments : 
                  JSON.parse(body.translatedSegments);
                req.log.info(`TranscriptionController: ✅ Segmentos obtidos via body - ${translatedSegments.length} itens`);
              } catch (bodyError) {
                req.log.error(`Erro ao processar body: ${bodyError}`);
              }
            }
          }
          
        } catch (strategy2Error) {
          req.log.error(`Estratégia 2 falhou: ${strategy2Error}`);
        }
      }      // Log do estado final e diagnóstico
      req.log.info(`TranscriptionController: ===== DIAGNÓSTICO FINAL =====`);
      req.log.info(`TranscriptionController: Arquivo recebido: ${!!fileUpload}`);
      req.log.info(`TranscriptionController: Segmentos recebidos: ${translatedSegments.length}`);
      req.log.info(`TranscriptionController: Headers: ${JSON.stringify(req.headers['content-type'])}`);
      req.log.info(`TranscriptionController: Query params: ${JSON.stringify(req.query)}`);
      
      // Se ainda não temos segmentos, tentar debug do request
      if (translatedSegments.length === 0) {
        req.log.error('TranscriptionController: ❌ PROBLEMA: Nenhum segmento traduzido recebido');
        req.log.error('TranscriptionController: Isso pode indicar:');
        req.log.error('TranscriptionController: 1. Frontend não está enviando o campo "translatedSegments"');
        req.log.error('TranscriptionController: 2. Campo está sendo enviado com nome diferente');
        req.log.error('TranscriptionController: 3. Dados estão sendo corrompidos no envio');
        req.log.error('TranscriptionController: 4. Multipart está sendo processado incorretamente');
        
        // Tentar examinar raw request
        const rawBody = req.body;
        req.log.info(`TranscriptionController: Raw body type: ${typeof rawBody}`);
        req.log.info(`TranscriptionController: Raw body keys: ${rawBody ? Object.keys(rawBody) : 'null'}`);
      }

      req.log.info(`TranscriptionController: ================================`);

      if (!fileUpload) {
        req.log.error('TranscriptionController: ❌ Falha final - nenhum arquivo recebido');
        return reply.code(400).send({
          error: 'Nenhum arquivo enviado'
        } as ErrorResponse);
      }

      if (!this.isValidVideoFile(fileUpload)) {
        req.log.error(`TranscriptionController: ❌ Falha final - arquivo inválido: ${fileUpload.mimetype}`);
        return reply.code(400).send({
          error: 'Tipo de arquivo inválido. Envie um arquivo de vídeo.',
          detail: `Tipo recebido: ${fileUpload.mimetype}`
        } as ErrorResponse);
      }

      if (!translatedSegments || !Array.isArray(translatedSegments) || translatedSegments.length === 0) {
        req.log.error(`TranscriptionController: ❌ Falha final - segmentos inválidos`);
        req.log.error(`TranscriptionController: - É Array: ${Array.isArray(translatedSegments)}`);
        req.log.error(`TranscriptionController: - Length: ${translatedSegments?.length || 0}`);
        req.log.error(`TranscriptionController: - Tipo: ${typeof translatedSegments}`);
        
        return reply.code(400).send({
          error: 'Segmentos traduzidos são obrigatórios',
          detail: 'Envie os segmentos traduzidos via campo "translatedSegments" no formulário multipart. Nenhum segmento foi recebido pelo servidor.',
          debug: {
            fileReceived: !!fileUpload,
            segmentsReceived: translatedSegments?.length || 0,
            segmentsType: typeof translatedSegments,
            isArray: Array.isArray(translatedSegments)
          }
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
          text: translatedSegments.map((s: any) => s.text).join(' '), 
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
