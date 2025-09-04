import type { FastifyInstance } from 'fastify';
import { TranslationController } from './translation.controller.js';

// Schema OpenAPI para o endpoint de tradução
export const translateSchema = {
  summary: 'Traduz uma transcrição existente',
  description: 'Recebe uma transcrição e traduz para o idioma especificado usando a API Reverso',
  tags: ['translation'],
  body: {
    type: 'object',
    properties: {
      transcription: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Texto transcrito completo'
          },
          segments: {
            type: 'array',
            description: 'Segmentos detalhados da transcrição',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                start: { type: 'number', description: 'Tempo de início em segundos' },
                end: { type: 'number', description: 'Tempo de fim em segundos' },
                text: { type: 'string', description: 'Texto do segmento' }
              }
            }
          }
        },
        required: ['text']
      },
      targetLanguage: {
        type: 'string',
        description: 'Código do idioma de destino (ex: "en", "es", "fr")',
        examples: ['en', 'es', 'fr', 'de', 'it']
      },
      sourceLanguage: {
        type: 'string',
        description: 'Código do idioma de origem (opcional, auto-detectado se não fornecido)',
        examples: ['pt', 'en', 'es', 'fr', 'de']
      }
    },
    required: ['transcription', 'targetLanguage']
  },
  response: {
    200: {
      description: 'Tradução realizada com sucesso',
      type: 'object',
      properties: {
        originalText: {
          type: 'string',
          description: 'Texto original'
        },
        translatedText: {
          type: 'string',
          description: 'Texto traduzido'
        },
        sourceLanguage: {
          type: 'string',
          description: 'Idioma de origem'
        },
        targetLanguage: {
          type: 'string',
          description: 'Idioma de destino'
        },
        segments: {
          type: 'array',
          description: 'Segmentos traduzidos',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              start: { type: 'number' },
              end: { type: 'number' },
              originalText: { type: 'string' },
              translatedText: { type: 'string' }
            }
          }
        }
      }
    },
    400: {
      description: 'Parâmetros inválidos',
      type: 'object',
      properties: {
        error: { type: 'string' },
        detail: { type: 'string' }
      }
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        error: { type: 'string' },
        detail: { type: 'string' }
      }
    }
  }
};

// Schema OpenAPI para o endpoint de idiomas suportados
export const supportedLanguagesSchema = {
  summary: 'Lista idiomas suportados para tradução',
  description: 'Retorna a lista de idiomas disponíveis para tradução',
  tags: ['translation'],
  response: {
    200: {
      description: 'Lista de idiomas suportados',
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Código do idioma'
              },
              name: {
                type: 'string',
                description: 'Nome do idioma em inglês'
              },
              nativeName: {
                type: 'string',
                description: 'Nome do idioma no idioma nativo'
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Registra as rotas de tradução
 */
export async function translationRoutes(app: FastifyInstance) {
  const controller = new TranslationController();

  // Endpoint para traduzir transcrição
  app.post('/translate/transcription', {
    schema: translateSchema
  }, controller.translateTranscription.bind(controller));

  // Endpoint para obter idiomas suportados
  app.get('/translation/languages', {
    schema: supportedLanguagesSchema
  }, controller.getSupportedLanguages.bind(controller));
}
