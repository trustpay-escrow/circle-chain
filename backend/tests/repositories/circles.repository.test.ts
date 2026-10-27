import { describe, it, expect, vi } from 'vitest';
import { CirclesRepository } from '../../src/repositories/circles.repository';
import { prisma } from '../../src/db';

vi.mock('../../src/db', () => ({
  prisma: {
    circleMetadata: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    circleMember: {
      create: vi.fn()
    }
  }
}));

describe('CirclesRepository', () => {
  const repo = new CirclesRepository();

  it('findAll queries circleMetadata with relations and ordering', async () => {
    const mockDbCircles = [
      {
        circle_id: BigInt(101),
        name: 'Demo Circle',
        creator_address: 'GABC...',
        members: [],
        contributions: []
      }
    ];

    vi.mocked(prisma.circleMetadata.findMany).mockResolvedValueOnce(mockDbCircles as any);

    const result = await repo.findAll();
    expect(prisma.circleMetadata.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].circle_id).toBe(101); // BigInt serialized to Number
  });

  it('findById returns null when circle does not exist', async () => {
    vi.mocked(prisma.circleMetadata.findUnique).mockResolvedValueOnce(null);

    const result = await repo.findById(999);
    expect(result).toBeNull();
  });
});
