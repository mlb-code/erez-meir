-- 004 — תיקון: ביטוי CASE החזיר text במקום identity_status
create or replace function public.submit_identity(p_id_number text, p_birth_date date)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_digits text := regexp_replace(coalesce(p_id_number, ''), '\D', '', 'g');
  v_sum integer := 0; v_d integer; v_i integer;
begin
  if auth.uid() is null then raise exception 'נדרשת התחברות'; end if;
  if length(v_digits) <> 9 then raise exception 'מספר תעודת זהות חייב להכיל 9 ספרות'; end if;
  for v_i in 1..9 loop
    v_d := substr(v_digits, v_i, 1)::integer * (case when v_i % 2 = 1 then 1 else 2 end);
    if v_d > 9 then v_d := v_d - 9; end if;
    v_sum := v_sum + v_d;
  end loop;
  if v_sum % 10 <> 0 then raise exception 'מספר תעודת הזהות אינו תקין'; end if;

  update public.profiles
     set id_number_enc = private.encrypt_id(v_digits),
         id_number_last4 = right(v_digits, 4),
         birth_date = p_birth_date,
         identity_status = (case when identity_status = 'verified' then 'verified' else 'submitted' end)::public.identity_status
   where id = auth.uid();
end;
$$;
