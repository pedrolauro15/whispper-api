import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { config } from './lib/config.js';
import { playgroundRoutes } from './routes/playground.routes.js';
import { transcriptionRoutes } from './routes/transcription.routes.js';
import { translationRoutes } from './routes/translation.routes.js';

/**
 * Cria e configura a instância do Fastify
 */
async function createServer() {
  const app = Fastify({ 
    logger: true,
    bodyLimit: config.maxFileSize
  });

  // Registrar plugins
  await registerPlugins(app);
  
  // Registrar rotas
  await registerRoutes(app);
  
  return app;
}

/**
 * Registra todos os plugins necessários
 */
async function registerPlugins(app: ReturnType<typeof Fastify>) {
  // Plugin de multipart para upload de arquivos
  await app.register(multipart, {
    limits: { 
      files: config.maxFiles, 
      fileSize: config.maxFileSize,
      fieldSize: config.maxFieldSize, // Limite para campos individuais
      fieldsSize: config.maxFieldsSize, // Limite total para todos os campos
      fields: 10 // Máximo de campos permitidos
    }
  });

  // Documentação Swagger
  await app.register(swagger, {
    openapi: {
      info: { 
        title: 'Whisper API', 
        version: '1.0.0',
        description: 'API para transcrição de áudio usando Whisper',
        contact: {
          name: 'Whisper API',
          url: 'https://github.com/openai/whisper'
        }
      },
      servers: [
        {
          url: 'http://localhost:' + config.port,
          description: 'Servidor de desenvolvimento'
        }
      ],
      tags: [
        {
          name: 'transcription',
          description: 'Endpoints relacionados à transcrição de áudio'
        },
        {
          name: 'translation',
          description: 'Endpoints relacionados à tradução de texto'
        }
      ]
    }
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { 
      docExpansion: 'list', 
      deepLinking: true,
      displayRequestDuration: true
    },
    staticCSP: true,
    transformSpecificationClone: true
  });
}

/**
 * Registra todas as rotas da aplicação
 */
async function registerRoutes(app: ReturnType<typeof Fastify>) {
  // Rotas de transcrição
  await app.register(transcriptionRoutes);
  
  // Rotas de tradução
  await app.register(translationRoutes);
  
  // Rotas do playground
  await app.register(playgroundRoutes);
}

/**
 * Inicia o servidor
 */
async function startServer() {
  try {
    const app = await createServer();
    
    // Aguardar que todos os plugins estejam prontos
    await app.ready();
    
    // Gerar documentação Swagger
    app.swagger();
    
    // Iniciar servidor
    await app.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    console.log(`🚀 Servidor iniciado em http://${config.host}:${config.port}`);
    console.log(`📚 Documentação disponível em http://${config.host}:${config.port}/docs`);
    console.log(`🎮 Playground disponível em http://${config.host}:${config.port}/playground`);
    console.log(`🤖 Modelo Whisper: ${config.model}`);
    console.log(`🌍 Idioma: ${config.language || 'Auto-detecção'}`);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para shutdown graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();
