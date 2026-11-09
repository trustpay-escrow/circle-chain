use soroban_sdk::{symbol_short, token, Address, Env, Vec};
use crate::types::{Circle, CircleStatus, DataKey, Member, TTL_EXTEND_TO, TTL_THRESHOLD};

pub fn join_circle(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Forming {
        panic!("Circle is not accepting new members");
    }

    let members_key = DataKey::CircleMembers(circle_id);
    let mut members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&members_key)
        .unwrap_or(Vec::new(env));

    if members.iter().any(|m| m == member_address) {
        panic!("Member already joined");
    }

    if members.len() >= circle.member_count {
        panic!("Circle capacity reached");
    }

    // Transfer collateral from member to contract vault
    if circle.collateral_required > 0 {
        let client = token::Client::new(env, &circle.token_address);
        client.transfer(&member_address, &env.current_contract_address(), &circle.collateral_required);
    }

    let new_member = Member {
        address: member_address.clone(),
        join_timestamp: env.ledger().timestamp(),
        collateral_deposited: circle.collateral_required,
        has_received_payout: false,
        reputation_score: 100, // Initial reputation baseline score
    };

    members.push_back(member_address.clone());

    let member_key = DataKey::Member(circle_id, member_address.clone());
    env.storage().persistent().set(&member_key, &new_member);
    env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.storage().persistent().set(&members_key, &members);
    env.storage().persistent().extend_ttl(&members_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // If capacity reached, activate circle
    if members.len() == circle.member_count {
        circle.status = CircleStatus::Active;
        circle.cycle_start_time = env.ledger().timestamp();

        env.events().publish(
            (symbol_short!("activated"), circle_id),
            (circle.member_count, circle.cycle_start_time),
        );
    }

    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit member join event
    env.events().publish(
        (symbol_short!("joined"), circle_id),
        (member_address, circle.collateral_required, members.len()),
    );
}

/// Allows a joined member to leave an unfilled circle in Forming status,
/// automatically refunding their staked collateral and freeing up the seat.
pub fn leave_circle(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Forming {
        panic!("Cannot leave circle after formation");
    }

    let member_key = DataKey::Member(circle_id, member_address.clone());
    let member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Member not in circle");

    let members_key = DataKey::CircleMembers(circle_id);
    let members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&members_key)
        .expect("Members list not found");

    let mut new_members: Vec<Address> = Vec::new(env);
    let mut found = false;
    for m in members.iter() {
        if m == member_address {
            found = true;
        } else {
            new_members.push_back(m);
        }
    }

    if !found {
        panic!("Member not found in members list");
    }

    // Refund collateral to member
    let refund_amount = member.collateral_deposited;
    if refund_amount > 0 {
        let client = token::Client::new(env, &circle.token_address);
        client.transfer(&env.current_contract_address(), &member_address, &refund_amount);
    }

    // Clean up persistent storage and update member list
    env.storage().persistent().remove(&member_key);
    env.storage().persistent().set(&members_key, &new_members);
    env.storage().persistent().extend_ttl(&members_key, TTL_THRESHOLD, TTL_EXTEND_TO);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit member left event
    env.events().publish(
        (symbol_short!("left"), circle_id),
        (member_address, refund_amount, new_members.len()),
    );
}
