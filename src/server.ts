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

// ✅ multipart com body "real" para validação
await app.register(multipart, {
  attachFieldsToBody: 'keyValues', // agora req.body existe e tem { file: { data: Buffer, filename, mimetype, ... } }
  limits: { files: 1, fileSize: 50 * 1024 * 1024 },
  throwFileSizeLimit: false
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
    const outDir = join(tmpdir(), `whisper-out-${randomUUID()}`);
    const base = basename(inputPath).replace(/\.[^/.]+$/, '');
    const args = [inputPath, '--output_format', 'json', '--output_dir', outDir, '--model', MODEL];
    if (LANGUAGE) args.push('--language', LANGUAGE);

    const p = spawn(WHISPER_BIN, args, { stdio: 'inherit' });
    p.on('error', () => {
      const p2 = spawn(FALLBACK_BIN, args, { stdio: 'inherit' });
      p2.on('error', reject);
      p2.on('close', (code) => {
        if (code !== 0) return reject(new Error(`whisper exited ${code}`));
        resolve({ jsonPath: join(outDir, `${base}.json`), outDir });
      });
    });
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`whisper exited ${code}`));
      resolve({ jsonPath: join(outDir, `${base}.json`), outDir });
    });
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
  try {
    const b = req.body as any;
    
    req.log.info('Recebido request de transcrição');
    req.log.info('Body keys:', Object.keys(b || {}));
    
    if (!b?.file) {
      req.log.error('Campo file ausente no body');
      return reply.code(400).send({ error: 'campo "file" ausente' });
    }
    
    req.log.info('File type:', typeof b.file);
    req.log.info('File is Buffer:', Buffer.isBuffer(b.file));
    
    // Se file é um Buffer diretamente
    let fileData: Buffer;
    let filename = 'audio';
    
    if (Buffer.isBuffer(b.file)) {
      fileData = b.file;
    } else if (b.file.data && Buffer.isBuffer(b.file.data)) {
      fileData = b.file.data;
      filename = b.file.filename || 'audio';
    } else {
      req.log.error('File não é um Buffer válido');
      return reply.code(400).send({ error: 'arquivo inválido ou vazio' });
    }

    const tmpPath = join(tmpdir(), `upload-${randomUUID()}-${filename}`);

    req.log.info(`Salvando arquivo temporário: ${tmpPath}`);
    
    // Salvar o Buffer no arquivo temporário
    await fs.writeFile(tmpPath, fileData);

    try {
      const { jsonPath } = await runWhisperCLI(tmpPath);
      const raw = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(raw);
      return reply.send({ text: (data.text || '').trim(), segments: data.segments || [] });
    } catch (e: any) {
      req.log.error('Erro na transcrição:', e);
      return reply.code(500).send({ error: 'falha na transcrição', detail: e?.message });
    } finally {
      fs.unlink(tmpPath).catch(() => {});
    }
  } catch (e: any) {
    req.log.error('Erro geral no endpoint:', e);
    return reply.code(500).send({ error: 'erro interno do servidor', detail: e?.message });
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
