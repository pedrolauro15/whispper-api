import reverso from 'reverso-api';
import type { TranscriptionResponse } from '../types/index.js';

export interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  segments?: Array<{
    id?: number;
    start?: number;
    end?: number;
    originalText?: string;
    translatedText?: string;
  }>;
}

export class TranslationService {
  private readonly supportedLanguages = {
    'pt': 'portuguese',
    'en': 'english',
    'es': 'spanish',
    'fr': 'french',
    'de': 'german',
    'it': 'italian',
    'ru': 'russian',
    'ja': 'japanese',
    'ko': 'korean',
    'zh': 'chinese',
    'ar': 'arabic',
    'nl': 'dutch',
    'pl': 'polish',
    'sv': 'swedish',
    'no': 'norwegian',
    'da': 'danish',
    'fi': 'finnish',
    'tr': 'turkish',
    'he': 'hebrew',
    'hi': 'hindi'
  };

  /**
   * Traduz o texto completo da transcrição
   */
  async translateTranscription(
    transcription: TranscriptionResponse,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    try {
      console.log(`TranslationService: Iniciando tradução para ${options.targetLanguage}`);

      // Traduzir texto completo
      const translatedText = await this.translateText(transcription.text, options);

      // Traduzir segmentos individuais se existirem
      let translatedSegments;
      if (transcription.segments && transcription.segments.length > 0) {
        translatedSegments = await this.translateSegments(transcription.segments, options);
      }

      const result: TranslationResult = {
        originalText: transcription.text,
        translatedText,
        sourceLanguage: options.sourceLanguage || 'auto',
        targetLanguage: options.targetLanguage,
        segments: translatedSegments
      };

      console.log('TranslationService: Tradução concluída com sucesso');
      return result;

    } catch (error) {
      console.error('TranslationService: Erro na tradução:', error);
      throw new Error(`Erro na tradução: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Traduz um texto usando a API Reverso
   */
  private async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      // Dividir texto em chunks menores para evitar limites da API
      const chunks = this.splitTextIntoChunks(text, 1000);
      const translatedChunks: string[] = [];

      for (const chunk of chunks) {
        const sourceLanguage = this.mapLanguageCode(options.sourceLanguage || 'pt');
        const targetLanguage = this.mapLanguageCode(options.targetLanguage);

        console.log(`TranslationService: Traduzindo chunk de ${sourceLanguage} para ${targetLanguage}`);

        const response = await reverso(chunk, sourceLanguage, targetLanguage);
        translatedChunks.push(response.text);

        // Pequena pausa para evitar rate limiting
        await this.delay(100);
      }

      return translatedChunks.join(' ');

    } catch (error) {
      console.error('TranslationService: Erro ao traduzir texto:', error);
      throw error;
    }
  }

  /**
   * Traduz os segmentos individualmente
   */
  private async translateSegments(
    segments: any[],
    options: TranslationOptions
  ): Promise<Array<{
    id?: number;
    start?: number;
    end?: number;
    originalText?: string;
    translatedText?: string;
  }>> {
    const translatedSegments = [];

    for (const segment of segments) {
      if (segment.text && segment.text.trim()) {
        try {
          const translatedText = await this.translateText(segment.text, options);
          
          translatedSegments.push({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            originalText: segment.text,
            translatedText
          });

          // Pausa entre segmentos
          await this.delay(50);

        } catch (error) {
          console.warn(`TranslationService: Erro ao traduzir segmento ${segment.id}:`, error);
          
          // Em caso de erro, manter texto original
          translatedSegments.push({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            originalText: segment.text,
            translatedText: segment.text
          });
        }
      }
    }

    return translatedSegments;
  }

  /**
   * Divide texto em chunks menores
   */
  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const testChunk = currentChunk ? `${currentChunk}. ${trimmedSentence}` : trimmedSentence;

      if (testChunk.length <= maxLength) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // Se a sentença sozinha é muito grande, dividir por palavras
        if (trimmedSentence.length > maxLength) {
          const words = trimmedSentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            const testWordChunk = wordChunk ? `${wordChunk} ${word}` : word;
            
            if (testWordChunk.length <= maxLength) {
              wordChunk = testWordChunk;
            } else {
              if (wordChunk) {
                chunks.push(wordChunk);
              }
              wordChunk = word;
            }
          }
          
          if (wordChunk) {
            currentChunk = wordChunk;
          }
        } else {
          currentChunk = trimmedSentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Mapeia códigos de idioma para nomes aceitos pela API Reverso
   */
  private mapLanguageCode(code: string): string {
    const lowerCode = code.toLowerCase();
    
    if (this.supportedLanguages[lowerCode as keyof typeof this.supportedLanguages]) {
      return this.supportedLanguages[lowerCode as keyof typeof this.supportedLanguages];
    }

    // Fallback para códigos não mapeados
    switch (lowerCode) {
      case 'pt-br':
      case 'pt_br':
        return 'portuguese';
      case 'en-us':
      case 'en_us':
      case 'en-gb':
      case 'en_gb':
        return 'english';
      case 'es-es':
      case 'es_es':
        return 'spanish';
      case 'zh-cn':
      case 'zh_cn':
      case 'zh-tw':
      case 'zh_tw':
        return 'chinese';
      default:
        console.warn(`TranslationService: Idioma não mapeado: ${code}, usando 'english' como fallback`);
        return 'english';
    }
  }

  /**
   * Utilitário para pausas entre requisições
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna lista de idiomas suportados
   */
  getSupportedLanguages(): { code: string; name: string; nativeName: string }[] {
    return [
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
    ];
  }
}
