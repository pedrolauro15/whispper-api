import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fsSync from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';

export interface VideoWithSubtitlesOptions {
  inputVideoPath: string;
  subtitlesPath: string;
  outputPath?: string;
  subtitleStyle?: SubtitleStyle;
  hardcodedSubs?: boolean;
}

export interface SubtitleStyle {
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  position?: 'bottom' | 'top' | 'center';
  marginVertical?: number;
}

export interface VideoResult {
  outputPath: string;
  success: boolean;
  message: string;
}

export class VideoService {
  private readonly ffmpegBin: string;

  constructor() {
    this.ffmpegBin = 'ffmpeg'; // Assumindo que ffmpeg está no PATH
  }

  /**
   * Verifica se o FFmpeg está disponível no sistema
   */
  async checkFFmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(this.ffmpegBin, ['-version'], { stdio: 'pipe' });
      
      process.on('error', () => {
        console.log('VideoService: FFmpeg não encontrado no sistema');
        resolve(false);
      });
      
      process.on('close', (code) => {
        const available = code === 0;
        console.log(`VideoService: FFmpeg ${available ? 'disponível' : 'não disponível'}`);
        resolve(available);
      });
    });
  }

  /**
   * Gera um vídeo com legendas hard-coded usando FFmpeg
   */
  async addHardcodedSubtitles(options: VideoWithSubtitlesOptions): Promise<VideoResult> {
    console.log('VideoService: Iniciando geração de vídeo com legendas...');

    // Verificar se FFmpeg está disponível
    const ffmpegAvailable = await this.checkFFmpegAvailability();
    if (!ffmpegAvailable) {
      return {
        outputPath: '',
        success: false,
        message: 'FFmpeg não está instalado ou não foi encontrado no sistema'
      };
    }

    // Validar arquivos de entrada
    if (!fsSync.existsSync(options.inputVideoPath)) {
      return {
        outputPath: '',
        success: false,
        message: `Arquivo de vídeo não encontrado: ${options.inputVideoPath}`
      };
    }

    if (!fsSync.existsSync(options.subtitlesPath)) {
      return {
        outputPath: '',
        success: false,
        message: `Arquivo de legendas não encontrado: ${options.subtitlesPath}`
      };
    }

    const outputPath = options.outputPath || this.generateOutputPath(options.inputVideoPath);
    const style = this.buildSubtitleStyle(options.subtitleStyle);

    return new Promise((resolve) => {
      const args = this.buildFFmpegArgs(options.inputVideoPath, options.subtitlesPath, outputPath, style);
      
      console.log(`VideoService: Executando FFmpeg: ${this.ffmpegBin} ${args.join(' ')}`);
      
      const process = spawn(this.ffmpegBin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
        // FFmpeg geralmente usa stderr para progress, então não logamos stdout por padrão
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
        // Log apenas se for erro, não progress
        const line = data.toString().trim();
        if (line.includes('Error') || line.includes('error')) {
          console.log(`VideoService FFmpeg STDERR:`, line);
        }
      });

      process.on('error', (error) => {
        console.log('VideoService: Erro no processo FFmpeg:', error.message);
        resolve({
          outputPath: '',
          success: false,
          message: `Erro ao executar FFmpeg: ${error.message}`
        });
      });
      
      process.on('close', (code) => {
        console.log(`VideoService: FFmpeg terminou com código: ${code}`);
        
        if (code !== 0) {
          const errorMsg = `FFmpeg falhou (código ${code}). Detalhes: ${stderr.slice(-500)}`;
          console.log(`VideoService: ${errorMsg}`);
          resolve({
            outputPath: '',
            success: false,
            message: errorMsg
          });
          return;
        }
        
        // Verificar se o arquivo foi criado
        if (!fsSync.existsSync(outputPath)) {
          resolve({
            outputPath: '',
            success: false,
            message: 'Arquivo de vídeo não foi criado pelo FFmpeg'
          });
          return;
        }
        
        const stats = fsSync.statSync(outputPath);
        console.log(`VideoService: Sucesso! Vídeo criado: ${outputPath} (${stats.size} bytes)`);
        
        resolve({
          outputPath,
          success: true,
          message: 'Vídeo com legendas gerado com sucesso'
        });
      });
    });
  }

  /**
   * Gera um vídeo com legendas soft (separadas) usando FFmpeg
   */
  async addSoftSubtitles(options: VideoWithSubtitlesOptions): Promise<VideoResult> {
    console.log('VideoService: Gerando vídeo com legendas soft...');

    const ffmpegAvailable = await this.checkFFmpegAvailability();
    if (!ffmpegAvailable) {
      return {
        outputPath: '',
        success: false,
        message: 'FFmpeg não está instalado ou não foi encontrado no sistema'
      };
    }

    // Para legendas soft, apenas copiamos streams e adicionamos a legenda como stream
    const outputPath = options.outputPath || this.generateOutputPath(options.inputVideoPath, '_with_subs');

    return new Promise((resolve) => {
      const args = [
        '-i', options.inputVideoPath,
        '-i', options.subtitlesPath,
        '-c:v', 'copy', // Copiar vídeo sem recodificar
        '-c:a', 'copy', // Copiar áudio sem recodificar
        '-c:s', 'mov_text', // Codec de legenda para MP4
        '-metadata:s:s:0', 'language=por', // Definir idioma da legenda
        '-y', // Sobrescrever arquivo de saída
        outputPath
      ];

      console.log(`VideoService: Executando FFmpeg (soft subs): ${args.join(' ')}`);
      
      const process = spawn(this.ffmpegBin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      let stderr = '';
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          resolve({
            outputPath: '',
            success: false,
            message: `FFmpeg falhou: ${stderr.slice(-500)}`
          });
          return;
        }
        
        resolve({
          outputPath,
          success: true,
          message: 'Vídeo com legendas soft gerado com sucesso'
        });
      });
    });
  }

  /**
   * Constrói os argumentos do FFmpeg para legendas hard-coded
   */
  private buildFFmpegArgs(inputVideo: string, subtitlesPath: string, outputPath: string, style: string): string[] {
    return [
      '-i', inputVideo,
      '-vf', `subtitles=${subtitlesPath}${style}`,
      '-c:a', 'copy', // Manter áudio original
      '-c:v', 'libx264', // Codec de vídeo
      '-preset', 'medium', // Preset de velocidade/qualidade
      '-crf', '23', // Qualidade (menor = melhor qualidade)
      '-y', // Sobrescrever arquivo de saída
      outputPath
    ];
  }

  /**
   * Constrói o estilo das legendas para FFmpeg
   */
  private buildSubtitleStyle(style?: SubtitleStyle): string {
    if (!style) {
      // Estilo padrão otimizado: fonte menor, mais compacta
      return ':force_style=\'FontName=Arial,FontSize=18,PrimaryColour=&Hffffff&,BackColour=&H80000000&,BorderStyle=1,BorderWidth=1,MarginV=20,Spacing=0\'';
    }

    const styleProps: string[] = [];
    
    if (style.fontName) styleProps.push(`FontName=${style.fontName}`);
    if (style.fontSize) styleProps.push(`FontSize=${style.fontSize}`);
    if (style.fontColor) styleProps.push(`PrimaryColour=${this.convertColorToASS(style.fontColor)}`);
    if (style.backgroundColor) styleProps.push(`BackColour=${this.convertColorToASS(style.backgroundColor)}`);
    if (style.borderWidth) styleProps.push(`BorderWidth=${style.borderWidth}`);
    if (style.borderColor) styleProps.push(`OutlineColour=${this.convertColorToASS(style.borderColor)}`);
    if (style.marginVertical) styleProps.push(`MarginV=${style.marginVertical}`);

    return styleProps.length > 0 ? `:force_style='${styleProps.join(',')}'` : '';
  }

  /**
   * Converte cor hex para formato ASS
   */
  private convertColorToASS(hexColor: string): string {
    // Remove # se presente
    hexColor = hexColor.replace('#', '');
    
    // Converte RGB para BGR (formato ASS)
    if (hexColor.length === 6) {
      const r = hexColor.substr(0, 2);
      const g = hexColor.substr(2, 2);
      const b = hexColor.substr(4, 2);
      return `&H${b}${g}${r}&`;
    }
    
    return '&Hffffff&'; // Branco padrão
  }

  /**
   * Gera um caminho de saída baseado no arquivo de entrada
   */
  private generateOutputPath(inputPath: string, suffix: string = '_subtitled'): string {
    const dir = tmpdir();
    const baseName = basename(inputPath, extname(inputPath));
    const ext = extname(inputPath) || '.mp4';
    const fileName = `${baseName}${suffix}_${randomUUID().slice(0, 8)}${ext}`;
    
    return join(dir, fileName);
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      if (fsSync.existsSync(filePath)) {
        fsSync.unlinkSync(filePath);
        console.log(`VideoService: Arquivo removido: ${filePath}`);
      }
    } catch (error) {
      console.error(`VideoService: Erro ao remover arquivo ${filePath}:`, error);
    }
  }
}
