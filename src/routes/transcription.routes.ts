import type { FastifyInstance } from 'fastify';
import { TranscriptionController } from './transcription.controller.js';

// Schema OpenAPI para o endpoint de transcrição
export const transcribeSchema = {
  summary: 'Transcreve um arquivo de áudio ou vídeo usando Whisper',
  description: 'Recebe um arquivo de áudio/vídeo e retorna a transcrição em texto usando o modelo Whisper',
  tags: ['transcription'],
  consumes: ['multipart/form-data'],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Arquivo de áudio ou vídeo para transcrição'
            }
          },
          required: ['file']
        }
      }
    }
  },
  response: {
    200: {
      description: 'Transcrição realizada com sucesso',
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
              seek: { type: 'number' },
              start: { type: 'number', description: 'Tempo de início em segundos' },
              end: { type: 'number', description: 'Tempo de fim em segundos' },
              text: { type: 'string', description: 'Texto do segmento' },
              tokens: { type: 'array', items: { type: 'number' } },
              temperature: { type: 'number' },
              avg_logprob: { type: 'number' },
              compression_ratio: { type: 'number' },
              no_speech_prob: { type: 'number' }
            }
          }
        }
      }
    },
    400: {
      description: 'Erro de validação',
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
} as const;

// Schema OpenAPI para o endpoint de vídeo com legendas
export const videoWithSubtitlesSchema = {
  summary: 'Gera vídeo com legendas usando Whisper + FFmpeg',
  description: 'Recebe um arquivo de vídeo, transcreve o áudio e retorna o vídeo com legendas incorporadas',
  tags: ['video'],
  consumes: ['multipart/form-data'],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Arquivo de vídeo para adicionar legendas'
            }
          },
          required: ['file']
        }
      }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      hardcoded: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'true',
        description: 'Se deve incorporar legendas no vídeo (true) ou adicionar como stream separado (false)'
      },
      fontName: {
        type: 'string',
        default: 'Arial',
        description: 'Nome da fonte para as legendas'
      },
      fontSize: {
        type: 'integer',
        default: 24,
        description: 'Tamanho da fonte para as legendas'
      },
      fontColor: {
        type: 'string',
        default: '#ffffff',
        description: 'Cor da fonte em hexadecimal'
      },
      backgroundColor: {
        type: 'string',
        default: '#000000',
        description: 'Cor de fundo das legendas em hexadecimal'
      },
      borderWidth: {
        type: 'integer',
        default: 2,
        description: 'Largura da borda das legendas'
      },
      borderColor: {
        type: 'string',
        default: '#000000',
        description: 'Cor da borda em hexadecimal'
      }
    }
  },
  response: {
    200: {
      description: 'Vídeo com legendas gerado com sucesso',
      content: {
        'video/mp4': {
          schema: {
            type: 'string',
            format: 'binary',
            description: 'Arquivo de vídeo com legendas'
          }
        }
      }
    },
    400: {
      description: 'Erro de validação',
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
} as const;

/**
 * Registra as rotas de transcrição
 */
export async function transcriptionRoutes(fastify: FastifyInstance) {
  const controller = new TranscriptionController();

  // Endpoint de transcrição
  fastify.post(
    '/transcribe',
    { schema: transcribeSchema },
    controller.transcribe.bind(controller)
  );

  // Endpoint de vídeo com legendas
  fastify.post(
    '/video-with-subtitles',
    { schema: videoWithSubtitlesSchema },
    controller.transcribeVideoWithSubtitles.bind(controller)
  );
}
