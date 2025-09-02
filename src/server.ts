import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { configDotenv } from 'dotenv';
import Fastify from 'fastify';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

configDotenv();

const app = Fastify({ logger: true });

// ✅ multipart configuração mais simples
await app.register(multipart, {
  limits: { files: 1, fileSize: 50 * 1024 * 1024 }
}); // Doc: attachFieldsToBody 'keyValues'. :contentReference[oaicite:2]{index=2}

await app.register(swagger, {
  openapi: {
    info: { title: 'Whisper Local API', version: '1.0.0' },
    components: {},
  }
});
await app.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: true }
});

// Configs
const WHISPER_BIN = process.env.WHISPER_BIN || 'whisper-ctranslate2'; // mais rápido
const FALLBACK_BIN = 'whisper';                                       // oficial
const MODEL = process.env.WHISPER_MODEL || 'base';
const LANGUAGE = process.env.WHISPER_LANG || ''; // 'pt' ou '' (auto)

function runWhisperCLI(inputPath: string) {
  return new Promise<{ jsonPath: string; outDir: string }>((resolve, reject) => {
    try {
      console.log(`runWhisperCLI: Verificando arquivo de entrada: ${inputPath}`);
      
      // Verificar se o arquivo existe antes de tentar processar
      const fs = require('fs');
      if (!fs.existsSync(inputPath)) {
        console.log(`runWhisperCLI: ERRO - Arquivo não existe: ${inputPath}`);
        return reject(new Error(`Arquivo de entrada não existe: ${inputPath}`));
      }
      
      const stats = fs.statSync(inputPath);
      console.log(`runWhisperCLI: Arquivo existe, tamanho: ${stats.size} bytes`);

      const tmpDirPath = tmpdir();
      console.log(`runWhisperCLI: tmpdir path: ${tmpDirPath}`);

      if(!fs.existsSync(tmpDirPath)) {
        console.log(`runWhisperCLI: Criando diretório tmpdir: ${tmpDirPath}`);
        fs.mkdirSync(tmpDirPath, { recursive: true });
      }
      
      const outDir = join(tmpDirPath, `whisper-out-${randomUUID()}`);
      const base = basename(inputPath).replace(/\.[^/.]+$/, '');
      const args = [inputPath, '--output_format', 'json', '--output_dir', outDir, '--model', MODEL];
      if (LANGUAGE) args.push('--language', LANGUAGE);

      console.log(`runWhisperCLI: Executando comando: ${WHISPER_BIN} ${args.join(' ')}`);
      console.log(`runWhisperCLI: Diretório de saída: ${outDir}`);
      console.log(`runWhisperCLI: Base filename: ${base}`);

      // Criar o diretório de saída se não existir
      if (!fs.existsSync(outDir)) {
        console.log(`runWhisperCLI: Criando diretório de saída: ${outDir}`);
        try {
          fs.mkdirSync(outDir, { recursive: true });
          console.log(`runWhisperCLI: Diretório de saída criado com sucesso`);
        } catch (dirError) {
          console.log(`runWhisperCLI: Erro ao criar diretório de saída:`, dirError);
          return reject(new Error(`Erro ao criar diretório de saída: ${dirError}`));
        }
      }

      console.log(`runWhisperCLI: Iniciando spawn do processo ${WHISPER_BIN}`);

      const p = spawn(WHISPER_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      let stdout = '';
      let stderr = '';
      
      p.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`runWhisperCLI STDOUT: ${data.toString()}`);
      });
      
      p.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.log(`runWhisperCLI STDERR: ${data.toString()}`);
      });

      p.on('error', (err) => {
        console.log(`runWhisperCLI: Erro com ${WHISPER_BIN}, tentando ${FALLBACK_BIN}:`, err.message);
        console.log(`runWhisperCLI: stdout até agora: ${stdout}`);
        console.log(`runWhisperCLI: stderr até agora: ${stderr}`);
        
        console.log(`runWhisperCLI: Iniciando spawn do processo fallback ${FALLBACK_BIN}`);
        
        const p2 = spawn(FALLBACK_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        
        let stdout2 = '';
        let stderr2 = '';
        
        p2.stdout?.on('data', (data) => {
          stdout2 += data.toString();
          console.log(`runWhisperCLI (fallback) STDOUT: ${data.toString()}`);
        });
        
        p2.stderr?.on('data', (data) => {
          stderr2 += data.toString();
          console.log(`runWhisperCLI (fallback) STDERR: ${data.toString()}`);
        });
        
        p2.on('error', (err2) => {
          console.log(`runWhisperCLI: Erro com ${FALLBACK_BIN}:`, err2.message);
          console.log(`runWhisperCLI: stdout2: ${stdout2}`);
          console.log(`runWhisperCLI: stderr2: ${stderr2}`);
          reject(new Error(`Ambos whisper binários falharam. ${WHISPER_BIN}: ${err.message}, ${FALLBACK_BIN}: ${err2.message}`));
        });
        
        p2.on('close', (code) => {
          console.log(`runWhisperCLI: ${FALLBACK_BIN} terminou com código: ${code}`);
          console.log(`runWhisperCLI: stdout final: ${stdout2}`);
          console.log(`runWhisperCLI: stderr final: ${stderr2}`);
          
          if (code !== 0) {
            return reject(new Error(`whisper fallback exited ${code}. stderr: ${stderr2}`));
          }
          
          const jsonPath = join(outDir, `${base}.json`);
          console.log(`runWhisperCLI: JSON esperado em: ${jsonPath}`);
          
          // Verificar se o arquivo JSON foi criado
          if (!fs.existsSync(jsonPath)) {
            return reject(new Error(`Arquivo JSON não foi criado: ${jsonPath}`));
          }
          
          resolve({ jsonPath, outDir });
        });
      });
      
      p.on('close', (code) => {
        console.log(`runWhisperCLI: ${WHISPER_BIN} terminou com código: ${code}`);
        console.log(`runWhisperCLI: stdout final: ${stdout}`);
        console.log(`runWhisperCLI: stderr final: ${stderr}`);
        
        if (code !== 0) {
          return reject(new Error(`whisper exited ${code}. stderr: ${stderr}`));
        }
        
        const jsonPath = join(outDir, `${base}.json`);
        console.log(`runWhisperCLI: JSON esperado em: ${jsonPath}`);
        
        // Verificar se o arquivo JSON foi criado
        if (!fs.existsSync(jsonPath)) {
          return reject(new Error(`Arquivo JSON não foi criado: ${jsonPath}`));
        }
        
        resolve({ jsonPath, outDir });
      });

      console.log(`runWhisperCLI: Processo ${WHISPER_BIN} iniciado com PID: ${p.pid}`);
      
    } catch (syncError) {
      console.log(`runWhisperCLI: Erro síncrono na função:`, syncError);
      reject(new Error(`Erro síncrono na runWhisperCLI: ${syncError}`));
    }
  });
}

