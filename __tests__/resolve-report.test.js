/* eslint-env jest */

const mockJson = jest.fn((body, init = {}) => ({
  status: init.status ?? 200,
  body,
}));

let mockClient;
let mockPoolConnect;

jest.mock('next/server', () => ({
  NextResponse: {
    json: (...args) => mockJson(...args),
  },
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: (...args) => mockPoolConnect(...args),
  })),
}));

const makeReq = (jsonImpl) => ({ json: jsonImpl });

describe('POST /api/admin/resolve-report', () => {
  beforeEach(() => {
    jest.resetModules();
    mockJson.mockClear();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPoolConnect = jest.fn().mockResolvedValue(mockClient);
  });

  test('returns 200 for valid input', async () => {
    process.env.DATABASE_URL = 'postgresql://example';

    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { POST } = await import('../app/api/admin/resolve-report/route.js');
    const response = await POST(
      makeReq(async () => ({
        reportId: 'r1',
        resolverId: 'u1',
        resolutionNote: 'ok',
      }))
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  test('returns 400 for invalid JSON', async () => {
    process.env.DATABASE_URL = 'postgresql://example';

    const { POST } = await import('../app/api/admin/resolve-report/route.js');
    const response = await POST(
      makeReq(async () => {
        throw new SyntaxError('Unexpected token');
      })
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid JSON body' });
  });

  test('returns 500 for DB error', async () => {
    process.env.DATABASE_URL = 'postgresql://example';

    mockPoolConnect.mockRejectedValueOnce(new Error('DB unavailable'));

    const { POST } = await import('../app/api/admin/resolve-report/route.js');
    const response = await POST(
      makeReq(async () => ({
        reportId: 'r1',
        resolverId: 'u1',
      }))
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'internal server error' });
  });
});
