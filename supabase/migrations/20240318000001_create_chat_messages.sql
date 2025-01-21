create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Create policies
create policy "Users can view their own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);