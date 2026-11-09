#![no_std]

pub mod types;
pub mod circle;
pub mod member;
pub mod payout;
pub mod auction;
pub mod default_logic;

#[cfg(test)]
pub mod test;

use soroban_sdk::{contract, contractimpl, Env, Address, Vec};
use types::{Circle, PayoutOrderMode};

#[contract]
pub struct CircleChainContract;

#[contractimpl]
impl CircleChainContract {
    /// Initializes a new Ajo/Esusu savings circle
    pub fn create_circle(
        env: Env,
        creator: Address,
        token_address: Address,
        contribution_amount: i128,
        interval: u64,
        member_count: u32,
        collateral_required: i128,
        payout_schedule: Vec<Address>,
        payout_order_mode: PayoutOrderMode,
    ) -> u64 {
        circle::create_circle(
            &env,
            creator,
            token_address,
            contribution_amount,
            interval,
            member_count,
            collateral_required,
            payout_schedule,
            payout_order_mode,
        )
    }

    /// Register a member and stake collateral
    pub fn join_circle(env: Env, circle_id: u64, member_address: Address) {
        member::join_circle(&env, circle_id, member_address);
    }

    /// Allows a member to leave an unfilled circle in Forming status and refunds deposited collateral
    pub fn leave_circle(env: Env, circle_id: u64, member_address: Address) {
        member::leave_circle(&env, circle_id, member_address);
    }

    /// Cancels a circle in Forming state (creator anytime, or any joined member after 7-day inactivity) and refunds all deposits
    pub fn cancel_circle(env: Env, circle_id: u64, caller: Address) {
        circle::cancel_circle(&env, circle_id, caller);
    }

    /// Deposit contribution for the current cycle
    pub fn contribute(env: Env, circle_id: u64, member_address: Address, amount: i128) {
        payout::contribute(&env, circle_id, member_address, amount);
    }

    /// Submits an auction bid for the communal pot in BidBased mode
    pub fn submit_bid(
        env: Env,
        circle_id: u64,
        cycle_index: u32,
        bidder: Address,
        discount_amount: i128,
    ) {
        auction::submit_bid(&env, circle_id, cycle_index, bidder, discount_amount);
    }

    /// Retrieves all bids submitted for a specific cycle in BidBased mode
    pub fn get_cycle_bids(env: Env, circle_id: u64, cycle_index: u32) -> Vec<types::Bid> {
        auction::get_cycle_bids(&env, circle_id, cycle_index)
    }

    /// Release payout to current recipient if all contributions are received
    pub fn check_and_release_payout(env: Env, circle_id: u64) {
        payout::check_and_release_payout(&env, circle_id);
    }

    /// Slash collateral of a member defaulting after deadline
    pub fn handle_default(env: Env, circle_id: u64, defaulter: Address) {
        default_logic::handle_default(&env, circle_id, defaulter);
    }

    /// Emergency unwind of a defaulted or stalled circle, refunding remaining collateral and unreleased contributions
    pub fn emergency_unwind(env: Env, circle_id: u64) {
        default_logic::emergency_unwind(&env, circle_id);
    }

    /// Withdraw collateral upon completion of all circle cycles or after emergency unwind
    pub fn withdraw_collateral(env: Env, circle_id: u64, member_address: Address) {
        default_logic::withdraw_collateral(&env, circle_id, member_address);
    }

    /// Returns the current state of a circle
    pub fn get_circle_status(env: Env, circle_id: u64) -> Circle {
        circle::get_circle_status(&env, circle_id)
    }
}
