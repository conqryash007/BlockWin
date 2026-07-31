-- Atomic balance operations
--
-- Replaces the read-then-write pattern (SELECT amount; UPDATE amount = <computed>)
-- that every API route used. That pattern loses concurrent writes: two requests
-- read the same starting balance and the last write wins, which allowed
-- double-spending a balance across parallel bets, cashouts and withdrawals.
--
-- adjust_balance() performs the read, the sufficiency check and the write inside a
-- single UPDATE statement. Postgres takes a row lock for the duration, so
-- concurrent callers serialize on the row instead of racing.

create or replace function public.adjust_balance(
  p_user_id uuid,
  p_delta numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_amount numeric;
  v_row_exists boolean;
begin
  -- Debits are only applied when the row still holds enough funds. The guard
  -- lives in the WHERE clause so the check and the write are one atomic step.
  update public.balances
     set amount = amount + p_delta,
         updated_at = now()
   where user_id = p_user_id
     and (p_delta >= 0 or amount >= -p_delta)
  returning amount into v_new_amount;

  if v_new_amount is null then
    select exists(select 1 from public.balances where user_id = p_user_id)
      into v_row_exists;

    if not v_row_exists then
      raise exception 'BALANCE_ROW_MISSING' using errcode = 'P0002';
    end if;

    raise exception 'INSUFFICIENT_FUNDS' using errcode = 'P0001';
  end if;

  return v_new_amount;
end;
$$;

-- Only the service role (used by the API routes) may move balances.
revoke all on function public.adjust_balance(uuid, numeric) from public, anon, authenticated;
grant execute on function public.adjust_balance(uuid, numeric) to service_role;

comment on function public.adjust_balance(uuid, numeric) is
  'Atomically applies a signed delta to a user balance. Raises INSUFFICIENT_FUNDS if a debit would overdraw, BALANCE_ROW_MISSING if the user has no balance row. Returns the new balance.';
