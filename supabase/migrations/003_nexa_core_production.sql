-- ====================================================================
-- NEXA — AI Business & Commerce Platform
-- Migration: 003_nexa_core_production.sql
-- Description: Production hardening, performance indexes, user profile
--              triggers, multi-tenant RLS, and AI memory persistence.
-- ====================================================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Automatic Profile Creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'OWNER'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'auth.users trigger creation skipped or managed by Supabase Auth engine';
END $$;

-- 3. AI Memory & Conversation Table Hardening
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Executive Strategy Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    action_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_business_id ON public.ai_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at ASC);

-- 4. Enable RLS on AI tables
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Tenant AI conversation access'
  ) THEN
    CREATE POLICY "Tenant AI conversation access"
      ON public.ai_conversations FOR ALL
      USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_messages' AND policyname = 'Tenant AI message access'
  ) THEN
    CREATE POLICY "Tenant AI message access"
      ON public.ai_messages FOR ALL
      USING (conversation_id IN (
        SELECT id FROM public.ai_conversations WHERE business_id IN (
          SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

-- 5. Performance Indexes on Core Operations
CREATE INDEX IF NOT EXISTS idx_products_business_active ON public.products(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_business_status ON public.orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_business_stage ON public.leads(business_id, stage);
CREATE INDEX IF NOT EXISTS idx_quotations_business_status ON public.quotations(business_id, status);
CREATE INDEX IF NOT EXISTS idx_rfqs_status_created ON public.rfqs(status, created_at DESC);