// ✅ OpenAPI 3: requestBody com multipart/form-data (arquivo binário)
const transcribeSchema = {
  summary: 'Transcreve um áudio via Whisper CLI',
  tags: ['transcription'],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' }
          },
          required: ['file']
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        segments: { type: 'array', items: { type: 'object' } }
      }
    }
  }
};

app.post('/transcribe', { schema: transcribeSchema as any }, async (req: any, reply) => {
  let tmpPath: string | null = null;
  
  try {
    req.log.info('Recebido request de transcrição');
    
    // Usar o método padrão do Fastify multipart
    const data = await req.file();
    
    if (!data) {
      req.log.error('Nenhum arquivo recebido');
      return reply.code(400).send({ error: 'nenhum arquivo enviado' });
    }
    
    req.log.info('Arquivo recebido:', {
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding
    });
    
    // Ler o arquivo em buffer
    const buffer = await data.toBuffer();
    
    if (!buffer || buffer.length === 0) {
      req.log.error('Buffer do arquivo está vazio');
      return reply.code(400).send({ error: 'arquivo vazio' });
    }
    
    req.log.info(`Buffer recebido com ${buffer.length} bytes`);
    
    // Garantir extensão apropriada baseada no mimetype ou filename
    let filename = data.filename || 'audio';
    if (!filename.includes('.')) {
      // Se não tem extensão, adicionar baseado no mimetype
      if (data.mimetype?.includes('audio/')) {
        if (data.mimetype.includes('mpeg') || data.mimetype.includes('mp3')) {
          filename += '.mp3';
        } else if (data.mimetype.includes('wav')) {
          filename += '.wav';
        } else if (data.mimetype.includes('ogg')) {
          filename += '.ogg';
        } else if (data.mimetype.includes('m4a')) {
          filename += '.m4a';
        } else {
          filename += '.wav'; // fallback
        }
      } else {
        filename += '.wav'; // fallback para outros tipos
      }
    }
    
    tmpPath = join(tmpdir(), `upload-${randomUUID()}-${filename}`);
    
    req.log.info(`Salvando arquivo temporário: ${tmpPath}`);
    
    // Salvar o Buffer no arquivo temporário
    await fs.writeFile(tmpPath, buffer);
    
    // Verificar se o arquivo foi criado E existe
    let stats;
    try {
      stats = await fs.stat(tmpPath);
      req.log.info(`Arquivo criado com sucesso. Tamanho: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('Arquivo criado mas está vazio');
      }
      
      // Verificar se o arquivo ainda existe antes de passar para o Whisper
      await fs.access(tmpPath);
      req.log.info('Arquivo confirmado existente e acessível');
      
    } catch (e) {
      req.log.error('Erro ao verificar arquivo criado:', e);
      return reply.code(500).send({ error: 'erro ao salvar arquivo temporário', detail: String(e) });
    }

    try {
      req.log.info(`Iniciando processamento do Whisper com arquivo: ${tmpPath}`);
      
      // Verificar novamente se o arquivo existe antes do processamento
      await fs.access(tmpPath);
      req.log.info('Arquivo confirmado acessível antes do Whisper');
      
      req.log.info('Chamando runWhisperCLI...');
      
      // Adicionar timeout para debug
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de 30 segundos no runWhisperCLI')), 30000);
      });
      
      const result = await Promise.race([
        runWhisperCLI(tmpPath),
        timeoutPromise
      ]) as { jsonPath: string; outDir: string };
      
      req.log.info(`Whisper processado. JSON em: ${result.jsonPath}`);
      
      const raw = await fs.readFile(result.jsonPath, 'utf8');
      const data = JSON.parse(raw);
      
      req.log.info('Transcrição concluída com sucesso');
      return reply.send({ text: (data.text || '').trim(), segments: data.segments || [] });
    } catch (e: any) {
      req.log.error('Erro na transcrição:', {
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
        error: e
      });
      
      // Verificar se o arquivo ainda existe após o erro
      try {
        await fs.access(tmpPath);
        req.log.info('Arquivo ainda existe após erro do Whisper');
      } catch {
        req.log.error('Arquivo foi deletado ou não existe mais após erro do Whisper');
      }
      
      return reply.code(500).send({ error: 'falha na transcrição', detail: e?.message });
    }
  } catch (e: any) {
    req.log.error('Erro geral no endpoint:', e);
    return reply.code(500).send({ error: 'erro interno do servidor', detail: e?.message });
  } finally {
    // Cleanup do arquivo temporário apenas se foi criado
    if (tmpPath) {
      try {
        await fs.unlink(tmpPath);
        req.log.info(`Arquivo temporário deletado: ${tmpPath}`);
      } catch (e) {
        req.log.warn('Erro ao deletar arquivo temporário:', e);
      }
    }
  }
});

// Página de teste simples
app.get('/playground', async (req, reply) => {
  const html = `
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Whisper Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{font-family:ui-sans-serif,system-ui,Arial;padding:24px;max-width:800px;margin:0 auto}
    header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px}
    .btn{padding:10px 14px;border:0;border-radius:10px;cursor:pointer}
    .primary{background:#111827;color:#fff}
    pre{white-space:pre-wrap;background:#0b1020;color:#d1e7ff;padding:12px;border-radius:8px}
    footer{margin-top:16px;color:#6b7280}
    input[type=file]{padding:8px}
  </style>
</head>
<body>
  <header>
    <h1>Whisper Playground</h1>
    <nav><a href="/docs" target="_blank">Swagger UI</a></nav>
  </header>

  <div class="card">
    <p>Envie um áudio (mp3, wav, m4a, ogg, webm...).</p>
    <input id="file" type="file" accept="audio/*,video/*" />
    <button class="btn primary" id="send">Transcrever</button>
    <p id="status"></p>
    <h3>Resultado</h3>
    <pre id="out"></pre>
  </div>

  <footer>Modelo: ${MODEL} • Idioma: ${LANGUAGE || 'auto'}</footer>

  <script>
    const sendBtn = document.getElementById('send');
    const fileInput = document.getElementById('file');
    const out = document.getElementById('out');
    const status = document.getElementById('status');
    
    sendBtn.onclick = async () => {
      const f = fileInput.files[0];
      if (!f) { 
        alert('Selecione um arquivo.'); 
        return; 
      }
      
      // Verificar se é um arquivo de áudio/vídeo
      if (!f.type.startsWith('audio/') && !f.type.startsWith('video/')) {
        alert('Por favor, selecione um arquivo de áudio ou vídeo.');
        return;
      }
      
      const fd = new FormData();
      fd.append('file', f);
      
      sendBtn.disabled = true;
      sendBtn.textContent = 'Transcrevendo...';
      status.textContent = 'Enviando arquivo...';
      out.textContent = '';
      
      try {
        status.textContent = 'Processando transcrição...';
        const res = await fetch('/transcribe', { 
          method: 'POST', 
          body: fd 
        });
        
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error || json.detail || res.statusText);
        }
        
        out.textContent = JSON.stringify(json, null, 2);
        status.textContent = 'Transcrição concluída com sucesso!';
        status.style.color = 'green';
      } catch (e) {
        status.textContent = 'Erro: ' + e.message;
        status.style.color = 'red';
        out.textContent = 'Erro detalhado: ' + e.message;
        console.error('Erro na transcrição:', e);
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Transcrever';
      }
    };
    
    // Reset status color when selecting new file
    fileInput.onchange = () => {
      status.textContent = '';
      status.style.color = '';
      out.textContent = '';
    };
  </script>
</body>
</html>`;
  return reply.type('text/html; charset=utf-8').send(html);
});

// sobe
await app.ready();
app.swagger();
const port = Number(process.env.PORT || 3333);
app.listen({ port, host: '0.0.0.0' }).catch((e) => { app.log.error(e); process.exit(1); });
