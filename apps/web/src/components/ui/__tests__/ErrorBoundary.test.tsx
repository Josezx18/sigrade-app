import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const Thrower = () => { throw new Error('Test error') };

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><p>All good</p></ErrorBoundary>);
    expect(screen.getByText('All good')).toBeDefined();
  });

  it('renders fallback on error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    render(<ErrorBoundary><Thrower /></ErrorBoundary>);
    expect(screen.getByText('Algo salió mal')).toBeDefined();
    spy.mockRestore();
  });

  it('renders custom fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    render(<ErrorBoundary fallback={<p>Custom error</p>}><Thrower /></ErrorBoundary>);
    expect(screen.getByText('Custom error')).toBeDefined();
    spy.mockRestore();
  });
});
