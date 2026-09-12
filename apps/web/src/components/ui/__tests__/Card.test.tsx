import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders title when provided', () => {
    const { container } = render(<Card title="My Title">Body</Card>);
    expect(container.firstChild).toHaveProperty('title', 'My Title');
  });
});
