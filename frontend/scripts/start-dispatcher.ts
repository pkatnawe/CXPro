/**
 * Startup script for Next.js outbox dispatcher
 * Run this alongside the Next.js app to handle outbox events
 */

import { createNextJSDispatcher } from '../src/lib/outbox-dispatcher'

async function main() {
  console.log('Starting Next.js outbox dispatcher...')
  
  const dispatcher = createNextJSDispatcher()
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...')
    try {
      await dispatcher.stop()
      console.log('Dispatcher stopped.')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  })
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...')
    try {
      await dispatcher.stop()
      console.log('Dispatcher stopped.')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  })
  
  try {
    await dispatcher.start()
    console.log('Dispatcher started successfully. Press Ctrl+C to stop.')
    
    // Keep the process alive
    await new Promise(() => {}) // This will never resolve, keeping the process alive
    
  } catch (error) {
    console.error('Error starting dispatcher:', error)
    process.exit(1)
  }
}

main().catch(console.error)