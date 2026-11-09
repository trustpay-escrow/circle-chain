use soroban_sdk::{symbol_short, token, Address, Env, Vec};
use crate::types::{Bid, Circle, CircleStatus, DataKey, Member, PayoutOrderMode, TTL_EXTEND_TO, TTL_THRESHOLD};

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

    let total_pot = circle.contribution_amount * (circle.member_count as i128);
    let client = token::Client::new(env, &circle.token_address);

    let (recipient, actual_payout) = if circle.payout_order_mode == PayoutOrderMode::BidBased {
        let bids_key = DataKey::CycleBids(circle_id, circle.current_cycle);
        let bids: Vec<Bid> = env
            .storage()
            .persistent()
            .get(&bids_key)
            .unwrap_or(Vec::new(env));

        let (winner, winning_discount) = if bids.len() > 0 {
            let mut best = bids.get(0).unwrap();
            for b in bids.iter() {
                if b.discount_amount > best.discount_amount {
                    best = b;
                }
            }
            (best.bidder, best.discount_amount)
        } else {
            // Fallback: pick the next eligible member in circle who hasn't received payout
            let members_key = DataKey::CircleMembers(circle_id);
            let members: Vec<Address> = env
                .storage()
                .persistent()
                .get(&members_key)
                .expect("Members not found");

            let mut fallback_winner: Option<Address> = None;
            for m in members.iter() {
                let m_key = DataKey::Member(circle_id, m.clone());
                if let Some(mem) = env.storage().persistent().get::<DataKey, Member>(&m_key) {
                    if !mem.has_received_payout && (mem.reputation_score > 0 || mem.collateral_deposited > 0) {
                        fallback_winner = Some(m);
                        break;
                    }
                }
            }
            (fallback_winner.expect("No eligible recipient available"), 0)
        };

        let other_members_count = (circle.member_count - 1) as i128;
        let dividend_per_other_member = if other_members_count > 0 && winning_discount > 0 {
            winning_discount / other_members_count
        } else {
            0
        };

        let total_dividend = dividend_per_other_member * other_members_count;
        let winner_pot = total_pot - total_dividend;

        // Transfer net pot to winning bidder
        client.transfer(&env.current_contract_address(), &winner, &winner_pot);

        // Distribute discount surplus as dividend bonus to all other circle members!
        if dividend_per_other_member > 0 {
            let members_key = DataKey::CircleMembers(circle_id);
            let members: Vec<Address> = env
                .storage()
                .persistent()
                .get(&members_key)
                .expect("Members not found");

            for m in members.iter() {
                if m != winner {
                    client.transfer(&env.current_contract_address(), &m, &dividend_per_other_member);
                }
            }
        }

        env.events().publish(
            (symbol_short!("bid_win"), circle_id),
            (winner.clone(), winner_pot, winning_discount, dividend_per_other_member),
        );

        (winner, winner_pot)
    } else {
        // Fixed or Randomized schedule
        let rec = circle
            .payout_schedule
            .get(circle.current_cycle)
            .expect("Invalid recipient schedule");

        // Ensure recipient is eligible
        let member_key = DataKey::Member(circle_id, rec.clone());
        let member: Member = env
            .storage()
            .persistent()
            .get(&member_key)
            .expect("Member not found");

        if member.reputation_score == 0 && member.collateral_deposited == 0 {
            panic!("Recipient has defaulted and is disqualified from receiving payout");
        }

        // Transfer full pot to recipient
        client.transfer(&env.current_contract_address(), &rec, &total_pot);

        (rec, total_pot)
    };

    // Mark recipient as having received payout
    let member_key = DataKey::Member(circle_id, recipient.clone());
    let mut member: Member = env
        .storage()
        .persistent()
        .get(&member_key)
        .expect("Member not found");

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
        (recipient, actual_payout, completed_cycle),
    );
}
