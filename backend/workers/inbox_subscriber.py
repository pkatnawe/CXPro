"""
Inbox subscriber for Slice-07.
Consumes AgentRunCompleted and AIRefusal events to create inbox items.
"""

import asyncio
import asyncpg
import json
import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

from workers.outbox_dispatcher import OutboxDispatcher, OutboxEvent

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InboxSubscriber:
    """
    Subscribes to AgentRunCompleted and AIRefusal events
    and creates inbox items for subscribed users.
    """
    
    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        env_path = Path(__file__).parent.parent / ".env.local"
        load_dotenv(env_path)
        
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL not found in environment")
        
        # Initialize outbox dispatcher
        self.dispatcher = OutboxDispatcher(
            subscriber_name="inbox_subscriber",
            database_url=self.database_url,
            poll_interval=30
        )
        
        # Register event handlers
        self.dispatcher.register_handler("AgentRunCompleted", self.handle_agent_run_completed)
        self.dispatcher.register_handler("AIRefusal", self.handle_ai_refusal)
        
    async def handle_agent_run_completed(self, event: OutboxEvent):
        """Handle AgentRunCompleted events by creating inbox items."""
        try:
            logger.info(f"Processing AgentRunCompleted event {event.id}")
            
            # Call the database function to create inbox items
            async with await asyncpg.connect(self.database_url) as conn:
                await conn.execute(
                    "SELECT create_inbox_item_from_agent_run($1, $2)",
                    event.event_data,  # The payload from the event
                    "AgentRunCompleted"
                )
                logger.info(f"Created inbox items for AgentRunCompleted event {event.id}")
                
        except Exception as e:
            logger.error(f"Error handling AgentRunCompleted event {event.id}: {e}")
            raise
    
    async def handle_ai_refusal(self, event: OutboxEvent):
        """Handle AIRefusal events by creating refusal inbox items."""
        try:
            logger.info(f"Processing AIRefusal event {event.id}")
            
            # Call the database function to create inbox items
            async with await asyncpg.connect(self.database_url) as conn:
                await conn.execute(
                    "SELECT create_inbox_item_from_agent_run($1, $2)",
                    event.event_data,  # The payload from the event
                    "AIRefusal"
                )
                logger.info(f"Created inbox items for AIRefusal event {event.id}")
                
        except Exception as e:
            logger.error(f"Error handling AIRefusal event {event.id}: {e}")
            raise
    
    async def start(self):
        """Start the inbox subscriber."""
        try:
            logger.info("Starting inbox subscriber...")
            
            # Connect to database
            await self.dispatcher.connect()
            
            # Start the dispatcher
            await self.dispatcher.start()
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, stopping...")
        except Exception as e:
            logger.error(f"Error in inbox subscriber: {e}")
        finally:
            await self.dispatcher.stop()
            await self.dispatcher.disconnect()


async def main():
    """Main entry point."""
    subscriber = InboxSubscriber()
    await subscriber.start()


if __name__ == "__main__":
    asyncio.run(main())