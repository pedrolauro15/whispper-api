import type { FastifyInstance } from 'fastify';
import { config } from '../lib/config.js';

/**
 * Gera a página de playground/teste com UI moderna
 */
function generatePlaygroundHTML(): string {
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Whisper API Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --primary-light: #818cf8;
      --success: #10b981;
      --success-dark: #059669;
      --error: #ef4444;
      --error-dark: #dc2626;
      --warning: #f59e0b;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: var(--gray-800);
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .hero {
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }
    
    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      letter-spacing: -0.025em;
    }
    
    .hero .subtitle {
      font-size: 1.25rem;
      font-weight: 300;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    
    .nav-pills {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }
    
    .nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .nav-pill:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .main-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: var(--shadow-xl);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }
    
    .config-banner {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .config-banner h3 {
      margin: 0 0 0.5rem 0;
      font-weight: 600;
      font-size: 1.125rem;
    }
    
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .config-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.75rem;
      border-radius: 12px;
      text-align: center;
    }
    
    .config-item .label {
      font-size: 0.875rem;
      opacity: 0.8;
      margin-bottom: 0.25rem;
    }
    
    .config-item .value {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .upload-zone {
      position: relative;
      border: 3px dashed var(--gray-300);
      border-radius: 16px;
      padding: 3rem 2rem;
      text-align: center;
      background: var(--gray-50);
      transition: all 0.3s ease;
      cursor: pointer;
      margin-bottom: 2rem;
    }
    
    .upload-zone:hover,
    .upload-zone.dragover {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.05);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .upload-zone.has-file {
      border-color: var(--success);
      background: rgba(16, 185, 129, 0.05);
    }
    
    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }
    
    .upload-text {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--gray-700);
      margin-bottom: 0.5rem;
    }
    
    .upload-hint {
      font-size: 0.875rem;
      color: var(--gray-500);
    }
    
    .file-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    
    .file-info {
      display: none;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .file-info.show {
      display: block;
    }
    
    .file-name {
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 0.25rem;
    }
    
    .file-details {
      font-size: 0.875rem;
      color: var(--gray-500);
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 1.125rem;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      position: relative;
      overflow: hidden;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      box-shadow: var(--shadow);
    }
    
    .btn.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .btn.primary:active {
      transform: translateY(0);
    }
    
    .btn .loader {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .btn.loading .loader {
      display: block;
    }
    
    .btn.loading .btn-text {
      display: none;
    }
    
    .status-card {
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      display: none;
      align-items: center;
      gap: 0.75rem;
    }
    
    .status-card.show {
      display: flex;
    }
    
    .status-card.success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-dark);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-card.error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-dark);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .status-card.info {
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-dark);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    
    .result-section {
      margin-top: 2rem;
      display: none;
    }
    
    .result-section.show {
      display: block;
    }
    
    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    
    .result-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }
    
    .copy-btn {
      padding: 0.5rem 1rem;
      background: var(--gray-100);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .copy-btn:hover {
      background: var(--gray-200);
    }
    
    .result-content {
      background: var(--gray-900);
      color: #e5e7eb;
      padding: 1.5rem;
      border-radius: 12px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      overflow-x: auto;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .footer {
      margin-top: 3rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .footer a {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }
      
      .hero h1 {
        font-size: 2rem;
      }
      
      .main-card {
        padding: 1.5rem;
      }
      
      .config-grid {
        grid-template-columns: 1fr;
      }
      
      .nav-pills {
        flex-direction: column;
        align-items: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>🎤 Whisper API</h1>
      <p class="subtitle">Transcrição inteligente de áudio e vídeo com IA</p>
      
      <div class="nav-pills">
        <a href="/docs" target="_blank" class="nav-pill">
          📚 <span>Documentação</span>
        </a>
        <a href="https://github.com/openai/whisper" target="_blank" class="nav-pill">
          🔗 <span>OpenAI Whisper</span>
        </a>
      </div>
    </div>

    <div class="main-card">
      <div class="config-banner">
        <h3>⚙️ Configuração Atual</h3>
        <div class="config-grid">
          <div class="config-item">
            <div class="label">Modelo</div>
            <div class="value">${config.model}</div>
          </div>
          <div class="config-item">
            <div class="label">Idioma</div>
            <div class="value">${config.language || 'Auto-detecção'}</div>
          </div>
          <div class="config-item">
            <div class="label">Tamanho máx.</div>
            <div class="value">${Math.round(config.maxFileSize / 1024 / 1024)}MB</div>
          </div>
        </div>
      </div>
      
      <div class="upload-zone" id="upload-zone">
        <div class="upload-icon">📁</div>
        <div class="upload-text">Arraste um arquivo ou clique para selecionar</div>
        <div class="upload-hint">Suporte para MP3, WAV, M4A, OGG, WebM, MP4 e outros formatos</div>
        <input 
          id="file" 
          type="file" 
          class="file-input"
          accept="audio/*,video/*" 
          title="Formatos suportados: MP3, WAV, M4A, OGG, WebM, MP4, etc."
        />
        
        <div class="file-info" id="file-info">
          <div class="file-name" id="file-name"></div>
          <div class="file-details" id="file-details"></div>
        </div>
      </div>
      
      <button class="btn primary" id="transcribe-btn">
        <div class="loader"></div>
        <span class="btn-text">
          🚀 <span>Iniciar Transcrição</span>
        </span>
      </button>
      
      <div class="status-card" id="status">
        <span id="status-icon"></span>
        <span id="status-text"></span>
      </div>
      
      <div class="result-section" id="result-section">
        <div class="result-header">
          <h3 class="result-title">📝 Resultado da Transcrição</h3>
          <button class="copy-btn" id="copy-btn">📋 Copiar</button>
        </div>
        <div class="result-content" id="output"></div>
      </div>
    </div>

    <div class="footer">
      <p>
        Powered by <a href="https://github.com/openai/whisper" target="_blank">OpenAI Whisper</a> • 
        Processamento local e seguro
      </p>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('file');
    const uploadZone = document.getElementById('upload-zone');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileDetails = document.getElementById('file-details');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const statusCard = document.getElementById('status');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const resultSection = document.getElementById('result-section');
    const outputDiv = document.getElementById('output');
    const copyBtn = document.getElementById('copy-btn');
    
    // Drag and drop handlers
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect();
      }
    });
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    function handleFileSelect() {
      const file = fileInput.files[0];
      
      if (file) {
        // Update upload zone
        uploadZone.classList.add('has-file');
        
        // Show file info
        fileName.textContent = file.name;
        fileDetails.textContent = \`\${formatFileSize(file.size)} • \${file.type || 'Tipo desconhecido'}\`;
        fileInfo.classList.add('show');
        
        // Update upload zone content
        const uploadIcon = uploadZone.querySelector('.upload-icon');
        const uploadText = uploadZone.querySelector('.upload-text');
        const uploadHint = uploadZone.querySelector('.upload-hint');
        
        uploadIcon.textContent = '✅';
        uploadText.textContent = 'Arquivo selecionado!';
        uploadHint.textContent = 'Clique em "Iniciar Transcrição" para processar';
        
        // Clear previous results
        hideStatus();
        hideResults();
      } else {
        resetUploadZone();
      }
    }
    
    function resetUploadZone() {
      uploadZone.classList.remove('has-file');
      fileInfo.classList.remove('show');
      
      const uploadIcon = uploadZone.querySelector('.upload-icon');
      const uploadText = uploadZone.querySelector('.upload-text');
      const uploadHint = uploadZone.querySelector('.upload-hint');
      
      uploadIcon.textContent = '📁';
      uploadText.textContent = 'Arraste um arquivo ou clique para selecionar';
      uploadHint.textContent = 'Suporte para MP3, WAV, M4A, OGG, WebM, MP4 e outros formatos';
    }
    
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Transcription handler
    transcribeBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      
      if (!file) {
        showStatus('⚠️', 'Por favor, selecione um arquivo primeiro.', 'error');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        showStatus('❌', 'Tipo de arquivo inválido. Selecione um arquivo de áudio ou vídeo.', 'error');
        return;
      }
      
      // Validate file size
      if (file.size > ${config.maxFileSize}) {
        showStatus('❌', \`Arquivo muito grande. Máximo: \${Math.round(${config.maxFileSize} / 1024 / 1024)}MB\`, 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      // UI loading state
      setLoadingState(true);
      showStatus('📤', 'Enviando arquivo...', 'info');
      hideResults();
      
      try {
        showStatus('🤖', 'Processando com Whisper AI...', 'info');
        
        const response = await fetch('/transcribe', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || result.detail || 'Erro desconhecido');
        }
        
        showStatus('✅', 'Transcrição concluída com sucesso!', 'success');
        showResults(result);
        
      } catch (error) {
        showStatus('❌', \`Erro: \${error.message}\`, 'error');
        console.error('Erro na transcrição:', error);
        
      } finally {
        setLoadingState(false);
      }
    });
    
    function setLoadingState(loading) {
      transcribeBtn.disabled = loading;
      transcribeBtn.classList.toggle('loading', loading);
    }
    
    function showStatus(icon, message, type) {
      statusIcon.textContent = icon;
      statusText.textContent = message;
      statusCard.className = \`status-card show \${type}\`;
    }
    
    function hideStatus() {
      statusCard.classList.remove('show');
    }
    
    function showResults(result) {
      // Format result with syntax highlighting
      const formattedResult = JSON.stringify(result, null, 2);
      outputDiv.textContent = formattedResult;
      resultSection.classList.add('show');
    }
    
    function hideResults() {
      resultSection.classList.remove('show');
    }
    
    // Copy to clipboard functionality
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(outputDiv.textContent);
        copyBtn.innerHTML = '✅ Copiado!';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copiar';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = outputDiv.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyBtn.innerHTML = '✅ Copiado!';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copiar';
        }, 2000);
      }
    });
    
    // Initialize
    hideStatus();
    hideResults();
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
