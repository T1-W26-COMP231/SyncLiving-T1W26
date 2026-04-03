import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity } from './activity-logger';
import { createClient } from '@/utils/supabase/server';

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Activity Logger', () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
  });
  const mockSupabase = {
    from: mockFrom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('should call supabase with correct parameters', async () => {
    const userId = 'user-123';
    const actionType = 'login';
    const metadata = { ip: '127.0.0.1' };

    await logActivity(userId, actionType, metadata);

    expect(createClient).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('user_activity_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      action_type: actionType,
      metadata: metadata,
    });
  });

  it('should handle metadata being optional', async () => {
    const userId = 'user-123';
    const actionType = 'signup';

    await logActivity(userId, actionType);

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      action_type: actionType,
      metadata: {},
    });
  });

  it('should log an error if supabase call fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = { message: 'DB Error' };
    mockInsert.mockResolvedValueOnce({ error: mockError });

    await logActivity('user-123', 'login');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to log activity'),
      mockError
    );
    
    consoleErrorSpy.mockRestore();
  });
});
