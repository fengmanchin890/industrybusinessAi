import paho.mqtt.client as mqtt
from typing import Callable, Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)


class MQTTHandler:
    """MQTT handler for IoT/PLC device data streaming"""
    
    def __init__(self, broker_url: str = "localhost", port: int = 1883):
        self.broker_url = broker_url
        self.port = port
        self.client = mqtt.Client()
        self.handlers: Dict[str, Callable] = {}
        self.is_connected = False
        
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT broker at {self.broker_url}:{self.port}")
            
            # Subscribe to all registered topics
            for topic in self.handlers.keys():
                client.subscribe(topic)
                logger.info(f"Subscribed to topic: {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker"""
        self.is_connected = False
        logger.warning(f"Disconnected from MQTT broker: {rc}")
    
    def _on_message(self, client, userdata, msg):
        """Callback when message received"""
        topic = msg.topic
        
        try:
            payload = json.loads(msg.payload.decode())
            logger.debug(f"Message received on topic {topic}: {payload}")
            
            # Call registered handler
            if topic in self.handlers:
                self.handlers[topic](payload)
            else:
                logger.warning(f"No handler registered for topic: {topic}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON message: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def register_handler(self, topic: str, handler: Callable):
        """Register a handler for a specific topic"""
        self.handlers[topic] = handler
        logger.info(f"Handler registered for topic: {topic}")
        
        # If already connected, subscribe immediately
        if self.is_connected:
            self.client.subscribe(topic)
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker_url, self.port, 60)
            self.client.loop_start()
            logger.info("MQTT client loop started")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        self.is_connected = False
        logger.info("Disconnected from MQTT broker")
    
    def publish(self, topic: str, payload: Dict):
        """Publish message to topic"""
        try:
            message = json.dumps(payload)
            result = self.client.publish(topic, message)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"Published to {topic}: {payload}")
            else:
                logger.error(f"Failed to publish to {topic}: {result.rc}")
                
        except Exception as e:
            logger.error(f"Error publishing message: {e}")
            raise


# Global MQTT handler instance
mqtt_handler: Optional[MQTTHandler] = None


def get_mqtt_handler() -> MQTTHandler:
    """Get or create global MQTT handler instance"""
    global mqtt_handler
    
    if mqtt_handler is None:
        mqtt_handler = MQTTHandler()
        mqtt_handler.connect()
    
    return mqtt_handler

