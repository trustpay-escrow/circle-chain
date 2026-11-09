#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _, testutils::Events as _, testutils::Ledger as _, token, vec, Address,
    Env,
};

#[test]
fn test_happy_path_circle_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    // Mock USDC token
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone()];

    // 1. Create circle
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100, // contribution per cycle
        &86400, // interval (1 day)
        &2, // member count
        &50, // collateral required
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    assert_eq!(circle_id, 1);

    // 2. Join circle
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Active);

    // 3. Cycle 0 Contributions
    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);

    // 4. Release payout 0 (Recipient user1)
    let user1_balance_before = token_client.balance(&user1);
    client.check_and_release_payout(&circle_id);
    let user1_balance_after = token_client.balance(&user1);
    assert_eq!(user1_balance_after - user1_balance_before, 200);

    // 5. Cycle 1 Contributions
    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);

    // 6. Release payout 1 (Recipient user2)
    client.check_and_release_payout(&circle_id);

    let status_final = client.get_circle_status(&circle_id);
    assert_eq!(status_final.status, types::CircleStatus::Completed);

    // 7. Withdraw Collateral
    client.withdraw_collateral(&circle_id, &user1);
    client.withdraw_collateral(&circle_id, &user2);
}

#[test]
fn test_default_slashing_and_deficit_coverage_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone()];

    // Create circle where collateral required (100) >= contribution (100)
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100, // contribution per cycle
        &86400, // interval (1 day)
        &2, // member count
        &100, // collateral required
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    // Both join and stake 100 collateral
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    // Cycle 0: user1 deposits 100 contribution. user2 fails to contribute.
    client.contribute(&circle_id, &user1, &100);

    // Fast-forward past interval (86400) + grace period (86400)
    let current_ts = env.ledger().timestamp();
    env.ledger().with_mut(|li| {
        li.timestamp = current_ts + 86400 + 86400 + 10;
    });

    // Slash defaulter (user2) and liquidate deficit into current cycle pot
    client.handle_default(&circle_id, &user2);

    // Circle MUST remain Active because user2's collateral covered their missing share
    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Active);

    // user1 (honest recipient) can successfully release the full pot of 200 tokens
    let user1_balance_before = token_client.balance(&user1);
    client.check_and_release_payout(&circle_id);
    let user1_balance_after = token_client.balance(&user1);
    assert_eq!(user1_balance_after - user1_balance_before, 200);

    // Advance to cycle 1: user1 received payout in cycle 0
    let status_after_payout = client.get_circle_status(&circle_id);
    assert_eq!(status_after_payout.current_cycle, 1);
}

#[test]
fn test_emergency_unwind_and_refund_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone()];

    // Create circle where collateral (50) < contribution (100)
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100, // contribution per cycle
        &86400, // interval (1 day)
        &2, // member count
        &50, // collateral required
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    // Both join and stake 50 collateral
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    // Cycle 0: user1 pays 100. user2 defaults.
    client.contribute(&circle_id, &user1, &100);

    // Fast-forward past interval + grace period
    let current_ts = env.ledger().timestamp();
    env.ledger().with_mut(|li| {
        li.timestamp = current_ts + 86400 + 86400 + 10;
    });

    // Collateral (50) is insufficient to cover deficit (100) -> circle becomes Defaulted
    client.handle_default(&circle_id, &user2);
    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Defaulted);

    // Trigger emergency unwind -> circle becomes Terminated
    client.emergency_unwind(&circle_id);
    let status_unwound = client.get_circle_status(&circle_id);
    assert_eq!(status_unwound.status, types::CircleStatus::Terminated);

    // user1 withdraws their full refund: 50 collateral + 100 unreleased cycle contribution = 150
    let user1_balance_before = token_client.balance(&user1);
    client.withdraw_collateral(&circle_id, &user1);
    let user1_balance_after = token_client.balance(&user1);
    assert_eq!(user1_balance_after - user1_balance_before, 150);

    // user1 has now restored their initial 1000 tokens balance
    assert_eq!(token_client.balance(&user1), 1000);
}

