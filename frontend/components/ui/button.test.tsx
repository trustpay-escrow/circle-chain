import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button UI Component', () => {
  it('renders button with text label', () => {
    render(<Button>Join Circle</Button>);
    expect(screen.getByRole('button', { name: /join circle/i })).toBeInTheDocument();
  });

  it('handles click callback properly', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Contribute 50 USDC</Button>);

    const button = screen.getByRole('button', { name: /contribute 50 usdc/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state and prevents click invocations', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Locked</Button>);

    const button = screen.getByRole('button', { name: /locked/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="outline">Outline Button</Button>);
    expect(container.firstChild).toHaveClass('border');
  });
});
