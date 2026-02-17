
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Relationships table
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own relationships" ON public.relationships FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create relationships" ON public.relationships FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Relationship settings
CREATE TABLE public.relationship_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES public.relationships(id) ON DELETE CASCADE NOT NULL UNIQUE,
  partner1_name TEXT NOT NULL,
  partner2_name TEXT NOT NULL,
  relationship_start_date DATE NOT NULL,
  habit_review_time TIME NOT NULL DEFAULT '21:00',
  spiritual_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.relationship_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own relationship settings" ON public.relationship_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert relationship settings" ON public.relationship_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can update relationship settings" ON public.relationship_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));

-- User habits (selected during onboarding)
CREATE TABLE public.user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_name TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON public.user_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.user_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.user_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.user_habits FOR DELETE USING (auth.uid() = user_id);
-- Partner can also view habits
CREATE POLICY "Partners can view habits" ON public.user_habits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r 
    WHERE (r.user1_id = auth.uid() AND r.user2_id = user_id) OR (r.user2_id = auth.uid() AND r.user1_id = user_id)
  ));

-- Daily habit logs
CREATE TABLE public.daily_habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES public.user_habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id, date)
);
ALTER TABLE public.daily_habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.daily_habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.daily_habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.daily_habit_logs FOR UPDATE USING (auth.uid() = user_id);
-- Partner can view logs for weekly summary
CREATE POLICY "Partners can view logs" ON public.daily_habit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r 
    WHERE (r.user1_id = auth.uid() AND r.user2_id = user_id) OR (r.user2_id = auth.uid() AND r.user1_id = user_id)
  ));

-- Weekly summaries
CREATE TABLE public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES public.relationships(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(relationship_id, week_start)
);
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summaries" ON public.weekly_summaries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "System can insert summaries" ON public.weekly_summaries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));

-- Shared events (calendar)
CREATE TABLE public.shared_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relationship_id UUID REFERENCES public.relationships(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'importante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relationship events" ON public.shared_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can create events" ON public.shared_events FOR INSERT
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.relationships r WHERE r.id = relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can update own events" ON public.shared_events FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own events" ON public.shared_events FOR DELETE
  USING (auth.uid() = created_by);

-- Love notifications
CREATE TABLE public.love_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.love_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.love_notifications FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send notifications" ON public.love_notifications FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Daily reflections (pilar del día notes)
CREATE TABLE public.daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pilar_id INT NOT NULL,
  content TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reflections" ON public.daily_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert reflections" ON public.daily_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update reflections" ON public.daily_reflections FOR UPDATE USING (auth.uid() = user_id);
-- Partner can view reflections
CREATE POLICY "Partners can view reflections" ON public.daily_reflections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r 
    WHERE (r.user1_id = auth.uid() AND r.user2_id = user_id) OR (r.user2_id = auth.uid() AND r.user1_id = user_id)
  ));

-- Enable realtime for love_notifications and shared_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.love_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_habit_logs;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relationship_settings_updated_at BEFORE UPDATE ON public.relationship_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Letters table (replacing mock data)
CREATE TABLE public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own letters" ON public.letters FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send letters" ON public.letters FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update received letters" ON public.letters FOR UPDATE USING (auth.uid() = to_user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.letters;
