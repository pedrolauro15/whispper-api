import { Ollama } from 'ollama';
import type { TranscriptionResponse } from '../types/index.js';

export interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  model?: string; // Modelo de IA para tradução
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
   * Converte código de idioma para nome legível
   */
  private getLanguageName(code: string): string {xport interface TranslationResult {
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
   * Traduz o texto completo da transcrição
   */
  async translateTranscription(
    transcription: TranscriptionResponse,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    try {
      const targetLangName = this.getLanguageName(options.targetLanguage);
      console.log(`🌍 TranslationService: Iniciando tradução para ${targetLangName} (${options.targetLanguage})`);
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
   * Traduz um texto usando Ollama com llama3.1
   */
  private async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      const sourceLanguage = this.getLanguageName(options.sourceLanguage || 'pt');
      const targetLanguage = this.getLanguageName(options.targetLanguage);

      console.log(`TranslationService: Traduzindo de ${sourceLanguage} para ${targetLanguage}`);

      const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 

IMPORTANT INSTRUCTIONS:
- Only return the translated text, nothing else
- Maintain the original meaning and tone
- Do not add explanations, comments, or metadata
- Preserve formatting and punctuation
- If you cannot translate, return the original text

Text to translate:
"${text}"

Translation:`;

      const response = await this.ollama.generate({
        model: 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 512
        }
      });

      let translatedText = response.response.trim();
      
      // Remover aspas extras se existirem
      if (translatedText.startsWith('"') && translatedText.endsWith('"')) {
        translatedText = translatedText.slice(1, -1);
      }

      return translatedText || text;

    } catch (error) {
      console.error('TranslationService: Erro ao traduzir texto:', error);
      
      // Em caso de erro, retornar o texto original
      console.warn('TranslationService: Retornando texto original devido ao erro');
      return text;
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

    console.log(`TranslationService: Traduzindo ${segments.length} segmentos`);

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
   * Converte código de idioma para nome completo
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
        console.warn(`TranslationService: Idioma não mapeado: ${code}, usando 'English' como fallback`);
        return 'English';
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