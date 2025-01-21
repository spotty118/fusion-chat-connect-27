-- Create a function to create the profiles table if it doesn't exist
create or replace function create_profiles_if_not_exists()
returns void
language plpgsql
as $$
begin
  -- Check if the profiles table exists
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'profiles') then
    -- Create the profiles table
    create table public.profiles (
      id uuid references auth.users on delete cascade primary key,
      email_notifications boolean default false,
      updated_at timestamp with time zone,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Set up RLS
    alter table public.profiles enable row level security;

    -- Create policies
    create policy "Users can view their own profile"
      on profiles for select
      using ( auth.uid() = id );

    create policy "Users can update their own profile"
      on profiles for update
      using ( auth.uid() = id );

    -- Create a trigger to create a profile when a user signs up
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = public
    as $$
    begin
      insert into public.profiles (id)
      values (new.id);
      return new;
    end;
    $$;

    -- Trigger the function every time a user is created
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end;
$$;

-- Execute the function to ensure the profiles table exists
select create_profiles_if_not_exists();