-- 021 — save_matches מקבל ציון לכל צד והסתברות סגירה, ומסמן מעגלים שפגו.
create or replace function public.save_matches(p_matches jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_ids uuid[]; v_len integer; v_valid integer; v_saved integer := 0;
begin
  if auth.uid() is null then raise exception 'נדרשת התחברות'; end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_matches, '[]'::jsonb)) loop
    select array_agg(value::text::uuid order by ord) into v_ids
      from jsonb_array_elements_text(v_item->'chain_listing_ids') with ordinality t(value, ord);
    v_len := coalesce(array_length(v_ids, 1), 0);
    if v_len < 2 or v_len > 5 then continue; end if;

    select count(distinct id) into v_valid from public.listings
     where id = any(v_ids) and status = 'active' and (locked_until is null or locked_until < now());
    if v_valid <> v_len then continue; end if;

    insert into public.matches (match_type, chain_listing_ids, score, scores, estimated_close_probability, status)
    values (
      (v_item->>'match_type')::public.match_kind, v_ids,
      greatest(0, least(100, coalesce((v_item->>'score')::integer, 0))),
      coalesce(v_item->'scores', '{}'::jsonb),
      nullif(v_item->>'estimated_close_probability', '')::numeric,
      'suggested'
    )
    on conflict (chain_listing_ids) do update
      set score = excluded.score,
          scores = excluded.scores,
          estimated_close_probability = excluded.estimated_close_probability
      where public.matches.status in ('suggested', 'expired');
    v_saved := v_saved + 1;
  end loop;

  -- מעגל שאחת המודעות בו כבר לא פעילה — פג, אלא אם כבר בסגירה/הוחלף
  update public.matches m set status = 'expired'
   where m.status in ('suggested', 'interested_partial', 'all_interested')
     and exists (select 1 from unnest(m.chain_listing_ids) cid
                 join public.listings l on l.id = cid where l.status <> 'active');
  return v_saved;
end;
$$;
