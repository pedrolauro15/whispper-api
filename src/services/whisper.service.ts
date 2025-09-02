import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fsSync from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { config } from '../lib/config.js';
import type { TranscriptionContext, WhisperResult } from '../types/index.js';

export class WhisperService {
  private readonly whisperBin: string;
  private readonly fallbackBin: string;
  private readonly model: string;
  private readonly language: string;

  constructor() {
    this.whisperBin = config.whisperBin;
    this.fallbackBin = config.fallbackBin;
    this.model = config.model;
    this.language = config.language;
  }

  /**
   * Processa um arquivo de áudio usando o Whisper CLI
   */
  async transcribe(inputPath: string, context?: TranscriptionContext): Promise<WhisperResult> {
    return new Promise<WhisperResult>((resolve, reject) => {
      try {
        this.validateInputFile(inputPath);
        
        const { outDir, base, args } = this.prepareWhisperCommand(inputPath, context);
        
        this.executeWhisper(args, outDir, base, resolve, reject);
        
      } catch (error) {
        console.error('WhisperService: Erro síncrono:', error);
        reject(new Error(`Erro no WhisperService: ${error}`));
      }
    });
  }

  /**
   * Valida se o arquivo de entrada existe e é válido
   */
  private validateInputFile(inputPath: string): void {
    console.log(`WhisperService: Verificando arquivo: ${inputPath}`);
    
    if (!fsSync.existsSync(inputPath)) {
      throw new Error(`Arquivo não existe: ${inputPath}`);
    }
    
    const stats = fsSync.statSync(inputPath);
    console.log(`WhisperService: Arquivo válido, tamanho: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      throw new Error('Arquivo está vazio');
    }
  }

  /**
   * Prepara o comando e diretórios para execução do Whisper
   */
  private prepareWhisperCommand(inputPath: string, context?: TranscriptionContext) {
    const tmpDirPath = tmpdir();
    
    // Garantir que o diretório temporário existe
    if (!fsSync.existsSync(tmpDirPath)) {
      console.log(`WhisperService: Criando tmpdir: ${tmpDirPath}`);
      fsSync.mkdirSync(tmpDirPath, { recursive: true });
    }
    
    const outDir = join(tmpDirPath, `whisper-out-${randomUUID()}`);
    const base = basename(inputPath).replace(/\.[^/.]+$/, '');
    const args = [
      inputPath,
      '--output_format', 'json',
      '--output_dir', outDir,
      '--model', this.model
    ];
    
    // Adicionar linguagem (prioridade: contexto > configuração padrão)
    const language = context?.language || this.language;
    if (language) {
      args.push('--language', language);
    }

    // Adicionar prompt/contexto se fornecido
    if (context?.prompt) {
      args.push('--initial_prompt', context.prompt);
      console.log(`WhisperService: Usando prompt: "${context.prompt}"`);
    }

    // Adicionar vocabulário personalizado como prompt adicional
    if (context?.vocabulary && context.vocabulary.length > 0) {
      const vocabularyPrompt = `Vocabulário importante: ${context.vocabulary.join(', ')}.`;
      const finalPrompt = context.prompt 
        ? `${context.prompt} ${vocabularyPrompt}`
        : vocabularyPrompt;
      
      // Substituir ou adicionar o prompt com vocabulário
      const promptIndex = args.indexOf('--initial_prompt');
      if (promptIndex !== -1) {
        args[promptIndex + 1] = finalPrompt;
      } else {
        args.push('--initial_prompt', finalPrompt);
      }
      
      console.log(`WhisperService: Vocabulário adicionado: ${context.vocabulary.join(', ')}`);
    }

    // Adicionar informações sobre tópico e locutor ao prompt
    if (context?.topic || context?.speaker) {
      let contextPrompt = '';
      
      if (context.topic) {
        contextPrompt += `Tópico: ${context.topic}. `;
      }
      
      if (context.speaker) {
        contextPrompt += `Locutor: ${context.speaker}. `;
      }
      
      const promptIndex = args.indexOf('--initial_prompt');
      if (promptIndex !== -1) {
        args[promptIndex + 1] = `${contextPrompt}${args[promptIndex + 1]}`;
      } else {
        args.push('--initial_prompt', contextPrompt);
      }
      
      console.log(`WhisperService: Contexto adicional: ${contextPrompt}`);
    }

    // Criar diretório de saída
    if (!fsSync.existsSync(outDir)) {
      console.log(`WhisperService: Criando diretório de saída: ${outDir}`);
      fsSync.mkdirSync(outDir, { recursive: true });
    }

    console.log(`WhisperService: Comando: ${this.whisperBin} ${args.join(' ')}`);
    
    return { outDir, base, args };
  }

  /**
   * Executa o comando Whisper com fallback
   */
  private executeWhisper(
    args: string[],
    outDir: string,
    base: string,
    resolve: (value: WhisperResult) => void,
    reject: (reason?: any) => void
  ): void {
    console.log(`WhisperService: Iniciando ${this.whisperBin}`);
    
    const process = spawn(this.whisperBin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    
    this.handleProcess(process, this.whisperBin, outDir, base, resolve, (error) => {
      console.log(`WhisperService: Tentando fallback ${this.fallbackBin}`);
      
      const fallbackProcess = spawn(this.fallbackBin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      this.handleProcess(fallbackProcess, this.fallbackBin, outDir, base, resolve, reject);
    });
  }

  /**
   * Gerencia os eventos de um processo do Whisper
   */
  private handleProcess(
    process: ReturnType<typeof spawn>,
    binName: string,
    outDir: string,
    base: string,
    resolve: (value: WhisperResult) => void,
    reject: (reason?: any) => void
  ): void {
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
      console.log(`WhisperService ${binName} STDOUT:`, data.toString().trim());
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.log(`WhisperService ${binName} STDERR:`, data.toString().trim());
    });

    process.on('error', (error) => {
      console.log(`WhisperService: Erro no processo ${binName}:`, error.message);
      reject(new Error(`Erro ao executar ${binName}: ${error.message}`));
    });
    
    process.on('close', (code) => {
      console.log(`WhisperService: ${binName} terminou com código: ${code}`);
      
      if (code !== 0) {
        const errorMsg = `${binName} falhou (código ${code}). stderr: ${stderr}`;
        console.log(`WhisperService: ${errorMsg}`);
        return reject(new Error(errorMsg));
      }
      
      const jsonPath = join(outDir, `${base}.json`);
      
      if (!fsSync.existsSync(jsonPath)) {
        return reject(new Error(`Arquivo JSON não foi criado: ${jsonPath}`));
      }
      
      console.log(`WhisperService: Sucesso! JSON em: ${jsonPath}`);
      resolve({ jsonPath, outDir });
    });

    console.log(`WhisperService: Processo ${binName} iniciado (PID: ${process.pid})`);
  }
}
