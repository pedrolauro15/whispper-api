# Instalação do FFmpeg

Para usar a funcionalidade de **Vídeo com Legendas**, você precisa ter o FFmpeg instalado no seu sistema.

## 🖥️ Instalação por Sistema Operacional

### 🍎 **macOS**
```bash
# Usando Homebrew (recomendado)
brew install ffmpeg

# Ou usando MacPorts
sudo port install ffmpeg
```

### 🐧 **Ubuntu/Debian**
```bash
# Atualizar repositórios
sudo apt update

# Instalar FFmpeg
sudo apt install ffmpeg

# Verificar instalação
ffmpeg -version
```

### 🔴 **CentOS/RHEL/Fedora**
```bash
# Fedora
sudo dnf install ffmpeg

# CentOS/RHEL (com EPEL)
sudo yum install epel-release
sudo yum install ffmpeg
```

### 🪟 **Windows**

#### Opção 1: Download Direto
1. Acesse [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Clique em "Windows" e escolha uma build (recomendado: gyan.dev)
3. Baixe a versão "release builds"
4. Extraia o arquivo ZIP
5. Adicione a pasta `bin` ao PATH do Windows

#### Opção 2: Chocolatey
```powershell
# Instalar Chocolatey primeiro (se não tiver)
# Depois executar:
choco install ffmpeg
```

#### Opção 3: Scoop
```powershell
scoop install ffmpeg
```

## ✅ **Verificar Instalação**

Após instalar, execute no terminal:

```bash
ffmpeg -version
```

Você deve ver uma saída similar a:
```
ffmpeg version 4.4.x Copyright (c) 2000-2021 the FFmpeg developers
built with gcc 9 (Ubuntu 9.4.0-1ubuntu1~20.04.1)
...
```

## 🚀 **Reiniciar o Servidor**

Após instalar o FFmpeg, **reinicie o servidor Whisper API**:

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente:
npm run dev
```

## 🎬 **Como Usar**

1. Acesse o playground: `http://localhost:3333/playground`
2. Selecione um arquivo de **vídeo** (MP4, AVI, MOV, etc.)
3. Clique em "Iniciar Transcrição" para gerar a transcrição
4. Na seção de vídeo, clique em "🎥 Gerar Vídeo com Legendas"
5. Aguarde o processamento (pode demorar alguns minutos)
6. O vídeo com legendas será baixado automaticamente

## ⚙️ **Personalização de Legendas**

Você pode personalizar as legendas via parâmetros de query:

```
POST /video-with-subtitles?fontColor=%23ffffff&fontSize=28&backgroundColor=%2380000000
```

Parâmetros disponíveis:
- `hardcoded`: `true` (legendas fixas) ou `false` (legendas separadas)
- `fontName`: Nome da fonte (ex: "Arial", "Times")
- `fontSize`: Tamanho da fonte (ex: 24, 28, 32)
- `fontColor`: Cor da fonte em hex (ex: "#ffffff" para branco)
- `backgroundColor`: Cor de fundo em hex (ex: "#000000" para preto)
- `borderWidth`: Largura da borda (ex: 2, 3)
- `borderColor`: Cor da borda em hex

## 🔧 **Troubleshooting**

### Erro: "FFmpeg não encontrado"
- Verifique se o FFmpeg foi instalado corretamente
- No Windows, certifique-se de que está no PATH
- Reinicie o terminal/servidor após a instalação

### Processo muito lento
- Vídeos grandes demoram mais para processar
- Use formatos de vídeo mais eficientes (MP4 H.264)
- Considere reduzir a resolução do vídeo antes do upload

### Erro de codec
- Alguns formatos podem não ser suportados
- Tente converter o vídeo para MP4 primeiro
- Use configurações padrão de encoding
