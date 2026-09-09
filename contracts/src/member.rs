use soroban_sdk::{Env, Address, Vec, token};
use crate::types::{Circle, CircleStatus, Member, DataKey};

pub fn join_circle(env: &Env, circle_id: u64, member_address: Address) {
    member_address.require_auth();

    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&DataKey::Circle(circle_id))
        .expect("Circle not found");

    if circle.status != CircleStatus::Forming {
        panic!("Circle is not accepting new members");
    }

    let mut members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::CircleMembers(circle_id))
        .unwrap_or(Vec::new(env));

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
    env.storage().persistent().set(&DataKey::Member(circle_id, member_address), &new_member);
    env.storage().persistent().set(&DataKey::CircleMembers(circle_id), &members);

    // If capacity reached, activate circle
    if members.len() == circle.member_count {
        circle.status = CircleStatus::Active;
        circle.cycle_start_time = env.ledger().timestamp();
    }

    env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
}
