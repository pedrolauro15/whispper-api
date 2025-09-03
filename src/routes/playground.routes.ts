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

    /* Context Section Styles */
    .context-section {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: all 0.2s ease;
    }

    .context-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gray-800);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .context-description {
      margin: 0 0 1.5rem 0;
      color: var(--gray-600);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .context-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .context-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .context-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .context-field label {
      font-weight: 500;
      color: var(--gray-700);
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .context-field input,
    .context-field textarea,
    .context-field select {
      padding: 0.75rem;
      border: 1px solid var(--gray-300);
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      background: white;
    }

    .context-field input:focus,
    .context-field textarea:focus,
    .context-field select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .context-field textarea {
      resize: vertical;
      min-height: 60px;
    }

    .context-field small {
      color: var(--gray-500);
      font-size: 0.8rem;
      line-height: 1.3;
    }

    /* Translation Styles */
    .translation-controls {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .translation-controls h4 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gray-800);
    }

    .translation-options {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .translation-options label {
      font-weight: 500;
      color: var(--gray-700);
      font-size: 0.9rem;
    }

    .translation-options select {
      padding: 0.5rem;
      border: 1px solid var(--gray-300);
      border-radius: 6px;
      font-size: 0.9rem;
      min-width: 200px;
    }

    .translation-result {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .translation-text {
      background: var(--gray-50);
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
    }

    .translation-segments {
      max-height: 400px;
      overflow-y: auto;
    }

    .translation-segment {
      padding: 0.75rem;
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background: white;
    }

    .translation-segment-time {
      font-size: 0.8rem;
      color: var(--gray-500);
      margin-bottom: 0.5rem;
    }

    .translation-segment-original {
      color: var(--gray-600);
      font-style: italic;
      margin-bottom: 0.5rem;
    }

    .translation-segment-translated {
      color: var(--gray-800);
      font-weight: 500;
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
      margin-bottom: 1.5rem;
    }
    
    .result-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }
    
    .result-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      padding: 0.5rem 1rem;
      background: var(--gray-100);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .action-btn:hover {
      background: var(--gray-200);
    }
    
    .action-btn.primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .action-btn.primary:hover {
      background: var(--primary-dark);
    }
    
    .tabs {
      display: flex;
      border-bottom: 2px solid var(--gray-200);
      margin-bottom: 1rem;
      gap: 0.5rem;
    }
    
    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .tab:hover {
      color: var(--gray-800);
      background: var(--gray-50);
    }
    
    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: var(--gray-50);
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .text-result {
      background: var(--gray-50);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid var(--gray-200);
      font-size: 1rem;
      line-height: 1.7;
      color: var(--gray-800);
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .segments-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .segment {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    
    .segment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--gray-600);
    }
    
    .segment-time {
      font-weight: 500;
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
    }
    
    .segment-text {
      color: var(--gray-800);
      line-height: 1.6;
    }
    
    .json-result {
      background: var(--gray-900);
      color: #e5e7eb;
      padding: 1.5rem;
      border-radius: 12px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .video-section {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: var(--gray-50);
      border-radius: 12px;
      border: 1px solid var(--gray-200);
      display: none;
    }
    
    .video-section.show {
      display: block;
    }
    
    .video-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .subtitle-info {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      color: var(--primary-dark);
    }
    
    .download-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .dropdown-item {
      display: block;
      padding: 0.5rem 0.75rem;
      color: var(--gray-700);
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
      margin-bottom: 2px;
    }
    
    .dropdown-item:hover {
      background: var(--gray-100);
      color: var(--gray-800);
    }
    
    #download-menu {
      position: relative;
      cursor: pointer;
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
    
    /* Translation styles */
    .translation-section {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .translation-controls {
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 15px;
    }
    
    .language-selector {
      display: flex;
      flex-direction: column;
      min-width: 150px;
    }
    
    .language-selector label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 5px;
    }
    
    .language-selector select {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .translation-input {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 15px;
    }
    
    .translation-buttons {
      display: flex;
      gap: 10px;
    }
    
    .translation-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    
    .translation-button:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .translation-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    #translation-results {
      margin-top: 20px;
      padding: 15px;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      min-height: 50px;
    }
    
    .translation-result {
      padding: 15px;
      background: #e7f3ff;
      border-left: 4px solid #007bff;
      font-size: 16px;
      line-height: 1.5;
      margin-top: 10px;
    }
    
    .transcription-text {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .segments .segment {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 10px;
      margin: 8px 0;
    }
    
    .segments .time {
      color: #6c757d;
      font-size: 12px;
      font-weight: 600;
    }
    
    .segments .text {
      display: block;
      margin-top: 5px;
      font-size: 14px;
      line-height: 1.4;
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

      <!-- Seção de Contexto - Temporariamente desabilitada para melhor performance -->
      <!--
      <div class="context-section" id="context-section">
        <h3 class="context-title">🎯 Contexto da Transcrição (Opcional)</h3>
        <p class="context-description">
          Adicione informações para melhorar a precisão da transcrição do Whisper:
        </p>
        
        <div class="context-grid">
          <div class="context-field">
            <label for="prompt">💬 Prompt Inicial</label>
            <textarea 
              id="prompt" 
              name="prompt" 
              placeholder="Ex: Esta é uma reunião sobre desenvolvimento de software..."
              rows="2"
            ></textarea>
            <small>Orientação inicial para o modelo de transcrição</small>
          </div>

          <div class="context-field">
            <label for="vocabulary">📝 Vocabulário Específico</label>
            <input 
              type="text" 
              id="vocabulary" 
              name="vocabulary" 
              placeholder="Ex: API, JavaScript, React, Docker"
            />
            <small>Termos técnicos ou específicos separados por vírgula</small>
          </div>

          <div class="context-field">
            <label for="topic">🏷️ Tópico/Assunto</label>
            <input 
              type="text" 
              id="topic" 
              name="topic" 
              placeholder="Ex: Reunião de trabalho, Aula de programação"
            />
            <small>Contexto geral do conteúdo</small>
          </div>

          <div class="context-field">
            <label for="speaker">👤 Locutor</label>
            <input 
              type="text" 
              id="speaker" 
              name="speaker" 
              placeholder="Ex: Professor João, CEO da empresa"
            />
            <small>Informações sobre quem está falando</small>
          </div>

          <div class="context-field">
            <label for="language">🌐 Idioma</label>
            <select id="language" name="language">
              <option value="">Detectar automaticamente</option>
              <option value="pt">Português</option>
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
              <option value="fr">Francês</option>
              <option value="de">Alemão</option>
              <option value="it">Italiano</option>
              <option value="ja">Japonês</option>
              <option value="ko">Coreano</option>
              <option value="zh">Chinês</option>
            </select>
            <small>Força um idioma específico (opcional)</small>
          </div>
        </div>
      </div>
      -->
      
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
          <div class="result-actions">
            <button class="action-btn" id="copy-btn">📋 Copiar</button>
            <div class="action-btn" id="download-menu">
              📥 Download ▼
              <div class="dropdown-menu" id="dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 0.5rem; min-width: 150px; box-shadow: var(--shadow-lg); z-index: 10;">
                <a href="#" class="dropdown-item" id="download-txt">� Texto (.txt)</a>
                <a href="#" class="dropdown-item" id="download-json">📊 JSON (.json)</a>
                <a href="#" class="dropdown-item" id="download-srt">🎬 Legenda (.srt)</a>
                <a href="#" class="dropdown-item" id="download-vtt">🎭 WebVTT (.vtt)</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tabs">
          <button class="tab active" data-tab="text">📝 Texto Limpo</button>
          <button class="tab" data-tab="segments">⏱️ Segmentos</button>
          <button class="tab" data-tab="translation">🌐 Tradução</button>
          <button class="tab" data-tab="json">📊 JSON Completo</button>
        </div>
        
        <div class="tab-content active" id="tab-text">
          <div class="text-result" id="text-output"></div>
        </div>
        
        <div class="tab-content" id="tab-segments">
          <div class="segments-list" id="segments-output"></div>
        </div>
        
        <div class="tab-content" id="tab-translation">
          <div class="translation-controls">
            <h4>🌐 Traduzir Transcrição</h4>
            <div class="translation-options">
              <label for="target-language">Traduzir para:</label>
              <select id="target-language">
                <option value="">Selecione um idioma</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="en">🇺🇸 Inglês</option>
                <option value="es">🇪🇸 Espanhol</option>
                <option value="fr">🇫🇷 Francês</option>
                <option value="de">🇩🇪 Alemão</option>
                <option value="it">🇮🇹 Italiano</option>
                <option value="ru">🇷🇺 Russo</option>
                <option value="ja">🇯🇵 Japonês</option>
                <option value="ko">🇰🇷 Coreano</option>
                <option value="zh">🇨🇳 Chinês</option>
                <option value="ar">🇸🇦 Árabe</option>
                <option value="nl">🇳🇱 Holandês</option>
                <option value="pl">🇵🇱 Polonês</option>
                <option value="sv">🇸🇪 Sueco</option>
                <option value="no">🇳🇴 Norueguês</option>
                <option value="da">🇩🇰 Dinamarquês</option>
                <option value="fi">🇫🇮 Finlandês</option>
                <option value="tr">🇹🇷 Turco</option>
                <option value="he">🇮🇱 Hebraico</option>
                <option value="hi">🇮🇳 Hindi</option>
              </select>
              <button id="translate-btn" class="action-btn primary">🚀 Traduzir</button>
            </div>
          </div>
          <div class="translation-result" id="translation-output" style="display: none;">
            <div class="translation-text" id="translation-text"></div>
            <div class="translation-segments" id="translation-segments"></div>
          </div>
        </div>
        
        <div class="tab-content" id="tab-json">
          <div class="json-result" id="json-output"></div>
        </div>
        
        <div class="video-section" id="video-section">
          <h4 class="video-title">🎬 Opções de Vídeo</h4>
          <div class="subtitle-info">
            <strong>💡 Nova configuração otimizada:</strong> Legendas menores e mais compactas (fonte 18px, borda fina). Use os controles abaixo para personalizar.
          </div>
          
          <!-- Controles de personalização das legendas -->
          <div style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <h5 style="margin: 0 0 1rem 0; font-weight: 600; color: var(--gray-800);">⚙️ Personalizar Legendas</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; display: block;">Tamanho da Fonte</label>
                <select id="font-size-select" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                  <option value="14">Pequena (14px)</option>
                  <option value="16">Pequena+ (16px)</option>
                  <option value="18" selected>Padrão (18px)</option>
                  <option value="20">Média (20px)</option>
                  <option value="24">Grande (24px)</option>
                  <option value="28">Muito Grande (28px)</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; display: block;">Posição</label>
                <select id="margin-select" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                  <option value="10">Muito Baixo (10px)</option>
                  <option value="20" selected>Baixo (20px)</option>
                  <option value="30">Médio (30px)</option>
                  <option value="50">Alto (50px)</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; display: block;">Borda</label>
                <select id="border-width-select" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                  <option value="0">Sem Borda</option>
                  <option value="1" selected>Fina (1px)</option>
                  <option value="2">Normal (2px)</option>
                  <option value="3">Grossa (3px)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="download-grid">
            <button class="action-btn primary" id="generate-subtitled-video">
              🎥 Gerar Vídeo com Legendas
            </button>
            <a href="#" class="action-btn" id="download-srt-video">📥 Download SRT</a>
            <a href="#" class="action-btn" id="download-vtt-video">📥 Download VTT</a>
          </div>
        </div>
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
    const videoSection = document.getElementById('video-section');
    const copyBtn = document.getElementById('copy-btn');
    const downloadMenu = document.getElementById('download-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    // Tab elements
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const textOutput = document.getElementById('text-output');
    const segmentsOutput = document.getElementById('segments-output');
    const jsonOutput = document.getElementById('json-output');
    
    // Download elements
    const downloadTxt = document.getElementById('download-txt');
    const downloadJson = document.getElementById('download-json');
    const downloadSrt = document.getElementById('download-srt');
    const downloadVtt = document.getElementById('download-vtt');
    const downloadSrtVideo = document.getElementById('download-srt-video');
    const downloadVttVideo = document.getElementById('download-vtt-video');
    const generateSubtitledVideo = document.getElementById('generate-subtitled-video');
    
    let currentResult = null;
    let currentFile = null;
    
    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(\`tab-\${tabName}\`).classList.add('active');
      });
    });
    
    // Download menu toggle
    downloadMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
    
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
      currentFile = file;
      
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
        
        uploadIcon.textContent = file.type.startsWith('video/') ? '🎬' : '🎵';
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
      currentFile = null;
      
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
    
    function formatTime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      
      if (h > 0) {
        return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')},\${ms.toString().padStart(3, '0')}\`;
      }
      return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')},\${ms.toString().padStart(3, '0')}\`;
    }
    
    function formatTimeVTT(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      
      return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}.\${ms.toString().padStart(3, '0')}\`;
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
      
      // Campos de contexto temporariamente desabilitados para melhor performance
      /*
      const prompt = document.getElementById('prompt').value.trim();
      const vocabulary = document.getElementById('vocabulary').value.trim();
      const topic = document.getElementById('topic').value.trim();
      const speaker = document.getElementById('speaker').value.trim();
      const language = document.getElementById('language').value.trim();
      
      if (prompt) formData.append('prompt', prompt);
      if (vocabulary) formData.append('vocabulary', vocabulary);
      if (topic) formData.append('topic', topic);
      if (speaker) formData.append('speaker', speaker);
      if (language) formData.append('language', language);
      */
      
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
        
        currentResult = result;
        showStatus('✅', 'Transcrição concluída com sucesso!', 'success');
        showResults(result);
        
      } catch (error) {
        showStatus('❌', 'Erro: ' + error.message, 'error');
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
      // Text tab
      textOutput.textContent = result.text || '';
      
      // Segments tab
      if (result.segments && result.segments.length > 0) {
        segmentsOutput.innerHTML = result.segments.map(segment => \`
          <div class="segment">
            <div class="segment-header">
              <span class="segment-time">\${formatTime(segment.start)} → \${formatTime(segment.end)}</span>
              <span>Segmento #\${segment.id + 1}</span>
            </div>
            <div class="segment-text">\${segment.text}</div>
          </div>
        \`).join('');
      } else {
        segmentsOutput.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 2rem;">Nenhum segmento disponível</p>';
      }
      
      // JSON tab
      jsonOutput.textContent = JSON.stringify(result, null, 2);
      
      // Show result section
      resultSection.classList.add('show');
      
      // Show video section if it's a video file
      if (currentFile && currentFile.type.startsWith('video/')) {
        videoSection.classList.add('show');
      } else {
        videoSection.classList.remove('show');
      }
    }
    
    function hideResults() {
      resultSection.classList.remove('show');
      videoSection.classList.remove('show');
    }
    
    // Copy functionality
    copyBtn.addEventListener('click', async () => {
      const activeTab = document.querySelector('.tab.active').dataset.tab;
      let textToCopy = '';
      
      switch (activeTab) {
        case 'text':
          textToCopy = textOutput.textContent;
          break;
        case 'segments':
          textToCopy = currentResult.segments.map(s => \`[\${formatTime(s.start)} → \${formatTime(s.end)}] \${s.text}\`).join('\\n');
          break;
        case 'json':
          textToCopy = jsonOutput.textContent;
          break;
      }
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.innerHTML = '✅ Copiado!';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copiar';
        }, 2000);
      } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
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
    
    // Download functions
    function downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    function generateSRT(segments) {
      return segments.map((segment, index) => {
        const startTime = formatTime(segment.start);
        const endTime = formatTime(segment.end);
        return \`\${index + 1}\\n\${startTime} --> \${endTime}\\n\${segment.text}\\n\`;
      }).join('\\n');
    }
    
    function generateVTT(segments) {
      const header = 'WEBVTT\\n\\n';
      const content = segments.map((segment, index) => {
        const startTime = formatTimeVTT(segment.start);
        const endTime = formatTimeVTT(segment.end);
        return \`\${startTime} --> \${endTime}\\n\${segment.text}\\n\`;
      }).join('\\n');
      return header + content;
    }
    
    // Download event listeners
    downloadTxt.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.txt' : 'transcricao.txt';
        downloadFile(currentResult.text, filename, 'text/plain');
      }
    });
    
    downloadJson.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.json' : 'transcricao.json';
        downloadFile(JSON.stringify(currentResult, null, 2), filename, 'application/json');
      }
    });
    
    downloadSrt.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult && currentResult.segments) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.srt' : 'legendas.srt';
        downloadFile(generateSRT(currentResult.segments), filename, 'text/srt');
      }
    });
    
    downloadVtt.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult && currentResult.segments) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.vtt' : 'legendas.vtt';
        downloadFile(generateVTT(currentResult.segments), filename, 'text/vtt');
      }
    });
    
    downloadSrtVideo.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult && currentResult.segments) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.srt' : 'legendas.srt';
        downloadFile(generateSRT(currentResult.segments), filename, 'text/srt');
      }
    });
    
    downloadVttVideo.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentResult && currentResult.segments) {
        const filename = currentFile ? currentFile.name.replace(/\\.[^/.]+$/, '') + '.vtt' : 'legendas.vtt';
        downloadFile(generateVTT(currentResult.segments), filename, 'text/vtt');
      }
    });
    
    generateSubtitledVideo.addEventListener('click', async () => {
      if (!currentFile) {
        alert('❌ Nenhum arquivo selecionado. Por favor, selecione um vídeo primeiro.');
        return;
      }
      
      if (!currentFile.type.startsWith('video/')) {
        alert('❌ Por favor, selecione um arquivo de vídeo para gerar legendas.');
        return;
      }
      
      // Confirmar ação
      const confirmed = confirm('🎬 Gerar vídeo com legendas?\\n\\nEste processo pode demorar alguns minutos dependendo do tamanho do vídeo.\\n\\nClique OK para continuar.');
      if (!confirmed) return;
      
      const formData = new FormData();
      formData.append('file', currentFile);
      
      // Obter valores personalizados dos controles
      const fontSize = document.getElementById('font-size-select').value;
      const marginVertical = document.getElementById('margin-select').value;
      const borderWidth = document.getElementById('border-width-select').value;
      
      // UI loading state
      generateSubtitledVideo.disabled = true;
      generateSubtitledVideo.innerHTML = '⏳ Gerando vídeo...';
      showStatus('🎬', 'Processando vídeo com FFmpeg...', 'info');
      
      try {
        const response = await fetch('/video-with-subtitles?hardcoded=true&fontSize=' + fontSize + '&fontColor=%23ffffff&backgroundColor=%23000000&borderWidth=' + borderWidth + '&marginVertical=' + marginVertical, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro desconhecido');
        }
        
        // Download do vídeo
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.name.replace(/\\.[^/.]+$/, '') + '_with_subtitles.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('✅', 'Vídeo com legendas gerado e baixado com sucesso!', 'success');
        
      } catch (error) {
        console.error('Erro ao gerar vídeo:', error);
        showStatus('❌', 'Erro: ' + error.message, 'error');
        
        // Mostrar informações adicionais se for erro de FFmpeg
        if (error.message.includes('FFmpeg')) {
          alert('❌ Erro do FFmpeg\\n\\nPara usar esta funcionalidade, você precisa ter o FFmpeg instalado no sistema.\\n\\nInstale o FFmpeg:\\n• macOS: brew install ffmpeg\\n• Ubuntu: sudo apt install ffmpeg\\n• Windows: Baixe de https://ffmpeg.org\\n\\nApós instalar, reinicie o servidor.');
        }
        
      } finally {
        generateSubtitledVideo.disabled = false;
        generateSubtitledVideo.innerHTML = '🎥 Gerar Vídeo com Legendas';
      }
    });
    
    // Translation functionality
    const translateBtn = document.getElementById('translate-btn');
    const targetLanguage = document.getElementById('target-language');
    const translationOutput = document.getElementById('translation-output');
    const translationText = document.getElementById('translation-text');
    const translationSegments = document.getElementById('translation-segments');
    
    // Traduzir transcrição
    translateBtn.addEventListener('click', async () => {
      if (!currentResult) {
        alert('Faça uma transcrição primeiro');
        return;
      }
      
      if (!targetLanguage.value) {
        alert('Selecione um idioma de destino');
        return;
      }
      
      translateBtn.disabled = true;
      translateBtn.innerHTML = '⏳ Traduzindo...';
      
      try {
        const response = await fetch('/translate/transcription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcription: currentResult,
            to: targetLanguage.value
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro na tradução');
        }
        
        // Mostrar resultado da tradução
        translationText.innerHTML = result.text;
        
        // Mostrar segmentos traduzidos
        if (result.segments && result.segments.length > 0) {
          translationSegments.innerHTML = result.segments.map(segment => \`
            <div class="segment">
              <div class="segment-header">
                <span class="segment-time">\${formatTime(segment.start)} → \${formatTime(segment.end)}</span>
              </div>
              <div class="segment-text">\${segment.text}</div>
            </div>
          \`).join('');
        } else {
          translationSegments.innerHTML = '';
        }
        
        // Mostrar seção de resultado
        translationOutput.style.display = 'block';
        
      } catch (error) {
        console.error('Erro na tradução:', error);
        alert('Erro na tradução: ' + error.message);
      } finally {
        translateBtn.disabled = false;
        translateBtn.innerHTML = '🚀 Traduzir';
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
