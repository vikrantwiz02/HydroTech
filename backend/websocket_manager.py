from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
    
    async def send_to_user(self, message: dict, user_id: str):
        """Send message to all connections of a specific user"""
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {str(e)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {str(e)}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)
    
    async def broadcast_prediction_update(self, prediction_data: dict):
        """Broadcast new prediction to all clients"""
        message = {
            'type': 'prediction_update',
            'data': prediction_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def broadcast_weather_update(self, weather_data: dict):
        """Broadcast weather update to all clients"""
        message = {
            'type': 'weather_update',
            'data': weather_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def send_forecast_update(self, user_id: str, forecast_data: dict):
        """Send forecast update to specific user"""
        message = {
            'type': 'forecast_update',
            'data': forecast_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)
    
    async def send_system_notification(self, notification: str, level: str = 'info'):
        """Send system notification to all clients"""
        message = {
            'type': 'system_notification',
            'level': level,  # info, warning, error, success
            'message': notification,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

# Global connection manager instance
manager = ConnectionManager()
