// src/main.ts
import { Hono } from 'hono';
import { AppService } from './services/AppService.ts';
import { createFileSystemAdapter } from './services/FileSystemAdapter.ts';
import { createCacheAdapter } from './services/CacheAdapter.ts';
import app from './server.ts';

const port = 8000;
const basePath = './mekkanote-data';

async function initializeServer() {
  try {
    console.log('🚀 Initializing MekkaNote application...');
    console.log('📁 Creating required data directories...');
    
    // Create file system and cache adapters
    const fs = createFileSystemAdapter();
    const cache = createCacheAdapter();
    
    // Create dependencies configuration
    const dependencies = {
      fs,
      cache,
      basePath,
      indexPath: `${basePath}/index.json`,
      config: {
        basePath,
        indexPath: `${basePath}/index.json`,
        cacheEnabled: true,
        maxCacheSize: 1000,
        searchIndexEnabled: true
      }
    };
    
    // Initialize application (creates directories, default data)
    console.log('📂 Creating directory structure: notes/, folders/, attachments/');
    const initTask = AppService.initialize().run(dependencies);
    const initResult = await initTask();
    
    if (initResult._tag === 'Left') {
      throw new Error(`Initialization failed: ${initResult.value}`);
    }
    
    console.log('✅ Application initialized successfully');
    console.log(`📂 Data directory: ${basePath}`);
    console.log('📝 Default folder structure created');
    
    // Start server
    console.log(`🌐 Starting server on http://localhost:${port}`);
    
    Deno.serve({
      port,
      onListen: ({ hostname, port }) => {
        console.log(`✅ Server running at http://${hostname}:${port}`);
        console.log('📝 Ready to accept requests');
        console.log('💾 Notes will be persisted to filesystem');
      }
    }, app.fetch);
    
  } catch (error) {
    console.error('❌ Failed to initialize application:');
    console.error(error.message);
    console.error('\n💡 Make sure you have write permissions to the current directory');
    console.error('   Run with: deno run --allow-net --allow-read --allow-write src/main.ts');
    Deno.exit(1);
  }
}

// Start the initialization process
initializeServer();