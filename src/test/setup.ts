import { vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

// 1. Mock lucide-react
// This replaces SVG icons with simple spans to speed up tests and prevent rendering errors.
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const mockedIcons: Record<string, any> = {};
  
  Object.keys(actual).forEach((key) => {
    mockedIcons[key] = (props: any) => React.createElement('span', { 
      'data-testid': `icon-${key.toLowerCase()}`, 
      ...props 
    });
  });

  return {
    ...actual,
    ...mockedIcons,
  };
});

// 2. Mock next/navigation
// Provides mock implementations for commonly used hooks.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: vi.fn(),
}));

// 3. Mock next/link
// Simplifies Link to a standard anchor tag for easier testing.
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));
