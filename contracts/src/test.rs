#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env};

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
