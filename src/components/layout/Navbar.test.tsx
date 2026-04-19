import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar';
import React from 'react';

// Mock the child components that we don't want to test in this unit test
vi.mock('@/components/ui/SyncLivingLogo', () => ({
  default: () => <div data-testid="logo" />
}));

vi.mock('@/components/settings/SettingsModal', () => ({
  default: () => <div data-testid="settings-modal" />
}));

vi.mock('@/components/layout/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="icon-bell" />
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Search: () => <div data-testid="icon-search" />,
    Bell: () => <div data-testid="icon-bell" />,
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    Settings: () => <div data-testid="icon-settings" />,
    LogOut: () => <div data-testid="icon-logout" />,
    SlidersHorizontal: () => <div data-testid="icon-sliders" />,
  };
});

// Mock the actions
vi.mock('../../../app/auth/actions', () => ({
  logout: vi.fn(),
}));

vi.mock('../../../app/messages/actions', () => ({
  getUnreadMessageCount: vi.fn().mockResolvedValue(0),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  respondToMatchRequest: vi.fn().mockResolvedValue({ error: null }),
}));

// Mock the Supabase client used in Navbar
// Mock the Supabase client used in Navbar
vi.mock('@/utils/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@example.com' } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { full_name: 'Test User', id: 'test-user-id' } }), // 結合兩邊的資料
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  };
  
  return {
    createClient: vi.fn(() => mockSupabase),
  };
});

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the navbar with navigation links', async () => {
    await act(async () => {
      render(<Navbar activeTab="Listings" />);
    });
    
    // Use findBy to wait for the component to finish its initial async effects
    const userButton = await screen.findByRole('button', { name: /Test User/i });
    expect(userButton).toBeInTheDocument();

    // Now check for other elements
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
  });

  it('renders the user menu with initials', async () => {
    await act(async () => {
      render(<Navbar />);
    });
    
    const userButton = await screen.findByRole('button', { name: /Test User/i });
    expect(userButton).toBeInTheDocument();
  });
});
