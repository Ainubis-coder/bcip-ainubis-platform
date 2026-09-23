# BCIP API Specification (v1)

## Base URL
`/api/v1`

---

## 1. Global Standards

### Correlation / Request ID
Every request accepts an optional `X-Request-Id` header. If absent, the API generates a unique correlation ID (`bcip_req_<timestamp>_<random>`) and returns it in the response header:
```http
X-Request-Id: bcip_req_1727083000_f92b71
```

### Error Envelope
All error responses adhere to the standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable explanation",
    "requestId": "bcip_req_1727083000_f92b71"
  }
}
```

---

## 2. Endpoints

### 2.1 Health Check (Unversioned)
* **Method**: `GET`
* **Route**: `/health`
* **Auth**: None
* **Description**: Verifies backend process availability, uptime, and version.
* **Response**:
```json
{
  "status": "healthy",
  "service": "bcip-api",
  "timestamp": "2026-09-23T10:00:00.000Z",
  "uptimeSeconds": 142,
  "version": "0.1.0",
  "requestId": "bcip_req_1727083000_f92b71"
}
```

### 2.2 System & Capabilities Status (Versioned)
* **Method**: `GET`
* **Route**: `/api/v1/status`
* **Auth**: None (Public status)
* **Description**: Reports platform name, environment, subsystem capabilities, and API version.
* **Response**:
```json
{
  "success": true,
  "data": {
    "applicationName": "BCIP — Body Corporate Intelligence Platform",
    "environment": "development",
    "applicationVersion": "0.1.0",
    "apiVersion": "v1",
    "serviceStatus": "operational",
    "capabilities": {
      "multiTenantPartitioning": "ready",
      "ainubisGatewayLayer": "ready",
      "databaseEngine": "postgresql_configured",
      "queueEngine": "redis_configured",
      "workerRuntime": "ready"
    },
    "timestamp": "2026-09-23T10:00:00.000Z",
    "requestId": "bcip_req_1727083000_f92b71"
  }
}
```
