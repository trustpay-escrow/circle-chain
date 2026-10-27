import { circlesRepository, CreateCircleDto } from '../repositories/circles.repository';
import { isValidStellarPublicKey } from '../lib/stellar-validator';

export class CirclesService {
  async getAllCircles() {
    return circlesRepository.findAll();
  }

  async getCircleById(id: number) {
    return circlesRepository.findById(id);
  }

  async createCircle(dto: CreateCircleDto) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Circle name is required');
    }

    if (!dto.creator_address) {
      throw new Error('Creator address is required');
    }

    if (!isValidStellarPublicKey(dto.creator_address)) {
      throw new Error(`Invalid Stellar creator address format: ${dto.creator_address}`);
    }

    return circlesRepository.create(dto);
  }

  async joinCircle(circleId: number, walletAddress: string, collateralStaked: number = 0) {
    if (!isValidStellarPublicKey(walletAddress)) {
      throw new Error(`Invalid Stellar wallet address format: ${walletAddress}`);
    }

    const circle = await circlesRepository.findById(circleId);
    if (!circle) {
      throw new Error(`Circle #${circleId} not found`);
    }

    return circlesRepository.addMember(circleId, walletAddress, collateralStaked);
  }
}

export const circlesService = new CirclesService();
