-- Görevleri kullanıcıya bağla: her kullanıcı sadece kendi verisini görsün.

-- 1) user_id sütunu ekle (giriş yapan kullanıcının kimliği).
alter table public.todos
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Yeni eklenen kayıtlarda otomatik olarak giriş yapan kullanıcı atanır.
alter table public.todos
  alter column user_id set default auth.uid();

-- Hızlı sorgu için indeks.
create index if not exists todos_user_id_idx on public.todos (user_id);

-- 2) Eski "herkese açık" politikaları kaldır.
drop policy if exists "Herkes okuyabilir" on public.todos;
drop policy if exists "Herkes ekleyebilir" on public.todos;
drop policy if exists "Herkes güncelleyebilir" on public.todos;
drop policy if exists "Herkes silebilir" on public.todos;

-- 3) Kullanıcı bazlı politikalar: yalnızca kendi satırların.
create policy "Kendi görevlerini görür"
  on public.todos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Kendi görevini ekler"
  on public.todos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Kendi görevini günceller"
  on public.todos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Kendi görevini siler"
  on public.todos for delete
  to authenticated
  using (auth.uid() = user_id);
