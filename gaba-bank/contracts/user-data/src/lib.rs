#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Address, Map};

#[derive(Clone)]
#[contracttype]
pub struct UserProfile {
    pub full_name: String,
    pub cpf: String,
    pub phone: String,
    pub wallet_address: Address,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct OnboardingData {
    pub personal_info_completed: bool,
    pub identity_verified: bool,
    pub security_verified: bool,
    pub account_created: bool,
    pub credit_application_submitted: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    UserProfile(Address),
    OnboardingData(Address),
}

#[contract]
pub struct UserDataContract;

#[contractimpl]
impl UserDataContract {
    /// Create or update user profile
    pub fn set_user_profile(
        env: Env,
        user: Address,
        full_name: String,
        cpf: String,
        phone: String,
    ) {
        user.require_auth();

        let current_time = env.ledger().timestamp();

        let profile = UserProfile {
            full_name,
            cpf,
            phone,
            wallet_address: user.clone(),
            created_at: current_time,
            updated_at: current_time,
        };

        env.storage().instance().set(&DataKey::UserProfile(user), &profile);
    }

    /// Get user profile
    pub fn get_user_profile(env: Env, user: Address) -> Option<UserProfile> {
        env.storage().instance().get(&DataKey::UserProfile(user))
    }

    /// Update onboarding progress
    pub fn update_onboarding_progress(
        env: Env,
        user: Address,
        personal_info_completed: bool,
        identity_verified: bool,
        security_verified: bool,
        account_created: bool,
        credit_application_submitted: bool,
    ) {
        user.require_auth();

        let onboarding_data = OnboardingData {
            personal_info_completed,
            identity_verified,
            security_verified,
            account_created,
            credit_application_submitted,
        };

        env.storage().instance().set(&DataKey::OnboardingData(user), &onboarding_data);
    }

    /// Get onboarding progress
    pub fn get_onboarding_progress(env: Env, user: Address) -> Option<OnboardingData> {
        env.storage().instance().get(&DataKey::OnboardingData(user))
    }

    /// Check if user has completed onboarding
    pub fn is_onboarding_complete(env: Env, user: Address) -> bool {
        if let Some(data) = Self::get_onboarding_progress(env, user) {
            data.personal_info_completed &&
            data.identity_verified &&
            data.security_verified &&
            data.account_created
        } else {
            false
        }
    }

    /// Remove user data (for privacy compliance)
    pub fn remove_user_data(env: Env, user: Address) {
        user.require_auth();

        env.storage().instance().remove(&DataKey::UserProfile(user));
        env.storage().instance().remove(&DataKey::OnboardingData(user));
    }
}

mod test;