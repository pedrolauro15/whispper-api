import { Ollama } from 'ollama';
import type { TranscriptionResponse } from '../types/index.js';

export interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  model?: string; // Modelo de IA para tradução
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
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://caucaia.saudehd.com.br:11434' });
  }

  private readonly supportedModels = {
    'llama3.1:8b': {
      name: 'Llama 3.1 8B',
      description: 'Modelo rápido e eficiente para traduções gerais',
      temperature: 0.3,
      top_p: 0.9
    },
    'llama3.1:70b': {
      name: 'Llama 3.1 70B',
      description: 'Modelo mais poderoso para traduções complexas',
      temperature: 0.2,
      top_p: 0.8
    },
    'llama3.2:3b': {
      name: 'Llama 3.2 3B',
      description: 'Modelo compacto e rápido',
      temperature: 0.4,
      top_p: 0.9
    },
    'qwen2.5:7b': {
      name: 'Qwen 2.5 7B',
      description: 'Excelente para idiomas asiáticos',
      temperature: 0.3,
      top_p: 0.85
    },
    'mistral:7b': {
      name: 'Mistral 7B',
      description: 'Ótimo para idiomas europeus',
      temperature: 0.3,
      top_p: 0.9
    }
  };

  private readonly supportedLanguages = {
    'pt': 'Português',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'ar': 'العربية',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'sv': 'Svenska',
    'no': 'Norsk',
    'da': 'Dansk',
    'fi': 'Suomi',
    'tr': 'Türkçe',
    'he': 'עברית',
    'hi': 'हिन्दी'
  };

  /**
   * Retorna a lista de modelos disponíveis
   */
  getAvailableModels(): Record<string, { name: string; description: string }> {
    const models: Record<string, { name: string; description: string }> = {};
    
    for (const [key, value] of Object.entries(this.supportedModels)) {
      models[key] = {
        name: value.name,
        description: value.description
      };
    }
    
    return models;
  }

  /**
   * Retorna a lista de idiomas suportados
   */
  getSupportedLanguages(): Record<string, string> {
    return { ...this.supportedLanguages };
  }

  /**
   * Traduz uma transcrição completa para outro idioma
   */
  async translateTranscription(
    transcription: TranscriptionResponse,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    try {
      const targetLangName = this.getLanguageName(options.targetLanguage);
      const selectedModel = options.model || 'llama3.1:8b';
      
      console.log(`🌍 TranslationService: Iniciando tradução para ${targetLangName} (${options.targetLanguage})`);
      console.log(`🤖 Modelo selecionado: ${this.supportedModels[selectedModel as keyof typeof this.supportedModels]?.name || selectedModel}`);
      console.log(`📝 Texto original tem ${transcription.text.length} caracteres`);
      console.log(`🔢 Encontrados ${transcription.segments?.length || 0} segmentos para traduzir`);

      // Traduzir texto completo
      console.log('📖 TranslationService: Traduzindo texto completo...');
      const translatedText = await this.translateText(transcription.text, options);
      console.log('✅ Texto completo traduzido com sucesso');

      // Traduzir segmentos individuais se existirem
      let translatedSegments;
      if (transcription.segments && transcription.segments.length > 0) {
        console.log(`🔄 TranslationService: Traduzindo ${transcription.segments.length} segmentos individuais...`);
        translatedSegments = await this.translateSegments(transcription.segments, options);
        console.log('✅ Todos os segmentos traduzidos com sucesso');
      }

      const result: TranslationResult = {
        originalText: transcription.text,
        translatedText,
        sourceLanguage: options.sourceLanguage || 'auto',
        targetLanguage: options.targetLanguage,
        segments: translatedSegments
      };

      console.log('🎉 TranslationService: Tradução concluída com sucesso');
      return result;

    } catch (error) {
      console.error('❌ TranslationService: Erro na tradução:', error);
      throw new Error(`Erro na tradução: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Traduz um texto usando Ollama com modelo selecionado
   */
  private async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      const sourceLanguage = this.getLanguageName(options.sourceLanguage || 'pt');
      const targetLanguage = this.getLanguageName(options.targetLanguage);
      const selectedModel = options.model || 'llama3.1:8b';
      const modelConfig = this.supportedModels[selectedModel as keyof typeof this.supportedModels];

      console.log(`TranslationService: Traduzindo de ${sourceLanguage} para ${targetLanguage} usando ${selectedModel}`);

      const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 

IMPORTANT INSTRUCTIONS:
- Only return the translated text, nothing else
- Maintain the original formatting and punctuation
- Keep technical terms when appropriate
- Preserve proper nouns unless they have standard translations
- Ensure natural and fluent translation in the target language

Text to translate:
"${text}"`;

      const response = await this.ollama.generate({
        model: selectedModel,
        prompt,
        stream: false,
        options: {
          temperature: modelConfig?.temperature || 0.3,
          top_p: modelConfig?.top_p || 0.9,
          num_predict: -1
        }
      });

      return response.response.trim();

    } catch (error) {
      console.error('TranslationService: Erro na tradução do texto:', error);
      throw new Error(`Erro ao traduzir texto: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Traduz segmentos individuais
   */
  private async translateSegments(segments: any[], options: TranslationOptions): Promise<Array<{
    id?: number;
    start?: number;
    end?: number;
    originalText?: string;
    translatedText?: string;
  }>> {
    const translatedSegments = [];
    const selectedModel = options.model || 'llama3.1:8b';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.text && segment.text.trim()) {
        try {
          console.log(`🔄 Traduzindo segmento ${i + 1}/${segments.length}: "${segment.text.substring(0, 50)}..."`);
          
          const translatedText = await this.translateText(segment.text.trim(), options);
          
          translatedSegments.push({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            originalText: segment.text,
            translatedText
          });

          // Pausa entre segmentos para não sobrecarregar o Ollama
          await this.delay(200);

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
   * Converte código de idioma para nome legível
   */
  private getLanguageName(code: string): string {
    const lowerCode = code.toLowerCase();
    
    if (this.supportedLanguages[lowerCode as keyof typeof this.supportedLanguages]) {
      return this.supportedLanguages[lowerCode as keyof typeof this.supportedLanguages];
    }

    // Fallback para códigos não mapeados
    switch (lowerCode) {
      case 'pt-br':
      case 'pt_br':
        return 'Português';
      case 'en-us':
      case 'en_us':
      case 'en-gb':
      case 'en_gb':
        return 'English';
      case 'es-es':
      case 'es_es':
        return 'Español';
      case 'zh-cn':
      case 'zh_cn':
      case 'zh-tw':
      case 'zh_tw':
        return '中文';
      default:
        return code.charAt(0).toUpperCase() + code.slice(1);
    }
  }

  /**
   * Adiciona delay entre operações
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
