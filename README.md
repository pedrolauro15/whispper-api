# Whisper API 🎤

API para transcrição de áudio usando OpenAI Whisper com interface web moderna.

## 🚀 Funcionalidades

- **Transcrição de Áudio/Vídeo**: Suporte a múltiplos formatos (MP3, WAV, M4A, OGG, WebM, MP4)
- **Interface Web**: Playground interativo para testes
- **API RESTful**: Documentação completa com Swagger
- **Processamento Robusto**: Fallback automático entre diferentes versões do Whisper
- **Upload Seguro**: Validação de arquivos e limpeza automática

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   └── config.ts          # Configurações centralizadas
├── services/
│   ├── whisper.service.ts    # Lógica do Whisper CLI
│   ├── file.service.ts       # Processamento de arquivos
│   └── transcription.service.ts # Orquestração da transcrição
├── routes/
│   ├── transcription.controller.ts # Controller da API
│   ├── transcription.routes.ts     # Rotas da API
│   └── playground.routes.ts        # Interface web
├── types/
│   └── index.ts           # Definições de tipos TypeScript
└── server.ts              # Servidor principal
```

## 🔧 Configuração

Variáveis de ambiente disponíveis (arquivo `.env`):

```env
# Servidor
PORT=3333

# Whisper
WHISPER_BIN=whisper-ctranslate2  # ou 'whisper'
WHISPER_MODEL=base               # tiny, base, small, medium, large
WHISPER_LANG=pt                  # ou vazio para auto-detecção
```

## 📚 Endpoints da API

### POST `/transcribe`
Transcreve um arquivo de áudio ou vídeo.

**Parâmetros:**
- `file`: Arquivo de áudio/vídeo (multipart/form-data)

**Resposta:**
```json
{
  "text": "Texto transcrito completo",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 2.5,
      "text": "Segmento da transcrição"
    }
  ]
}
```

### GET `/playground`
Interface web para testes interativos.

### GET `/docs`
Documentação Swagger da API.

## 🏃‍♂️ Executando

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔍 Monitoramento

- Logs estruturados com Fastify
- Timeouts configuráveis
- Tratamento de erros robusto
- Limpeza automática de arquivos temporários

## 🎯 Melhorias Implementadas

### ✅ Arquitetura Modular
- **Separação de responsabilidades**: Cada serviço tem uma função específica
- **Injeção de dependências**: Facilita testes e manutenção
- **Tipagem forte**: TypeScript para maior segurança

### ✅ Robustez
- **Fallback automático**: Tenta `whisper-ctranslate2` e depois `whisper`
- **Validação completa**: Tipos de arquivo, tamanhos, integridade
- **Timeout configurável**: Evita travamentos
- **Limpeza automática**: Remove arquivos temporários

### ✅ Interface Melhorada
- **Design moderno**: CSS responsivo e acessível
- **Feedback visual**: Estados de loading, sucesso e erro
- **Informações contextuais**: Configuração atual, limites
- **Validação client-side**: Verificações antes do upload

### ✅ Documentação
- **Swagger completo**: Esquemas detalhados da API
- **Tipos TypeScript**: Interfaces bem definidas
- **Comentários JSDoc**: Documentação inline do código
