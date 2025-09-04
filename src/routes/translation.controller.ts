import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TranslationOptions } from '../services/translation.service.js';
import { TranslationService } from '../services/translation.service.js';
import type { ErrorResponse, TranscriptionResponse } from '../types/index.js';

export class TranslationController {
  private translationService: TranslationService;

  constructor() {
    this.translationService = new TranslationService();
  }

  /**
   * Handler para traduzir uma transcrição existente
   */
  async translateTranscription(req: FastifyRequest, reply: FastifyReply) {
    try {
      req.log.info('TranslationController: Iniciando tradução');

      const { transcription, targetLanguage, sourceLanguage, model } = req.body as {
        transcription: TranscriptionResponse;
        targetLanguage: string;
        sourceLanguage?: string;
        model?: string;
      };

      if (!transcription) {
        return reply.code(400).send({
          error: 'Transcrição não fornecida'
        } as ErrorResponse);
      }

      if (!targetLanguage) {
        return reply.code(400).send({
          error: 'Idioma de destino não fornecido'
        } as ErrorResponse);
      }

      req.log.info(`TranslationController: Traduzindo para ${targetLanguage}${model ? ` usando modelo ${model}` : ''}`);

      const options: TranslationOptions = {
        targetLanguage,
        sourceLanguage,
        model
      };

      const result = await this.translationService.translateTranscription(transcription, options);

      req.log.info('TranslationController: Tradução concluída');
      return reply.send(result);

    } catch (error: any) {
      req.log.error(`TranslationController: Erro na tradução - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha na tradução',
        detail: error?.message
      } as ErrorResponse);
    }
  }

  /**
   * Handler para obter modelos de IA disponíveis
   */
  async getAvailableModels(req: FastifyRequest, reply: FastifyReply) {
    try {
      const models = this.translationService.getAvailableModels();
      return reply.send(models);

    } catch (error: any) {
      req.log.error(`TranslationController: Erro ao obter modelos - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha ao obter modelos disponíveis',
        detail: error?.message
      } as ErrorResponse);
    }
  }

  /**
   * Handler para obter idiomas suportados
   */
  async getSupportedLanguages(req: FastifyRequest, reply: FastifyReply) {
    try {
      const languages = this.translationService.getSupportedLanguages();
      return reply.send({ languages });

    } catch (error: any) {
      req.log.error(`TranslationController: Erro ao obter idiomas - ${error?.message}`);

      return reply.code(500).send({
        error: 'Falha ao obter idiomas suportados',
        detail: error?.message
      } as ErrorResponse);
    }
  }
}
