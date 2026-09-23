import assert from 'assert';
import { createApiApp } from '../apps/api/src/server';

function createMockResponse(onComplete: (statusCode: number, headers: Record<string, string>, body: any) => void) {
  const headers: Record<string, string> = {};
  let statusCode = 200;

  const res: any = {
    statusCode: 200,
    getHeader: (name: string) => headers[name.toLowerCase()],
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = String(value);
      return res;
    },
    hasHeader: (name: string) => Object.prototype.hasOwnProperty.call(headers, name.toLowerCase()),
    removeHeader: (name: string) => {
      delete headers[name.toLowerCase()];
    },
    status: (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json: (data: any) => {
      onComplete(statusCode, headers, data);
      return res;
    },
    send: (data: any) => {
      onComplete(statusCode, headers, data);
      return res;
    },
    end: () => {
      onComplete(statusCode, headers, null);
    },
    on: () => res,
    once: () => res,
    emit: () => true,
  };
  return res;
}

export async function runApiTests(): Promise<void> {
  console.log('[TEST] Running API & Health Route Tests...');
  const app = createApiApp();

  // 1. Test /health
  await new Promise<void>((resolve, reject) => {
    const req: any = {
      method: 'GET',
      url: '/health',
      headers: {
        host: 'localhost:3000',
      },
      originalUrl: '/health',
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
    };

    const res = createMockResponse((code, headers, data) => {
      try {
        assert.strictEqual(code, 200, '/health should return HTTP 200');
        assert.strictEqual(data.status, 'healthy', 'Status should be healthy');
        assert.strictEqual(data.service, 'bcip-api', 'Service should match bcip-api');
        assert.ok(data.timestamp, 'Timestamp should be returned');
        assert.ok(typeof data.uptimeSeconds === 'number', 'Uptime should be numeric');
        assert.ok(headers['x-request-id'], 'X-Request-Id header must be set');
        console.log('  ✓ GET /health responded with 200 and healthy payload');
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    (app as any).handle(req, res);
  });

  // 2. Test /api/v1/status
  await new Promise<void>((resolve, reject) => {
    const req: any = {
      method: 'GET',
      url: '/api/v1/status',
      headers: {
        host: 'localhost:3000',
        'x-request-id': 'custom_test_req_123',
      },
      originalUrl: '/api/v1/status',
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
    };

    const res = createMockResponse((code, headers, data) => {
      try {
        assert.strictEqual(code, 200, '/api/v1/status should return HTTP 200');
        assert.strictEqual(data.success, true, 'Success flag must be true');
        assert.ok(data.data.applicationName.includes('BCIP'), 'Must contain platform name');
        assert.strictEqual(data.data.apiVersion, 'v1', 'API version must be v1');
        assert.strictEqual(data.data.serviceStatus, 'operational', 'Status must be operational');
        assert.strictEqual(headers['x-request-id'], 'custom_test_req_123', 'Should preserve correlation ID');
        assert.ok(data.data.capabilities.multiTenantPartitioning, 'Capabilities must be reported');
        console.log('  ✓ GET /api/v1/status responded with 200 and status metadata');
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    (app as any).handle(req, res);
  });

  // 3. Test Request ID Generation when not provided (Section 7)
  await new Promise<void>((resolve, reject) => {
    const req: any = {
      method: 'GET',
      url: '/health',
      headers: { host: 'localhost:3000' },
      originalUrl: '/health',
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
    };

    const res = createMockResponse((code, headers) => {
      try {
        assert.strictEqual(code, 200);
        const reqId = headers['x-request-id'];
        assert.ok(reqId && reqId.startsWith('bcip_req_'), 'Auto-generated request ID should have prefix bcip_req_');
        console.log('  ✓ API generated request ID when none provided by client');
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    (app as any).handle(req, res);
  });

  // 4. Test Error Handling on unknown route / invalid request (Section 8)
  await new Promise<void>((resolve, reject) => {
    const req: any = {
      method: 'GET',
      url: '/api/v1/non-existent-endpoint',
      headers: { host: 'localhost:3000' },
      originalUrl: '/api/v1/non-existent-endpoint',
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
    };

    const res = createMockResponse((code, headers, data) => {
      try {
        assert.strictEqual(code, 404, 'Unknown endpoint should return 404');
        assert.strictEqual(data.success, false, 'Error response success should be false');
        assert.ok(data.error, 'Error object must be present');
        assert.strictEqual(data.error.code, 'NOT_FOUND', 'Error code should be NOT_FOUND');
        assert.ok(data.error.message, 'Human readable message should be present');
        assert.ok(data.error.requestId, 'Request ID should be present in error object');
        assert.strictEqual(data.error.stack, undefined, 'Stack trace must NOT be exposed in response');
        console.log('  ✓ API returned structured error envelope without leaking stack traces');
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    (app as any).handle(req, res);
  });
}