#[test]
fn test_events_and_ttl_management() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);
    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone()];

    // 1. Create circle
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100,
        &86400,
        &2,
        &50,
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );
    assert_eq!(circle_id, 1);

    let events_after_create = env.events().all();
    assert!(events_after_create.len() >= 1);

    // 2. Join circle
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    let events_after_join = env.events().all();
    assert!(events_after_join.len() > events_after_create.len());

    // 3. Contribute for cycle 0
    client.contribute(&circle_id, &user1, &100);
    let events_after_contrib = env.events().all();
    assert!(events_after_contrib.len() > events_after_join.len());

    client.contribute(&circle_id, &user2, &100);

    // 4. Release payout for cycle 0
    client.check_and_release_payout(&circle_id);
    let events_after_payout = env.events().all();
    assert!(events_after_payout.len() > events_after_contrib.len());

    // 5. Complete cycle 1 and verify completed event
    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);
    client.check_and_release_payout(&circle_id);

    let final_status = client.get_circle_status(&circle_id);
    assert_eq!(final_status.status, types::CircleStatus::Completed);

    let final_events = env.events().all();
    assert!(final_events.len() > events_after_payout.len());
}

#[test]
fn test_leave_circle_in_forming_state() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);
    token_admin_client.mint(&user3, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone(), user3.clone()];

    // 1. Create circle requiring 3 members and 50 collateral
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100, // contribution per cycle
        &86400, // interval (1 day)
        &3, // member count
        &50, // collateral required
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    // 2. User1 and User2 join
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    assert_eq!(token_client.balance(&user2), 950);
    let status_before = client.get_circle_status(&circle_id);
    assert_eq!(status_before.status, types::CircleStatus::Forming);

    // 3. User2 leaves while circle is still Forming
    client.leave_circle(&circle_id, &user2);

    // User2's 50 collateral is refunded back to their balance
    assert_eq!(token_client.balance(&user2), 1000);

    // Circle remains in Forming state with seat reopened
    let status_after_leave = client.get_circle_status(&circle_id);
    assert_eq!(status_after_leave.status, types::CircleStatus::Forming);

    // 4. Replacement members join to complete capacity
    let user4 = Address::generate(&env);
    token_admin_client.mint(&user4, &1000);

    client.join_circle(&circle_id, &user3);
    client.join_circle(&circle_id, &user4);

    // Circle is now Active!
    let status_active = client.get_circle_status(&circle_id);
    assert_eq!(status_active.status, types::CircleStatus::Active);
}

#[test]
fn test_cancel_circle_by_creator() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let payout_schedule = vec![&env, user1.clone(), user2.clone()];

    // Create 3-member circle
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100,
        &86400,
        &3,
        &75, // collateral required
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    // User1 and User2 join and deposit 75 collateral each
    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    assert_eq!(token_client.balance(&user1), 925);
    assert_eq!(token_client.balance(&user2), 925);

    // Creator cancels the unfilled circle
    client.cancel_circle(&circle_id, &creator);

    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Cancelled);

    // Both user1 and user2 receive their 75 collateral refunded
    assert_eq!(token_client.balance(&user1), 1000);
    assert_eq!(token_client.balance(&user2), 1000);
}

#[test]
fn test_cancel_circle_by_member_after_expiry() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);

    let payout_schedule = vec![&env, user1.clone()];

    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100,
        &86400,
        &3,
        &50,
        &payout_schedule,
        &types::PayoutOrderMode::Fixed,
    );

    // User1 joins and deposits 50 collateral
    client.join_circle(&circle_id, &user1);
    assert_eq!(token_client.balance(&user1), 950);

    // Fast-forward past 7 days expiry window
    let current_ts = env.ledger().timestamp();
    env.ledger().with_mut(|li| {
        li.timestamp = current_ts + types::FORMING_EXPIRY_SECONDS + 10;
    });

    // Joined member cancels after 7-day inactivity
    client.cancel_circle(&circle_id, &user1);

    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Cancelled);

    // User1 collateral is refunded in full
    assert_eq!(token_client.balance(&user1), 1000);
}

#[test]
fn test_randomized_payout_schedule_shuffle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);
    token_admin_client.mint(&user3, &1000);

    let empty_schedule = vec![&env];

    // Create circle with Randomized payout order mode
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100,
        &86400,
        &3,
        &50,
        &empty_schedule,
        &types::PayoutOrderMode::Randomized,
    );

    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);

    let status_mid = client.get_circle_status(&circle_id);
    assert_eq!(status_mid.status, types::CircleStatus::Forming);

    // Final member joins - triggers circle activation and Fisher-Yates PRNG shuffle
    client.join_circle(&circle_id, &user3);

    let status_active = client.get_circle_status(&circle_id);
    assert_eq!(status_active.status, types::CircleStatus::Active);
    assert_eq!(status_active.payout_schedule.len(), 3);

    // Verify all 3 members are present in the shuffled payout schedule
    assert!(status_active.payout_schedule.contains(user1.clone()));
    assert!(status_active.payout_schedule.contains(user2.clone()));
    assert!(status_active.payout_schedule.contains(user3.clone()));
}

