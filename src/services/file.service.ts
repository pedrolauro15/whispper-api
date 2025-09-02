import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FileUpload } from '../types/index.js';

export class FileService {
  /**
   * Processa e salva um arquivo enviado via multipart
   */
  async processUploadedFile(fileUpload: FileUpload): Promise<string> {
    // Validar arquivo
    if (!fileUpload) {
      throw new Error('Nenhum arquivo fornecido');
    }

    // Converter para buffer
    const buffer = await fileUpload.toBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Arquivo está vazio');
    }

    console.log(`FileService: Buffer recebido com ${buffer.length} bytes`);

    // Determinar nome e extensão do arquivo
    const filename = this.generateFilename(fileUpload);
    const tmpPath = join(tmpdir(), `upload-${randomUUID()}-${filename}`);

    console.log(`FileService: Salvando em: ${tmpPath}`);

    // Salvar arquivo
    await fs.writeFile(tmpPath, buffer);

    // Verificar se foi salvo corretamente
    await this.validateSavedFile(tmpPath, buffer.length);

    return tmpPath;
  }

  /**
   * Remove um arquivo temporário
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`FileService: Arquivo removido: ${filePath}`);
    } catch (error) {
      console.warn(`FileService: Erro ao remover arquivo ${filePath}:`, error);
    }
  }

  /**
   * Gera um nome de arquivo apropriado baseado no upload
   */
  private generateFilename(fileUpload: FileUpload): string {
    let filename = fileUpload.filename || 'audio';
    
    // Se não tem extensão, adicionar baseado no mimetype
    if (!filename.includes('.')) {
      const extension = this.getExtensionFromMimeType(fileUpload.mimetype);
      filename += extension;
    }

    return filename;
  }

  /**
   * Determina a extensão do arquivo baseada no mimetype
   */
  private getExtensionFromMimeType(mimetype?: string): string {
    if (!mimetype) return '.wav';

    if (mimetype.includes('audio/')) {
      if (mimetype.includes('mpeg') || mimetype.includes('mp3')) return '.mp3';
      if (mimetype.includes('wav')) return '.wav';
      if (mimetype.includes('ogg')) return '.ogg';
      if (mimetype.includes('m4a')) return '.m4a';
      if (mimetype.includes('webm')) return '.webm';
    }

    return '.wav'; // fallback
  }

  /**
   * Valida se o arquivo foi salvo corretamente
   */
  private async validateSavedFile(filePath: string, expectedSize: number): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size === 0) {
        throw new Error('Arquivo salvo está vazio');
      }
      
      if (stats.size !== expectedSize) {
        throw new Error(`Tamanho do arquivo não confere. Esperado: ${expectedSize}, Atual: ${stats.size}`);
      }

      // Verificar acesso
      await fs.access(filePath);
      
      console.log(`FileService: Arquivo validado - ${stats.size} bytes`);
      
    } catch (error) {
      throw new Error(`Erro ao validar arquivo salvo: ${error}`);
    }
  }
}
