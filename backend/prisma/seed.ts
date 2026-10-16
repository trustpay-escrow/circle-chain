import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CircleChain Prisma PostgreSQL Seeding...');

  // 1. Seed Sample User Profiles
  const profile1 = await prisma.userProfile.upsert({
    where: { wallet_address: 'GABC1234567890WXYZ1234567890TESTNETSAVER01' },
    update: {},
    create: {
      wallet_address: 'GABC1234567890WXYZ1234567890TESTNETSAVER01',
      username: 'tech_founder_lagos',
      display_name: 'Amara K. (Lagos Builders)',
      bio: 'Building Web3 infrastructure on Stellar. Active ROSCA saver.',
      reputation_score: 98,
      circles_completed: 4,
      punctual_contributions: 32,
      total_collateral_staked: 500,
    },
  });

  const profile2 = await prisma.userProfile.upsert({
    where: { wallet_address: 'GBX98765432104K2L9876543210TESTNETSAVER02' },
    update: {},
    create: {
      wallet_address: 'GBX98765432104K2L9876543210TESTNETSAVER02',
      username: 'soroban_dev_accra',
      display_name: 'Kwame O. (Accra Guild)',
      bio: 'Smart contract security researcher. Verified Stellar builder.',
      reputation_score: 95,
      circles_completed: 2,
      punctual_contributions: 16,
      total_collateral_staked: 250,
    },
  });

  console.log(`✅ Upserted profiles: ${profile1.username}, ${profile2.username}`);

  // 2. Seed Sample Circles
  const circle1 = await prisma.circleMetadata.upsert({
    where: { circle_id: BigInt(1) },
    update: {},
    create: {
      circle_id: BigInt(1),
      name: 'Tech Founders Ajo Pool',
      description: 'Monthly ROSCA savings pool for tech founders & developers in West Africa.',
      category: 'Business Investment',
      creator_address: profile1.wallet_address,
      token_address: 'USDC',
      contribution_amount: 200,
      interval_days: 30,
      member_count: 5,
      collateral_required: 100,
      payout_mode: 'Fixed',
      status: 'Active',
    },
  });

  const circle2 = await prisma.circleMetadata.upsert({
    where: { circle_id: BigInt(2) },
    update: {},
    create: {
      circle_id: BigInt(2),
      name: 'Crypto Builders Weekly Pot',
      description: 'Weekly automated savings circle for Soroban smart contract developers.',
      category: 'DeFi Savings',
      creator_address: profile2.wallet_address,
      token_address: 'USDC',
      contribution_amount: 50,
      interval_days: 7,
      member_count: 8,
      collateral_required: 25,
      payout_mode: 'Bidding',
      status: 'Forming',
    },
  });

  console.log(`✅ Upserted circles: #${circle1.circle_id} (${circle1.name}), #${circle2.circle_id} (${circle2.name})`);

  // 3. Seed Circle Members
  await prisma.circleMember.upsert({
    where: {
      circle_id_wallet_address: {
        circle_id: BigInt(1),
        wallet_address: profile1.wallet_address,
      },
    },
    update: {},
    create: {
      circle_id: BigInt(1),
      wallet_address: profile1.wallet_address,
      collateral_staked: 100,
      payout_order_index: 0,
    },
  });

  console.log('✅ Seeded circle membership links.');
  console.log('✨ Prisma PostgreSQL seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
