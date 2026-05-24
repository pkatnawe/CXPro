/**
 * Outbox Dispatcher for Next.js Frontend
 * Implements NOTIFY/LISTEN + fallback polling with exactly-once delivery per subscriber
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgres = require('postgres')

interface OutboxEvent {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: Date
}

type EventHandler = (event: OutboxEvent) => void | Promise<void>

export class OutboxDispatcher {
  private subscriberName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sql: any
  private pollInterval: number
  private isRunning = false
  private eventHandlers = new Map<string, EventHandler>()
  private pollTimeoutId: NodeJS.Timeout | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listenerConnection: any | null = null

  constructor(
    subscriberName: string,
    databaseUrl: string,
    pollInterval: number = 30000 // 30 seconds
  ) {
    this.subscriberName = subscriberName
    this.sql = postgres(databaseUrl)
    this.pollInterval = pollInterval
  }

  /**
   * Register an event handler for a specific event type
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler)
    console.log(`Registered handler for event_type: ${eventType}`)
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(event: OutboxEvent): Promise<boolean> {
    try {
      // Check if already dispatched (idempotency)
      const [result] = await this.sql`
        SELECT is_event_dispatched(${event.id}, ${this.subscriberName}) as dispatched
      `
      
      if (result?.dispatched) {
        console.debug(`Event ${event.id} already dispatched to ${this.subscriberName}`)
        return true
      }

      // Get handler for event type
      const handler = this.eventHandlers.get(event.event_type)
      if (!handler) {
        // Unknown event type - log it and mark as dispatched to avoid blocking queue
        console.warn(`No handler for event_type: ${event.event_type}, marking as dispatched`)
        await this.markDispatched(event.id)
        return true
      }

      // Process the event
      console.log(`Processing event ${event.id} of type ${event.event_type}`)
      
      await handler(event)

      // Mark as dispatched after successful processing
      await this.markDispatched(event.id)
      console.log(`Successfully processed and dispatched event ${event.id}`)
      return true

    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error)
      return false
    }
  }

  /**
   * Mark an event as dispatched for this subscriber
   */
  private async markDispatched(eventId: string): Promise<void> {
    await this.sql`
      SELECT mark_event_dispatched(${eventId}, ${this.subscriberName})
    `
  }

  /**
   * Fetch unprocessed events for this subscriber
   */
  private async getUnprocessedEvents(limit: number = 100): Promise<OutboxEvent[]> {
    const rows = await this.sql`
      SELECT * FROM get_unprocessed_outbox_events(${this.subscriberName}, ${limit})
    `

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((row: any) => ({
      id: row.id,
      event_type: row.event_type,
      event_data: row.event_data,
      created_at: row.created_at
    }))
  }

  /**
   * Process all pending events for this subscriber
   */
  private async processPendingEvents(limit: number = 100): Promise<void> {
    const events = await this.getUnprocessedEvents(limit)

    if (events.length > 0) {
      console.log(`Processing ${events.length} pending events`)
    }

    for (const event of events) {
      const success = await this.processEvent(event)
      if (!success) {
        console.error(`Failed to process event ${event.id}, will retry on next poll`)
      }
    }
  }

  /**
   * Start listening for NOTIFY events (requires separate connection)
   */
  private async startListening(): Promise<void> {
    try {
      // Create separate connection for LISTEN
      this.listenerConnection = postgres(this.sql.options.connection as string)
      
      await this.listenerConnection`LISTEN outbox_events`
      
      this.listenerConnection.listen('outbox_events', async (payload: string) => {
        try {
          const eventInfo = JSON.parse(payload)
          console.log(`Received NOTIFY for event ${eventInfo.event_id} of type ${eventInfo.event_type}`)
          
          // Process pending events (including the new one)
          await this.processPendingEvents(1)
        } catch (error) {
          console.error('Error handling NOTIFY:', error)
        }
      })

      console.log('Started listening for outbox_events notifications')
    } catch (error) {
      console.error('Failed to start listening:', error)
    }
  }

  /**
   * Fallback polling loop
   */
  private async startPolling(): Promise<void> {
    if (!this.isRunning) return

    try {
      await this.processPendingEvents()
    } catch (error) {
      console.error('Error in poll loop:', error)
    }

    // Schedule next poll
    this.pollTimeoutId = setTimeout(() => {
      this.startPolling()
    }, this.pollInterval)
  }

  /**
   * Start the dispatcher
   */
  async start(): Promise<void> {
    console.log(`Starting outbox dispatcher for subscriber: ${this.subscriberName}`)
    
    this.isRunning = true

    try {
      // Start listening for NOTIFY events
      await this.startListening()

      // Process any existing unprocessed events
      await this.processPendingEvents()

      // Start fallback polling loop
      this.startPolling()

    } catch (error) {
      console.error('Error starting dispatcher:', error)
      throw error
    }
  }

  /**
   * Stop the dispatcher
   */
  async stop(): Promise<void> {
    console.log('Stopping outbox dispatcher')
    
    this.isRunning = false

    // Clear polling timeout
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId)
      this.pollTimeoutId = null
    }

    // Close listener connection
    if (this.listenerConnection) {
      await this.listenerConnection.end()
      this.listenerConnection = null
    }

    // Close main connection
    await this.sql.end()
  }
}

// Example event handlers for demonstration
async function handleDocumentUploaded(event: OutboxEvent): Promise<void> {
  console.log('Next.js worker handling document_uploaded:', event.event_data)
  // Add actual processing logic here
}

function handleDocumentIndexed(event: OutboxEvent): void {
  console.log('Next.js worker handling document_indexed:', event.event_data)
  // Add actual processing logic here
}

/**
 * Create and configure the Next.js outbox dispatcher
 */
export function createNextJSDispatcher(): OutboxDispatcher {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const dispatcher = new OutboxDispatcher(
    'nextjs_worker',
    databaseUrl,
    30000 // 30 second fallback poll
  )

  // Register event handlers
  dispatcher.registerHandler('document_uploaded', handleDocumentUploaded)
  dispatcher.registerHandler('document_indexed', handleDocumentIndexed)

  return dispatcher
}