# Data Connector Hub

FastAPI-based data integration service for IoT, POS, and ERP systems.

## Features

- **POS Integration** - Webhook receiver for Point-of-Sale systems
- **Excel/CSV Upload** - File upload and parsing
- **MQTT Handler** - IoT device data streaming
- **Data Transformation** - Standardize data formats
- **Real-time Processing** - Stream data to AI Core

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --reload --port 8001
```

### Docker

```bash
# Build image
docker build -t data-connector:latest .

# Run container
docker run -p 8001:8001 -p 1883:1883 data-connector:latest
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### POS Connector
- `POST /api/v1/connectors/pos/webhook` - Receive POS transaction data
- `GET /api/v1/connectors/pos/health` - POS connector status

### File Upload
- `POST /api/v1/connectors/upload/excel` - Upload Excel/CSV file
- `POST /api/v1/connectors/upload/csv` - Upload CSV file
- `GET /api/v1/connectors/upload/health` - Upload connector status

## Usage Examples

### POS Webhook

```bash
curl -X POST http://localhost:8001/api/v1/connectors/pos/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "company-123",
    "transaction_data": {
      "id": "order-456",
      "items": [{"name": "Product A", "price": 100, "quantity": 2}],
      "total": 200,
      "payment_method": "credit_card"
    }
  }'
```

### Excel Upload

```bash
curl -X POST http://localhost:8001/api/v1/connectors/upload/excel \
  -F "file=@data.xlsx"
```

## MQTT Integration

To integrate IoT devices:

```python
from app.connectors.mqtt_handler import get_mqtt_handler

# Get MQTT handler
mqtt = get_mqtt_handler()

# Register handler for topic
def handle_sensor_data(payload):
    print(f"Sensor data: {payload}")

mqtt.register_handler("sensors/temperature", handle_sensor_data)

# Publish data
mqtt.publish("sensors/temperature", {"value": 25.5, "unit": "celsius"})
```

## Monitoring

- API docs: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

