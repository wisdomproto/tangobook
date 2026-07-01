-- Referral RPC: atomic capped increment with all abuse guards in SQL.
-- Apply this once against the Supabase project (service-role or Supabase dashboard SQL editor).
-- The entitlements table must already exist with:
--   account_id pk, paid_until, referral_bonus_days int default 0,
--   referral_code text unique, referred_by uuid, updated_at.

-- 양방향(드롭박스식) 보상: 초대자 +7 AND 초대받은 사람 +7 (각 최대 28일).
create or replace function public.redeem_referral(p_new_account uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_inviter uuid; v_referred uuid; v_inviter_bonus int; v_referee_bonus int;
begin
  select account_id into v_inviter from public.entitlements where referral_code = p_code;
  if v_inviter is null then return jsonb_build_object('ok', false, 'reason', 'invalid_code'); end if;
  if v_inviter = p_new_account then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  insert into public.entitlements (account_id) values (p_new_account) on conflict (account_id) do nothing;
  select referred_by into v_referred from public.entitlements where account_id = p_new_account;
  if v_referred is not null then return jsonb_build_object('ok', false, 'reason', 'already_referred'); end if;
  update public.entitlements set referred_by = v_inviter, updated_at = now()
    where account_id = p_new_account and referred_by is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'race'); end if;
  -- 초대자 +7
  update public.entitlements set referral_bonus_days = least(28, referral_bonus_days + 7), updated_at = now()
    where account_id = v_inviter returning referral_bonus_days into v_inviter_bonus;
  -- 초대받은 사람도 +7 (양방향)
  update public.entitlements set referral_bonus_days = least(28, referral_bonus_days + 7), updated_at = now()
    where account_id = p_new_account returning referral_bonus_days into v_referee_bonus;
  return jsonb_build_object('ok', true, 'inviterBonus', v_inviter_bonus, 'refereeBonus', v_referee_bonus);
end; $$;
grant execute on function public.redeem_referral(uuid, text) to authenticated, anon, service_role;
