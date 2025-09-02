import type { FastifyInstance } from 'fastify';
import { config } from '../lib/config.js';

/**
 * Gera a página de playground/teste
 */
function generatePlaygroundHTML(): string {
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Whisper API Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --primary: #111827;
      --primary-hover: #1f2937;
      --success: #059669;
      --error: #dc2626;
      --border: #e5e7eb;
      --bg-code: #0b1020;
      --text-code: #d1e7ff;
      --gray: #6b7280;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      background: #fafafa;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--border);
    }
    
    h1 {
      color: var(--primary);
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
    }
    
    nav a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    nav a:hover {
      background: var(--primary);
      color: white;
    }
    
    .card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--primary);
    }
    
    input[type=file] {
      width: 100%;
      padding: 12px;
      border: 2px dashed var(--border);
      border-radius: 8px;
      background: #f9fafb;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    
    input[type=file]:hover {
      border-color: var(--primary);
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 16px;
      width: 100%;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn.primary {
      background: var(--primary);
      color: white;
    }
    
    .btn.primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    
    .status {
      margin: 16px 0;
      padding: 12px;
      border-radius: 8px;
      font-weight: 500;
      min-height: 20px;
    }
    
    .status.success {
      background: #d1fae5;
      color: var(--success);
      border: 1px solid #a7f3d0;
    }
    
    .status.error {
      background: #fee2e2;
      color: var(--error);
      border: 1px solid #fca5a5;
    }
    
    .result {
      margin-top: 24px;
    }
    
    .result h3 {
      margin: 0 0 12px 0;
      color: var(--primary);
    }
    
    pre {
      white-space: pre-wrap;
      background: var(--bg-code);
      color: var(--text-code);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }
    
    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      color: var(--gray);
      text-align: center;
      font-size: 14px;
    }
    
    .config-info {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .config-info strong {
      color: var(--primary);
    }
  </style>
</head>
<body>
  <header>
    <h1>🎤 Whisper API Playground</h1>
    <nav>
      <a href="/docs" target="_blank">📚 API Docs</a>
    </nav>
  </header>

  <div class="card">
    <div class="config-info">
      <strong>Configuração atual:</strong><br>
      Modelo: <strong>${config.model}</strong> • 
      Idioma: <strong>${config.language || 'Auto-detecção'}</strong> • 
      Tamanho máximo: <strong>${Math.round(config.maxFileSize / 1024 / 1024)}MB</strong>
    </div>
    
    <div class="form-group">
      <label for="file">Selecione um arquivo de áudio ou vídeo:</label>
      <input 
        id="file" 
        type="file" 
        accept="audio/*,video/*" 
        title="Formatos suportados: MP3, WAV, M4A, OGG, WebM, MP4, etc."
      />
    </div>
    
    <button class="btn primary" id="transcribe-btn">
      🎯 Transcrever Arquivo
    </button>
    
    <div id="status" class="status"></div>
    
    <div class="result">
      <h3>📝 Resultado da Transcrição</h3>
      <pre id="output"></pre>
    </div>
  </div>

  <footer>
    <p>
      Whisper API • Processamento local de áudio • 
      <a href="https://github.com/openai/whisper" target="_blank">Powered by OpenAI Whisper</a>
    </p>
  </footer>

  <script>
    const fileInput = document.getElementById('file');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const statusDiv = document.getElementById('status');
    const outputPre = document.getElementById('output');
    
    // Resetar interface quando arquivo muda
    fileInput.addEventListener('change', () => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
      outputPre.textContent = '';
    });
    
    // Handler do botão de transcrição
    transcribeBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      
      if (!file) {
        showStatus('⚠️ Por favor, selecione um arquivo primeiro.', 'error');
        return;
      }
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        showStatus('❌ Tipo de arquivo inválido. Selecione um arquivo de áudio ou vídeo.', 'error');
        return;
      }
      
      // Validar tamanho
      if (file.size > ${config.maxFileSize}) {
        showStatus(\`❌ Arquivo muito grande. Máximo: \${Math.round(${config.maxFileSize} / 1024 / 1024)}MB\`, 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      // UI de loading
      transcribeBtn.disabled = true;
      transcribeBtn.textContent = '⏳ Processando...';
      showStatus('📤 Enviando arquivo...', '');
      outputPre.textContent = '';
      
      try {
        showStatus('🤖 Processando com Whisper...', '');
        
        const response = await fetch('/transcribe', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || result.detail || 'Erro desconhecido');
        }
        
        showStatus('✅ Transcrição concluída com sucesso!', 'success');
        outputPre.textContent = JSON.stringify(result, null, 2);
        
      } catch (error) {
        showStatus(\`❌ Erro: \${error.message}\`, 'error');
        outputPre.textContent = \`Erro detalhado: \${error.message}\`;
        console.error('Erro na transcrição:', error);
        
      } finally {
        transcribeBtn.disabled = false;
        transcribeBtn.textContent = '🎯 Transcrever Arquivo';
      }
    });
    
    function showStatus(message, type) {
      statusDiv.textContent = message;
      statusDiv.className = \`status \${type}\`;
    }
  </script>
</body>
</html>`;
}

/**
 * Registra a rota do playground
 */
export async function playgroundRoutes(fastify: FastifyInstance) {
  fastify.get('/playground', async (req, reply) => {
    return reply.type('text/html; charset=utf-8').send(generatePlaygroundHTML());
  });
  
  // Redirecionar root para playground
  fastify.get('/', async (req, reply) => {
    return reply.redirect('/playground');
  });
}
