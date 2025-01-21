create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  api_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, provider)
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Create policies
create policy "Users can view their own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own API keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own API keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);