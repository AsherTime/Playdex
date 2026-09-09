-- Follow-up hardening: app_role must never be writable through public clients.

revoke insert, update on public.profiles from anon, authenticated;
revoke insert (app_role), update (app_role) on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;

do $$
declare
  insert_columns text;
  update_columns text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into insert_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name not in ('app_role', 'created_at', 'updated_at');

  if insert_columns is not null then
    execute format('grant insert (%s) on public.profiles to authenticated', insert_columns);
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into update_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name not in ('id', 'email', 'app_role', 'created_at', 'updated_at');

  if update_columns is not null then
    execute format('grant update (%s) on public.profiles to authenticated', update_columns);
  end if;
end;
$$;
