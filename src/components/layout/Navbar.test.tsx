import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar';
import React from 'react';

// Mock the child components that we don't want to test in this unit test
vi.mock('@/components/ui/SyncLivingLogo', () => ({
  default: () => <div data-testid="logo" />
}));

vi.mock('@/components/settings/SettingsModal', () => ({
  default: () => <div data-testid="settings-modal" />
}));

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
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { full_name: 'Test User', id: 'test-user-id' } }),
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

// Mock server actions
vi.mock('../../../app/messages/actions', () => ({
  getUnreadMessageCount: vi.fn().mockResolvedValue(0),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  respondToMatchRequest: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../../app/auth/actions', () => ({
  logout: vi.fn(),
}));

describe('Navbar component', () => {
  it('renders the navbar with navigation links', async () => {
    render(<Navbar activeTab="Listings" />);
    
    // Use findBy to wait for the component to finish its initial async effects
    // and avoid the "act" warning.
    const userButton = await screen.findByRole('button', { name: /Test User/i });
    expect(userButton).toBeInTheDocument();

    // Now check for other elements
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
  });

  it('renders the user menu with initials', async () => {
    render(<Navbar />);
    
    const userButton = await screen.findByRole('button', { name: /Test User/i });
    expect(userButton).toBeInTheDocument();
  });
});
