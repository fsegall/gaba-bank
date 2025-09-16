#![no_std]

// topo do arquivo: ajustes de imports
use soroban_sdk::{
  contract, contracterror, contractimpl, contracttype, contractevent,
  Address, Env,
};
use soroban_sdk::token::Client as TokenClient;

// -------------------------
// Storage & Errors
// -------------------------
#[derive(Clone)]
#[contracttype]
enum DataKey {
    Asset,           // Address do token base (SAC)
    FeeBps,          // u32 (100 = 1%)
    TotalShares,     // i128
    Shares(Address), // i128 por conta

    Admin,           // Address admin
    Rebal,           // Option<Address> (armazenar como Address opcional)
    Paused,          // bool
}

#[contracterror]
pub enum Error {
    ZeroAmount = 1,
    InsufficientShares = 2,
    AlreadyInitialized = 3,
    NotAdmin = 4,
    Paused = 5,
    NotRebal = 6,
}

// === Events (novo formato) ===
#[contractevent]
pub struct DepositEvent {
    #[topic]
    pub to: Address,
    pub net: i128,
    pub shares: i128,
}

#[contractevent]
pub struct WithdrawEvent {
    #[topic]
    pub to: Address,
    pub shares: i128,
    pub amount: i128,
}

#[contractevent]
pub struct SweepEvent {
    #[topic]
    pub to: Address,
    pub amount: i128,
}
// -------------------------
// Helpers de storage
// -------------------------
fn get_addr(e: &Env, k: &DataKey) -> Address { e.storage().instance().get(k).unwrap() }
fn get_addr_opt(e: &Env, k: &DataKey) -> Option<Address> { e.storage().instance().get(k) }
fn set_addr(e: &Env, k: &DataKey, v: &Address) { e.storage().instance().set(k, v) }

fn get_u32(e: &Env, k: &DataKey) -> u32 { e.storage().instance().get(k).unwrap_or(0u32) }
fn set_u32(e: &Env, k: &DataKey, v: u32) { e.storage().instance().set(k, &v) }

fn get_i128(e: &Env, k: &DataKey) -> i128 { e.storage().instance().get(k).unwrap_or(0i128) }
fn set_i128(e: &Env, k: &DataKey, v: i128) { e.storage().instance().set(k, &v) }

fn get_bool(e: &Env, k: &DataKey) -> bool { e.storage().instance().get(k).unwrap_or(false) }
fn set_bool(e: &Env, k: &DataKey, v: bool) { e.storage().instance().set(k, &v) }

// -------------------------
// Helpers de negócio
// -------------------------
fn asset(e: &Env) -> Address { get_addr(e, &DataKey::Asset) }
fn token(e: &Env) -> TokenClient<'_> { TokenClient::new(e, &asset(e)) } // <- lifetime explícito
fn vault_addr(e: &Env) -> Address { e.current_contract_address() }

fn require_admin(e: &Env, caller: &Address) -> Result<(), Error> {
    caller.require_auth();
    if *caller != get_addr(e, &DataKey::Admin) { return Err(Error::NotAdmin); }
    Ok(())
}

fn require_not_paused(e: &Env) -> Result<(), Error> {
    if get_bool(e, &DataKey::Paused) { return Err(Error::Paused); }
    Ok(())
}

fn is_rebal(e: &Env, who: &Address) -> bool {
    if let Some(r) = get_addr_opt(e, &DataKey::Rebal) {
        *who == r || *who == get_addr(e, &DataKey::Admin)
    } else {
        *who == get_addr(e, &DataKey::Admin)
    }
}

fn calc_shares_for_deposit(amount: i128, total_shares: i128, total_assets_before: i128) -> i128 {
    if total_shares == 0 { return amount; }
    (amount * total_shares) / total_assets_before
}

// -------------------------
// Contrato
// -------------------------
#[contract]
pub struct DefyVault;

#[contractimpl]
impl DefyVault {
    // init: define asset base, admin, rebal opcional, fee_bps; paused=false
    pub fn init(e: Env, asset: Address, admin: Address, rebalancer: Option<Address>, fee_bps: u32) -> Result<(), Error> {
        if e.storage().instance().has(&DataKey::Asset) { return Err(Error::AlreadyInitialized); }
        set_addr(&e, &DataKey::Asset, &asset);
        set_addr(&e, &DataKey::Admin, &admin);
        if let Some(r) = rebalancer { set_addr(&e, &DataKey::Rebal, &r); }
        set_u32(&e, &DataKey::FeeBps, fee_bps);
        set_i128(&e, &DataKey::TotalShares, 0i128);
        set_bool(&e, &DataKey::Paused, false);
        Ok(())
    }

