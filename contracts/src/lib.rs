#![no_std]

pub mod types;
pub mod circle;
pub mod member;
pub mod payout;
pub mod default_logic;

#[cfg(test)]
pub mod test;

use soroban_sdk::{contract, contractimpl, Env, Address, Vec};
use types::Circle;

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
        )
    }

    /// Register a member and stake collateral
    pub fn join_circle(env: Env, circle_id: u64, member_address: Address) {
        member::join_circle(&env, circle_id, member_address);
    }

    /// Deposit contribution for the current cycle
    pub fn contribute(env: Env, circle_id: u64, member_address: Address, amount: i128) {
        payout::contribute(&env, circle_id, member_address, amount);
    }

    /// Release payout to current recipient if all contributions are received
    pub fn check_and_release_payout(env: Env, circle_id: u64) {
        payout::check_and_release_payout(&env, circle_id);
    }

    /// Slash collateral of a member defaulting after deadline
    pub fn handle_default(env: Env, circle_id: u64, defaulter: Address) {
        default_logic::handle_default(&env, circle_id, defaulter);
    }

    /// Withdraw collateral upon completion of all circle cycles
    pub fn withdraw_collateral(env: Env, circle_id: u64, member_address: Address) {
        default_logic::withdraw_collateral(&env, circle_id, member_address);
    }

    /// Returns the current state of a circle
    pub fn get_circle_status(env: Env, circle_id: u64) -> Circle {
        circle::get_circle_status(&env, circle_id)
    }
}
