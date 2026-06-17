-- todos tablosu: yapılacaklar listesi kayıtları
create table if not exists public.todos (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) > 0),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security'yi etkinleştir
alter table public.todos enable row level security;

-- Bu uygulamada kimlik doğrulama yok; herkese (anon) tam erişim ver.
-- NOT: Bu, public bir demo içindir. Gerçek bir uygulamada
-- kullanıcı bazlı politikalar kullanılmalıdır.
create policy "Herkes okuyabilir"
  on public.todos for select
  using (true);

create policy "Herkes ekleyebilir"
  on public.todos for insert
  with check (true);

create policy "Herkes güncelleyebilir"
  on public.todos for update
  using (true)
  with check (true);

create policy "Herkes silebilir"
  on public.todos for delete
  using (true);
