-- 017_fix_upsert_provider_tx.sql
-- Atualiza a função para UPSERT "UPDATE-first" e exige user_id no INSERT inicial

create or replace function public.upsert_provider_tx(
  p_provider text,
  p_kind text,
  p_external_id text,
  p_status provider_tx_status,
  p_user_id uuid default null,
  p_amount_in_units bigint default null,
  p_amount_out_units bigint default null,
  p_asset_code text default null,
  p_asset_issuer text default null,
  p_interactive_url text default null,
  p_metadata jsonb default null
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  -- 1) Tenta atualizar se já existir (não toca em user_id)
  update public.provider_transactions p
     set status          = p_status,
         amount_in_units = coalesce(p_amount_in_units, p.amount_in_units),
         amount_out_units= coalesce(p_amount_out_units, p.amount_out_units),
         asset_code      = coalesce(p_asset_code, p.asset_code),
         asset_issuer    = coalesce(p_asset_issuer, p.asset_issuer),
         interactive_url = coalesce(p_interactive_url, p.interactive_url),
         metadata        = coalesce(p_metadata, p.metadata),
         updated_at      = now()
   where p.provider = p_provider
     and p.external_id = p_external_id
   returning id into v_id;

  if v_id is not null then
    return v_id;
  end if;

  -- 2) Não existe → precisa de user_id para inserir
  if p_user_id is null then
    raise exception 'upsert_provider_tx: user_id é obrigatório no INSERT (provider=%, external_id=%)',
      p_provider, p_external_id
      using errcode = '23502';
  end if;

  insert into public.provider_transactions (
    user_id, provider, kind, external_id, status,
    amount_in_units, amount_out_units,
    asset_code, asset_issuer, interactive_url, metadata
  ) values (
    p_user_id, p_provider, p_kind, p_external_id, p_status,
    p_amount_in_units, p_amount_out_units,
    coalesce(p_asset_code, 'BRL'), p_asset_issuer, p_interactive_url, p_metadata
  )
  returning id into v_id;

  return v_id;
end
$$;
