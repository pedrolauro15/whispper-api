import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../lib/config.js';
import { FileService } from '../services/file.service.js';
import { VideoService, type SubtitleStyle } from '../services/video.service.js';
import { WhisperService } from '../services/whisper.service.js';
import type { FileUpload, TranscriptionContext, TranscriptionResponse, VideoWithSubtitlesResponse } from '../types/index.js';

export class TranscriptionService {
  private fileService: FileService;
  private whisperService: WhisperService;
  private videoService: VideoService;

  constructor() {
    this.fileService = new FileService();
    this.whisperService = new WhisperService();
    this.videoService = new VideoService();
  }

  /**
   * Processa a transcrição completa de um arquivo
   */
  async transcribeFile(fileUpload: FileUpload, context?: TranscriptionContext): Promise<TranscriptionResponse> {
    let tmpPath: string | null = null;

    try {
      console.log('🎵 TranscriptionService: Iniciando processamento de transcrição');
      console.log(`📁 Arquivo: ${fileUpload.filename} (${fileUpload.mimetype})`);

      // 1. Processar e salvar o arquivo
      console.log('💾 TranscriptionService: Processando e salvando arquivo temporário...');
      tmpPath = await this.fileService.processUploadedFile(fileUpload);
      console.log(`✅ Arquivo salvo em: ${tmpPath}`);

      // 2. Executar transcrição com timeout
      console.log('🎤 TranscriptionService: Iniciando transcrição com Whisper...');
      const result = await this.executeWithTimeout(tmpPath, context);
      console.log('✅ TranscriptionService: Transcrição do Whisper concluída');

      // 3. Ler e processar resultado
      console.log('📊 TranscriptionService: Processando resultado da transcrição...');
      const transcription = await this.processTranscriptionResult(result.jsonPath);
      console.log(`✅ TranscriptionService: Transcrição processada - ${transcription.segments.length} segmentos encontrados`);

      return transcription;

    } finally {
      // 4. Limpeza
      if (tmpPath) {
        console.log('🧹 TranscriptionService: Limpando arquivo temporário...');
        await this.fileService.cleanup(tmpPath);
      }
    }
  }

