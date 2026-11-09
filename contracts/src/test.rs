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