#[test]
fn test_bid_based_auction_flow_with_dividends() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CircleChainContract);
    let client = CircleChainContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);
    token_admin_client.mint(&user3, &1000);

    let empty_schedule = vec![&env];

    // Create 3-member circle with BidBased auction mode (contribution = 100 per member, pot = 300)
    let circle_id = client.create_circle(
        &creator,
        &token_contract,
        &100,
        &86400,
        &3,
        &50,
        &empty_schedule,
        &types::PayoutOrderMode::BidBased,
    );

    client.join_circle(&circle_id, &user1);
    client.join_circle(&circle_id, &user2);
    client.join_circle(&circle_id, &user3);

    let status = client.get_circle_status(&circle_id);
    assert_eq!(status.status, types::CircleStatus::Active);

    // --- Cycle 0 ---
    // All 3 members contribute 100 USDC each (total pot = 300 USDC)
    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);
    client.contribute(&circle_id, &user3, &100);

    // User2 bids discount of 20 USDC (willing to accept 280)
    client.submit_bid(&circle_id, &0, &user2, &20);

    // User1 urgently needs funds and bids discount of 60 USDC (highest discount!)
    client.submit_bid(&circle_id, &0, &user1, &60);

    let bids = client.get_cycle_bids(&circle_id, &0);
    assert_eq!(bids.len(), 2);

    let u1_bal_before = token_client.balance(&user1);
    let u2_bal_before = token_client.balance(&user2);
    let u3_bal_before = token_client.balance(&user3);

    // Release payout for Cycle 0
    // Total pot = 300 USDC. Winning discount = 60 USDC.
    // Other members = 2 (user2 and user3).
    // Dividend per other member = 60 / 2 = 30 USDC each.
    // Net pot for winner user1 = 300 - 60 = 240 USDC.
    client.check_and_release_payout(&circle_id);

    let u1_bal_after = token_client.balance(&user1);
    let u2_bal_after = token_client.balance(&user2);
    let u3_bal_after = token_client.balance(&user3);

    assert_eq!(u1_bal_after - u1_bal_before, 240); // User1 won net pot
    assert_eq!(u2_bal_after - u2_bal_before, 30);  // User2 received dividend bonus!
    assert_eq!(u3_bal_after - u3_bal_before, 30);  // User3 received dividend bonus!

    // --- Cycle 1 ---
    let status_c1 = client.get_circle_status(&circle_id);
    assert_eq!(status_c1.current_cycle, 1);

    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);
    client.contribute(&circle_id, &user3, &100);

    // User2 bids discount of 40 USDC
    client.submit_bid(&circle_id, &1, &user2, &40);

    let u2_bal_c1_before = token_client.balance(&user2);
    let u1_bal_c1_before = token_client.balance(&user1);
    let u3_bal_c1_before = token_client.balance(&user3);

    client.check_and_release_payout(&circle_id);

    // Winning discount = 40 USDC. Other members = 2 (user1 and user3).
    // Dividend per other member = 40 / 2 = 20 USDC each.
    // Winner user2 net pot = 300 - 40 = 260 USDC.
    assert_eq!(token_client.balance(&user2) - u2_bal_c1_before, 260);
    assert_eq!(token_client.balance(&user1) - u1_bal_c1_before, 20);
    assert_eq!(token_client.balance(&user3) - u3_bal_c1_before, 20);

    // --- Cycle 2 (Final Cycle) ---
    let status_c2 = client.get_circle_status(&circle_id);
    assert_eq!(status_c2.current_cycle, 2);

    client.contribute(&circle_id, &user1, &100);
    client.contribute(&circle_id, &user2, &100);
    client.contribute(&circle_id, &user3, &100);

    // No bids submitted in cycle 2; fallback gives pot to user3 (the only remaining member)
    let u3_bal_c2_before = token_client.balance(&user3);
    client.check_and_release_payout(&circle_id);

    assert_eq!(token_client.balance(&user3) - u3_bal_c2_before, 300);

    let status_completed = client.get_circle_status(&circle_id);
    assert_eq!(status_completed.status, types::CircleStatus::Completed);
}

