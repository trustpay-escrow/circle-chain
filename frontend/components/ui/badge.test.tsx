import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge UI Component', () => {
  it('renders badge label correctly', () => {
    render(<Badge>Active Round</Badge>);
    expect(screen.getByText('Active Round')).toBeInTheDocument();
  });

  it('renders secondary variant without crashing', () => {
    const { container } = render(<Badge variant="secondary">Forming</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders destructive variant for defaulted state', () => {
    const { container } = render(<Badge variant="destructive">Defaulted</Badge>);
    expect(screen.getByText('Defaulted')).toBeInTheDocument();
  });
});