  /**
   * Processa um vídeo e gera versão com legendas usando segmentos traduzidos
   */
  async generateVideoWithTranslatedSubtitles(
    fileUpload: FileUpload,
    translatedSegments: any[],
    subtitleStyle?: SubtitleStyle,
    hardcodedSubs: boolean = true
  ): Promise<VideoWithSubtitlesResponse> {
    let tmpVideoPath: string | null = null;
    let subtitlesPath: string | null = null;
    let outputVideoPath: string | null = null;

    try {
      console.log('🎬 TranslationService: Iniciando processamento do arquivo de vídeo...');
      // 1. Processar arquivo de vídeo
      tmpVideoPath = await this.fileService.processUploadedFile(fileUpload);
      console.log('✅ TranslationService: Arquivo de vídeo processado');

      console.log('📝 TranslationService: Gerando arquivo SRT traduzido...');
      // 2. Gerar arquivo de legendas SRT usando os segmentos traduzidos
      subtitlesPath = await this.generateSRTFileFromSegments(translatedSegments);
      console.log('✅ TranslationService: Arquivo SRT traduzido gerado');

      console.log('🎥 TranslationService: Iniciando processamento FFmpeg...');
      // 3. Gerar vídeo com legendas usando FFmpeg
      const videoResult = hardcodedSubs 
        ? await this.videoService.addHardcodedSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath: subtitlesPath!,
            subtitleStyle
          })
        : await this.videoService.addSoftSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath: subtitlesPath!
          });
      console.log('✅ TranslationService: Processamento FFmpeg concluído');

      if (!videoResult.success) {
        throw new Error(videoResult.message);
      }

      outputVideoPath = videoResult.outputPath;

      console.log('📹 TranslationService: Lendo buffer do vídeo final...');
      // 4. Ler arquivo de vídeo como buffer
      const videoBuffer = await fs.readFile(outputVideoPath);
      console.log('✅ TranslationService: Vídeo com legendas traduzidas concluído!');

      return {
        transcription: { segments: translatedSegments, text: translatedSegments.map(s => s.text).join(' ') },
        videoBuffer,
        videoPath: outputVideoPath,
        subtitlesPath,
        success: true,
        message: 'Vídeo com legendas traduzidas gerado com sucesso'
      };

    } catch (error) {
      return {
        transcription: null,
        videoBuffer: null,
        videoPath: null,
        subtitlesPath: null,
        success: false,
        message: `Erro ao processar vídeo com legendas traduzidas: ${error instanceof Error ? error.message : String(error)}`
      };

    } finally {
      // Limpeza (mantém o vídeo final temporariamente para download)
      if (tmpVideoPath) {
        await this.fileService.cleanup(tmpVideoPath);
      }
      if (subtitlesPath) {
        await this.videoService.cleanup(subtitlesPath);
      }
      // outputVideoPath será limpo depois do download
    }
  }

  /**
   * Gera vídeo usando segmentos customizados (para legendas traduzidas)
   */
  async generateVideoWithCustomSegments(
    fileUpload: FileUpload,
    transcription: any,
    subtitleStyle?: SubtitleStyle,
    hardcodedSubs: boolean = true
  ): Promise<VideoWithSubtitlesResponse> {
    let tmpVideoPath: string | null = null;
    let subtitlesPath: string | null = null;
    let outputVideoPath: string | null = null;

    try {
      // 1. Processar arquivo de vídeo
      tmpVideoPath = await this.fileService.processUploadedFile(fileUpload);

      // 2. Gerar arquivo de legendas SRT diretamente com os segmentos customizados
      console.log(`🎯 Usando ${transcription.segments.length} segmentos customizados`);
      console.log(`🎯 Primeiro segmento: "${transcription.segments[0]?.text}"`);
      subtitlesPath = await this.generateSRTFile(transcription.segments);

      // 3. Gerar vídeo com legendas usando FFmpeg
      const videoResult = hardcodedSubs 
        ? await this.videoService.addHardcodedSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath,
            subtitleStyle
          })
        : await this.videoService.addSoftSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath
          });

      if (!videoResult.success) {
        throw new Error(videoResult.message);
      }

      outputVideoPath = videoResult.outputPath;

      // 4. Ler arquivo de vídeo como buffer
      const videoBuffer = await fs.readFile(outputVideoPath);

      return {
        transcription,
        videoBuffer,
        videoPath: outputVideoPath,
        subtitlesPath,
        success: true,
        message: 'Vídeo com legendas customizadas gerado com sucesso'
      };

    } catch (error) {
      return {
        transcription: null,
        videoBuffer: null,
        videoPath: null,
        subtitlesPath: null,
        success: false,
        message: `Erro ao processar vídeo com segmentos customizados: ${error instanceof Error ? error.message : String(error)}`
      };

    } finally {
      // Limpeza (mantém o vídeo final temporariamente para download)
      if (tmpVideoPath) {
        await this.fileService.cleanup(tmpVideoPath);
      }
      if (subtitlesPath) {
        await this.videoService.cleanup(subtitlesPath);
      }
      // outputVideoPath será limpo depois do download
    }
  }

  /**
   * Gera vídeo com legendas usando uma transcrição existente (otimizado para legendas traduzidas)
   */
  async generateVideoFromExistingTranscription(
    fileUpload: FileUpload,
    transcription: any,
    subtitleStyle?: SubtitleStyle,
    hardcodedSubs: boolean = true
  ): Promise<VideoWithSubtitlesResponse> {
    let tmpVideoPath: string | null = null;
    let subtitlesPath: string | null = null;
    let outputVideoPath: string | null = null;

    try {
      console.log('🎬 TranscriptionService: Processando vídeo com transcrição existente...');
      
      // 1. Processar arquivo de vídeo
      tmpVideoPath = await this.fileService.processUploadedFile(fileUpload);
      console.log('✅ TranscriptionService: Arquivo de vídeo processado');

      // 2. Gerar arquivo de legendas SRT (pula a transcrição)
      console.log('📝 TranscriptionService: Gerando arquivo SRT...');
      console.log(`📝 TranscriptionService: Recebidos ${transcription.segments.length} segmentos`);
      console.log(`📝 TranscriptionService: Primeiro segmento: "${transcription.segments[0]?.text}"`);
      subtitlesPath = await this.generateSRTFile(transcription.segments);
      console.log('✅ TranscriptionService: Arquivo SRT gerado');

      // 3. Gerar vídeo com legendas usando FFmpeg
      console.log('🎥 TranscriptionService: Iniciando processamento FFmpeg...');
      const videoResult = hardcodedSubs 
        ? await this.videoService.addHardcodedSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath,
            subtitleStyle
          })
        : await this.videoService.addSoftSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath
          });
      console.log('✅ TranscriptionService: Processamento FFmpeg concluído');

      if (!videoResult.success) {
        throw new Error(videoResult.message);
      }

      outputVideoPath = videoResult.outputPath;

      // 4. Ler arquivo de vídeo como buffer
      console.log('📹 TranscriptionService: Lendo buffer do vídeo final...');
      const videoBuffer = await fs.readFile(outputVideoPath);
      console.log('✅ TranscriptionService: Vídeo com legendas concluído!');

      return {
        transcription,
        videoBuffer,
        videoPath: outputVideoPath,
        subtitlesPath,
        success: true,
        message: 'Vídeo com legendas gerado com sucesso'
      };

    } catch (error) {
      return {
        transcription: null,
        videoBuffer: null,
        videoPath: null,
        subtitlesPath: null,
        success: false,
        message: `Erro ao processar vídeo: ${error instanceof Error ? error.message : String(error)}`
      };

    } finally {
      // Limpeza (mantém o vídeo final temporariamente para download)
      if (tmpVideoPath) {
        await this.fileService.cleanup(tmpVideoPath);
      }
      if (subtitlesPath) {
        await this.videoService.cleanup(subtitlesPath);
      }
      // outputVideoPath será limpo depois do download
    }
  }

  /**
   * Processa um vídeo e gera versão com legendas
   */
  async transcribeAndAddSubtitlesToVideo(
    fileUpload: FileUpload,
    subtitleStyle?: SubtitleStyle,
    hardcodedSubs: boolean = true,
    context?: TranscriptionContext
  ): Promise<VideoWithSubtitlesResponse> {
    let tmpVideoPath: string | null = null;
    let subtitlesPath: string | null = null;
    let outputVideoPath: string | null = null;

    try {
      // 1. Processar arquivo de vídeo
      tmpVideoPath = await this.fileService.processUploadedFile(fileUpload);

      // 2. Transcrever áudio do vídeo
      const whisperResult = await this.executeWithTimeout(tmpVideoPath, context);
      const transcription = await this.processTranscriptionResult(whisperResult.jsonPath);

      // 3. Gerar arquivo de legendas SRT
      subtitlesPath = await this.generateSRTFile(transcription.segments);

      // 4. Gerar vídeo com legendas usando FFmpeg
      const videoResult = hardcodedSubs 
        ? await this.videoService.addHardcodedSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath,
            subtitleStyle
          })
        : await this.videoService.addSoftSubtitles({
            inputVideoPath: tmpVideoPath,
            subtitlesPath
          });

      if (!videoResult.success) {
        throw new Error(videoResult.message);
      }

      outputVideoPath = videoResult.outputPath;

      // 5. Ler arquivo de vídeo como buffer
      const videoBuffer = await fs.readFile(outputVideoPath);

      return {
        transcription,
        videoBuffer,
        videoPath: outputVideoPath,
        subtitlesPath,
        success: true,
        message: videoResult.message
      };

    } catch (error) {
      return {
        transcription: null,
        videoBuffer: null,
        videoPath: null,
        subtitlesPath: null,
        success: false,
        message: `Erro ao processar vídeo: ${error instanceof Error ? error.message : String(error)}`
      };

    } finally {
      // Limpeza (mantém o vídeo final temporariamente para download)
      if (tmpVideoPath) {
        await this.fileService.cleanup(tmpVideoPath);
      }
      if (subtitlesPath) {
        await this.videoService.cleanup(subtitlesPath);
      }
      // outputVideoPath será limpo depois do download
    }
  }

  /**
   * Gera um arquivo SRT a partir dos segmentos de transcrição
   */
  private async generateSRTFile(segments: any[]): Promise<string> {
    console.log(`🔍 generateSRTFile: Processando ${segments.length} segmentos`);
    console.log(`🔍 generateSRTFile: Primeiro segmento completo:`, JSON.stringify(segments[0], null, 2));
    
    const srtContent = segments.map((segment, index) => {
      const startTime = this.formatTimeForSRT(segment.start);
      const endTime = this.formatTimeForSRT(segment.end);
      
      console.log(`🔍 generateSRTFile: Segmento ${index + 1} - Texto: "${segment.text}"`);
      
      // Quebrar texto longo em múltiplas linhas para melhor legibilidade
      const formattedText = this.formatSubtitleText(segment.text);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${formattedText}\n`;
    }).join('\n');

    console.log(`🔍 generateSRTFile: Conteúdo SRT gerado:`);
    console.log(srtContent.substring(0, 200) + '...');

    const srtPath = join(tmpdir(), `subtitles_${randomUUID()}.srt`);
    await fs.writeFile(srtPath, srtContent, 'utf8');
    
    console.log(`TranscriptionService: Arquivo SRT gerado: ${srtPath}`);
    return srtPath;
  }

  /**
   * Gera um arquivo SRT a partir de segmentos traduzidos
   */
  private async generateSRTFileFromSegments(segments: any[]): Promise<string> {
    const srtContent = segments.map((segment, index) => {
      const startTime = this.formatTimeForSRT(segment.start);
      const endTime = this.formatTimeForSRT(segment.end);
      
      // Quebrar texto longo em múltiplas linhas para melhor legibilidade
      const formattedText = this.formatSubtitleText(segment.text);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${formattedText}\n`;
    }).join('\n');

    const srtPath = join(tmpdir(), `translated_subtitles_${randomUUID()}.srt`);
    await fs.writeFile(srtPath, srtContent, 'utf8');
    
    console.log(`TranscriptionService: Arquivo SRT traduzido gerado: ${srtPath}`);
    return srtPath;
  }

  /**
   * Formata texto da legenda para melhor legibilidade
   * - Quebra linhas longas
   * - Limita a 2 linhas por segmento
   * - Máximo de 40 caracteres por linha
   */
  private formatSubtitleText(text: string): string {
    const maxCharsPerLine = 40;
    const maxLines = 2;
    
    // Remover espaços extras
    text = text.trim().replace(/\s+/g, ' ');
    
    // Se o texto é curto o suficiente, retornar como está
    if (text.length <= maxCharsPerLine) {
      return text;
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Palavra muito longa, truncar se necessário
          lines.push(word.substring(0, maxCharsPerLine));
          currentLine = '';
        }
        
        // Limitar a 2 linhas
        if (lines.length >= maxLines) {
          break;
        }
      }
    }
    
    // Adicionar a última linha se houver
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  /**
   * Formata tempo em segundos para formato SRT (HH:MM:SS,mmm)
   */
  private formatTimeForSRT(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Executa a transcrição com timeout
   */
  private async executeWithTimeout(filePath: string, context?: TranscriptionContext) {
    console.log(`⏱️ TranscriptionService: Configurando timeout de ${config.whisperTimeout / 1000}s`);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout de ${config.whisperTimeout / 1000}s no processamento`)),
        config.whisperTimeout
      );
    });

    console.log('🚀 TranscriptionService: Executando transcrição...');
    return Promise.race([
      this.whisperService.transcribe(filePath, context),
      timeoutPromise
    ]) as Promise<{ jsonPath: string; outDir: string }>;
  }

  /**
   * Processa o resultado da transcrição
   */
  private async processTranscriptionResult(jsonPath: string): Promise<TranscriptionResponse> {
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(raw);

      const language = data.language || 'unknown';
      console.log(`📍 TranscriptionService: Idioma detectado pelo Whisper: ${language}`);
      console.log('✅ TranscriptionService: Transcrição processada com sucesso');

      return {
        text: (data.text || '').trim(),
        language: language,
        segments: data.segments || []
      };

    } catch (error) {
      throw new Error(`Erro ao processar resultado da transcrição: ${error}`);
    }
  }
}
