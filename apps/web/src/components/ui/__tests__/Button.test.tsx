import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-primary');
  });

  it('shows loading spinner when isLoading', () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('disables button when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Loading')).toHaveProperty('disabled', true);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toHaveProperty('disabled', true);
  });
});
