import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContributionGrid } from './contribution-grid';

describe('ContributionGrid Component', () => {
  it('renders table headers and cycle columns properly', () => {
    render(
      <ContributionGrid
        memberCount={3}
        currentCycle={0}
        members={['GBBDU27QKWZ7PST2Y4D4E3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q']}
        contributions={[]}
      />
    );

    expect(screen.getByText('Transparency Matrix')).toBeDefined();
    expect(screen.getByText(/Cycle 1/i)).toBeDefined();
    expect(screen.getByText(/Cycle 2/i)).toBeDefined();
    expect(screen.getByText(/Cycle 3/i)).toBeDefined();
  });

  it('renders empty roster message when no members have joined', () => {
    render(
      <ContributionGrid
        memberCount={5}
        currentCycle={0}
        members={[]}
        contributions={[]}
      />
    );

    expect(
      screen.getByText(/No members joined yet. Stake collateral above to fill the first seat!/i)
    ).toBeDefined();
  });

  it('displays paid and defaulted indicator icons', () => {
    const member = 'GAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNNOOOPPPQQQRRR';
    const { container } = render(
      <ContributionGrid
        memberCount={2}
        currentCycle={1}
        members={[member]}
        contributions={[
          { cycle_index: 0, member_address: member, status: 'paid' },
          { cycle_index: 1, member_address: member, status: 'defaulted' }
        ]}
      />
    );

    expect(container.querySelector('span[title="Paid on-chain"]')).toBeDefined();
    expect(container.querySelector('span[title="Defaulted"]')).toBeDefined();
  });
});
