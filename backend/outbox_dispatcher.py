"""
Outbox Dispatcher for Python Backend
Implements NOTIFY/LISTEN + fallback polling with exactly-once delivery per subscriber
"""

import asyncio
import json
import logging
import os
import traceback
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass
from datetime import datetime

import asyncpg

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OutboxEvent:
    """Represents an outbox event to be processed"""
    id: str
    event_type: str
    event_data: dict
    created_at: datetime

class OutboxDispatcher:
    """
    Outbox dispatcher that listens for NOTIFY events and falls back to polling
    Ensures exactly-once delivery per subscriber using outbox_dispatches table
    """
    
    def __init__(self, subscriber_name: str, database_url: str, poll_interval: int = 30):
        self.subscriber_name = subscriber_name
        self.database_url = database_url
        self.poll_interval = poll_interval
        self.connection: Optional[asyncpg.Connection] = None
        self.is_running = False
        self.event_handlers: Dict[str, Callable[[OutboxEvent], Any]] = {}
        
    def register_handler(self, event_type: str, handler: Callable[[OutboxEvent], Any]):
        """Register an event handler for a specific event type"""
        self.event_handlers[event_type] = handler
        logger.info(f"Registered handler for event_type: {event_type}")
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = await asyncpg.connect(self.database_url)
            logger.info(f"Connected to database for subscriber: {self.subscriber_name}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    async def disconnect(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()
            logger.info("Disconnected from database")
    
    async def process_event(self, event: OutboxEvent) -> bool:
        """
        Process a single outbox event
        Returns True if processed successfully, False otherwise
        """
        try:
            # Check if already dispatched (idempotency)
            already_dispatched = await self.connection.fetchval(
                "SELECT is_event_dispatched($1, $2)",
                event.id, self.subscriber_name
            )
            
            if already_dispatched:
                logger.debug(f"Event {event.id} already dispatched to {self.subscriber_name}")
                return True
            
            # Get handler for event type
            handler = self.event_handlers.get(event.event_type)
            if not handler:
                # Unknown event type - log it and mark as dispatched to avoid blocking queue
                logger.warning(f"No handler for event_type: {event.event_type}, marking as dispatched")
                await self.mark_dispatched(event.id)
                return True
            
            # Process the event
            logger.info(f"Processing event {event.id} of type {event.event_type}")
            
            # If handler is async, await it; otherwise call it directly
            if asyncio.iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)
                
            # Mark as dispatched after successful processing
            await self.mark_dispatched(event.id)
            logger.info(f"Successfully processed and dispatched event {event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing event {event.id}: {e}")
            logger.error(traceback.format_exc())
            return False
    
    async def mark_dispatched(self, event_id: str):
        """Mark an event as dispatched for this subscriber"""
        await self.connection.fetchval(
            "SELECT mark_event_dispatched($1, $2)",
            event_id, self.subscriber_name
        )
    
    async def get_unprocessed_events(self, limit: int = 100) -> List[OutboxEvent]:
        """Fetch unprocessed events for this subscriber"""
        rows = await self.connection.fetch(
            "SELECT * FROM get_unprocessed_outbox_events($1, $2)",
            self.subscriber_name, limit
        )
        
        return [
            OutboxEvent(
                id=str(row['id']),
                event_type=row['event_type'],
                event_data=row['event_data'],
                created_at=row['created_at']
            )
            for row in rows
        ]
    
    async def handle_notify(self, connection, pid, channel, payload):
        """Handle NOTIFY events from PostgreSQL"""
        try:
            # Parse notification payload
            event_info = json.loads(payload)
            logger.info(f"Received NOTIFY for event {event_info['event_id']} of type {event_info['event_type']}")
            
            # Process this specific event
            await self.process_pending_events(limit=1)
            
        except Exception as e:
            logger.error(f"Error handling NOTIFY: {e}")
    
    async def process_pending_events(self, limit: int = 100):
        """Process all pending events for this subscriber"""
        events = await self.get_unprocessed_events(limit)
        
        if events:
            logger.info(f"Processing {len(events)} pending events")
            
        for event in events:
            success = await self.process_event(event)
            if not success:
                logger.error(f"Failed to process event {event.id}, will retry on next poll")
    
    async def start_listening(self):
        """Start listening for NOTIFY events"""
        try:
            await self.connection.add_listener('outbox_events', self.handle_notify)
            logger.info(f"Started listening for outbox_events notifications")
        except Exception as e:
            logger.error(f"Failed to start listening: {e}")
    
    async def poll_loop(self):
        """Fallback polling loop"""
        while self.is_running:
            try:
                await self.process_pending_events()
                await asyncio.sleep(self.poll_interval)
            except Exception as e:
                logger.error(f"Error in poll loop: {e}")
                await asyncio.sleep(self.poll_interval)
    
    async def run(self):
        """Main dispatcher loop"""
        logger.info(f"Starting outbox dispatcher for subscriber: {self.subscriber_name}")
        
        await self.connect()
        
        try:
            self.is_running = True
            
            # Start listening for NOTIFY events
            await self.start_listening()
            
            # Process any existing unprocessed events
            await self.process_pending_events()
            
            # Start fallback polling loop
            await self.poll_loop()
            
        except Exception as e:
            logger.error(f"Error in dispatcher main loop: {e}")
            raise
        finally:
            self.is_running = False
            await self.disconnect()
    
    def stop(self):
        """Stop the dispatcher"""
        logger.info("Stopping outbox dispatcher")
        self.is_running = False

# Example event handlers for demonstration
async def handle_document_uploaded(event: OutboxEvent):
    """Example handler for document_uploaded events"""
    logger.info(f"Python worker handling document_uploaded: {event.event_data}")
    # Add actual processing logic here

def handle_document_indexed(event: OutboxEvent):
    """Example handler for document_indexed events"""
    logger.info(f"Python worker handling document_indexed: {event.event_data}")
    # Add actual processing logic here

def handle_unknown_event(event: OutboxEvent):
    """Example handler for unknown event types"""
    logger.info(f"Python worker handling unknown event {event.event_type}: {event.event_data}")

# Subscriber registry for this Python worker
def create_python_dispatcher() -> OutboxDispatcher:
    """Create and configure the Python outbox dispatcher"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    dispatcher = OutboxDispatcher(
        subscriber_name='python_worker',
        database_url=database_url,
        poll_interval=30  # 30 second fallback poll
    )
    
    # Register event handlers
    dispatcher.register_handler('document_uploaded', handle_document_uploaded)
    dispatcher.register_handler('document_indexed', handle_document_indexed)
    
    return dispatcher

async def main():
    """Main entry point for running the dispatcher"""
    dispatcher = create_python_dispatcher()
    
    try:
        await dispatcher.run()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
        dispatcher.stop()

if __name__ == "__main__":
    asyncio.run(main())