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
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } })
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { full_name: 'Test User' } }),
    order: vi.fn().mockResolvedValue({ data: [] }),
  }))
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