    // ---- views ----
    pub fn base_asset(e: Env) -> Address { asset(&e) }
    pub fn fee_bps(e: Env) -> u32 { get_u32(&e, &DataKey::FeeBps) }
    pub fn total_assets(e: Env) -> i128 { token(&e).balance(&vault_addr(&e)) }
    pub fn total_shares(e: Env) -> i128 { get_i128(&e, &DataKey::TotalShares) }
    pub fn balance_of(e: Env, owner: Address) -> i128 { e.storage().instance().get(&DataKey::Shares(owner)).unwrap_or(0i128) }
    pub fn price_per_share_scaled(e: Env) -> i128 {
        let ts = Self::total_shares(e.clone());
        if ts == 0 { return 1_000_000i128; }
        let ta = Self::total_assets(e);
        (ta * 1_000_000i128) / ts
    }

    // ---- admin ----
    pub fn set_fee_bps(e: Env, caller: Address, new_fee_bps: u32) -> Result<(), Error> {
        require_admin(&e, &caller)?;
        set_u32(&e, &DataKey::FeeBps, new_fee_bps);
        Ok(())
    }

    pub fn pause(e: Env, caller: Address) -> Result<(), Error> {
        require_admin(&e, &caller)?;
        set_bool(&e, &DataKey::Paused, true);
        Ok(())
    }

    pub fn unpause(e: Env, caller: Address) -> Result<(), Error> {
        require_admin(&e, &caller)?;
        set_bool(&e, &DataKey::Paused, false);
        Ok(())
    }

    // ---- mutations ----
    pub fn deposit(e: Env, from: Address, to: Address, amount: i128) -> Result<i128, Error> {
        require_not_paused(&e)?;
        if amount <= 0 { return Err(Error::ZeroAmount); }
        from.require_auth();

        // taxa
        let fee_bps = get_u32(&e, &DataKey::FeeBps) as i128;
        let fee = (amount * fee_bps) / 10_000i128;
        let net = amount - fee;

        // pull base tokens para o vault
        token(&e).transfer(&from, &vault_addr(&e), &net);

        let ts_before = get_i128(&e, &DataKey::TotalShares);
        let ta_before = Self::total_assets(e.clone()) - net; // assets antes do pull
        let mint = calc_shares_for_deposit(net, ts_before, ta_before);

        // credita shares
        let key = DataKey::Shares(to.clone());
        let bal = e.storage().instance().get::<_, i128>(&key).unwrap_or(0);
        e.storage().instance().set(&key, &(bal + mint));
        set_i128(&e, &DataKey::TotalShares, ts_before + mint);

        // evento novo
        DepositEvent { to, net, shares: mint }.publish(&e);

        Ok(mint)
    }

    pub fn withdraw(e: Env, owner: Address, to: Address, shares: i128) -> Result<i128, Error> {
        require_not_paused(&e)?;
        if shares <= 0 { return Err(Error::ZeroAmount); }
        owner.require_auth();

        let ts = get_i128(&e, &DataKey::TotalShares);
        let key = DataKey::Shares(owner.clone());
        let bal = e.storage().instance().get::<_, i128>(&key).unwrap_or(0);
        if shares > bal || shares > ts { return Err(Error::InsufficientShares); }

        let ta = Self::total_assets(e.clone());
        let amount_out = (shares * ta) / ts;

        e.storage().instance().set(&key, &(bal - shares));
        set_i128(&e, &DataKey::TotalShares, ts - shares);
        token(&e).transfer(&vault_addr(&e), &to, &amount_out);

        // dentro de `withdraw`, troque a publicação do evento:
        WithdrawEvent { to, shares, amount: amount_out }.publish(&e);


        Ok(amount_out)
    }

    // sweeping reservado a rebalancer (ou admin)
    pub fn sweep_to(e: Env, caller: Address, to: Address, amount: i128) -> Result<(), Error> {
        caller.require_auth();
        if !is_rebal(&e, &caller) { return Err(Error::NotRebal); }
        token(&e).transfer(&vault_addr(&e), &to, &amount);

        // evento novo
        SweepEvent { to, amount }.publish(&e);


        Ok(())
    }
}
