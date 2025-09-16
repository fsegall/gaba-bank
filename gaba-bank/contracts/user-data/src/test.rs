#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_user_profile() {
    let env = Env::default();
    let contract_id = env.register_contract(None, UserDataContract);
    let client = UserDataContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Set user profile
    client.set_user_profile(
        &user,
        &String::from_str(&env, "John Doe"),
        &String::from_str(&env, "123.456.789-00"),
        &String::from_str(&env, "+55 11 99999-9999"),
    );

    // Get user profile
    let profile = client.get_user_profile(&user).unwrap();
    assert_eq!(profile.full_name, String::from_str(&env, "John Doe"));
    assert_eq!(profile.cpf, String::from_str(&env, "123.456.789-00"));
    assert_eq!(profile.phone, String::from_str(&env, "+55 11 99999-9999"));
}

#[test]
fn test_onboarding_progress() {
    let env = Env::default();
    let contract_id = env.register_contract(None, UserDataContract);
    let client = UserDataContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Update onboarding progress
    client.update_onboarding_progress(&user, &true, &false, &false, &false, &false);

    // Get onboarding progress
    let progress = client.get_onboarding_progress(&user).unwrap();
    assert_eq!(progress.personal_info_completed, true);
    assert_eq!(progress.identity_verified, false);

    // Check if onboarding is complete
    assert_eq!(client.is_onboarding_complete(&user), false);

    // Complete all steps
    client.update_onboarding_progress(&user, &true, &true, &true, &true, &true);
    assert_eq!(client.is_onboarding_complete(&user), true);
}

#[test]
fn test_remove_user_data() {
    let env = Env::default();
    let contract_id = env.register_contract(None, UserDataContract);
    let client = UserDataContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Set user data
    client.set_user_profile(
        &user,
        &String::from_str(&env, "Jane Doe"),
        &String::from_str(&env, "987.654.321-00"),
        &String::from_str(&env, "+55 21 88888-8888"),
    );
    client.update_onboarding_progress(&user, &true, &true, &false, &false, &false);

    // Verify data exists
    assert!(client.get_user_profile(&user).is_some());
    assert!(client.get_onboarding_progress(&user).is_some());

    // Remove user data
    client.remove_user_data(&user);

    // Verify data is removed
    assert!(client.get_user_profile(&user).is_none());
    assert!(client.get_onboarding_progress(&user).is_none());
}