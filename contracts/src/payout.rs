use soroban_sdk::{symbol_short, token, Address, Env, Vec};
use crate::types::{Circle, CircleStatus, DataKey, Member, TTL_EXTEND_TO, TTL_THRESHOLD};

pub fn contribute(env: &Env, circle_id: u64, member_address: Address, amount: i128) {
    member_address.require_auth();

    let circle_key = DataKey::Circle(circle_id);
    let circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    if amount != circle.contribution_amount {
        panic!("Contribution amount does not match circle requirement");
    }

    let cycle_key = DataKey::CycleContributions(circle_id, circle.current_cycle);
    let mut paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&cycle_key)
        .unwrap_or(Vec::new(env));

    // Prevent duplicate contributions in the same cycle
    for paid in paid_members.iter() {
        if paid == member_address {
            panic!("Member already contributed for this cycle");
        }
    }

    // Transfer contribution to contract vault
    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&member_address, &env.current_contract_address(), &amount);

    paid_members.push_back(member_address.clone());
    env.storage().persistent().set(&cycle_key, &paid_members);
    env.storage().persistent().extend_ttl(&cycle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);
    let member_key = DataKey::Member(circle_id, member_address.clone());
    env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit cycle_pay event
    env.events().publish(
        (symbol_short!("cycle_pay"), circle_id),
        (member_address, amount, circle.current_cycle),
    );
}

pub fn check_and_release_payout(env: &Env, circle_id: u64) {
    let circle_key = DataKey::Circle(circle_id);
    let mut circle: Circle = env
        .storage()
        .persistent()
        .get(&circle_key)
        .expect("Circle not found");

    if circle.status != CircleStatus::Active {
        panic!("Circle is not active");
    }

    let cycle_key = DataKey::CycleContributions(circle_id, circle.current_cycle);
    let paid_members: Vec<Address> = env
        .storage()
        .persistent()
        .get(&cycle_key)
        .unwrap_or(Vec::new(env));

    if paid_members.len() < circle.member_count {
        panic!("Not all members have contributed for the current cycle");
    }

    let recipient = circle.payout_schedule.get(circle.current_cycle).expect("Invalid recipient schedule");

    // Ensure recipient is eligible
    let member_key = DataKey::Member(circle_id, recipient.clone());
    let mut member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Member not found");

    if member.reputation_score == 0 && member.collateral_deposited == 0 {
        panic!("Recipient has defaulted and is disqualified from receiving payout");
    }

    let total_payout = circle.contribution_amount * (circle.member_count as i128);

    // Transfer pot to recipient
    let client = token::Client::new(env, &circle.token_address);
    client.transfer(&env.current_contract_address(), &recipient, &total_payout);

    // Mark recipient as paid out
    member.has_received_payout = true;
    env.storage().persistent().set(&member_key, &member);
    env.storage().persistent().extend_ttl(&member_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    let completed_cycle = circle.current_cycle;

    // Advance cycle or complete circle
    if circle.current_cycle + 1 >= circle.member_count {
        circle.status = CircleStatus::Completed;
        env.events().publish(
            (symbol_short!("completed"), circle_id),
            (circle.member_count,),
        );
    } else {
        circle.current_cycle += 1;
        circle.cycle_start_time = env.ledger().timestamp();
    }

    env.storage().persistent().set(&circle_key, &circle);
    env.storage().persistent().extend_ttl(&circle_key, TTL_THRESHOLD, TTL_EXTEND_TO);

    // Emit payout release event
    env.events().publish(
        (symbol_short!("payout"), circle_id),
        (recipient, total_payout, completed_cycle),
    );
}
