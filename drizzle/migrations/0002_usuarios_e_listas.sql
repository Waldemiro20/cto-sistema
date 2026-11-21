-- Usuários: uma tabela só (nome, e-mail e perfil), ligada ao login do Supabase Auth.
-- A senha continua em auth.users, gerenciada pelo Supabase.
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'Usuário',
  email text,
  perfil public.app_role NOT NULL DEFAULT 'tecnico',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.usuarios (id, nome, email, perfil, created_at)
SELECT p.id, p.nome, COALESCE(p.email, u.email),
  CASE WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'ti')
    THEN 'ti'::public.app_role ELSE 'tecnico'::public.app_role END,
  p.created_at
FROM public.profiles p JOIN auth.users u ON u.id = p.id;

-- Usuários do Auth que por algum motivo ficaram sem perfil
INSERT INTO public.usuarios (id, nome, email, perfil)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nome', split_part(u.email,'@',1)), u.email,
  COALESCE((u.raw_user_meta_data->>'perfil')::public.app_role, 'tecnico')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.usuarios TO authenticated;
GRANT UPDATE (nome) ON public.usuarios TO authenticated; -- o próprio usuário só muda o nome, nunca o perfil
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios visiveis" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "editar proprio nome" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = _user_id AND perfil = _role)
$$;

CREATE OR REPLACE FUNCTION public.nome_usuario_atual()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT nome FROM public.usuarios WHERE id = auth.uid()), 'Sistema')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, perfil)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'perfil')::public.app_role, 'tecnico'));
  RETURN NEW;
END $$;

DROP TABLE public.user_roles;
DROP TABLE public.profiles;

-- Listas de opções que antes ficavam fixas no código. A TI pode editar pelo banco.
CREATE TABLE public.tipos_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);
CREATE TABLE public.servicos_cto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);

INSERT INTO public.tipos_servico (nome, ordem) VALUES
  ('Nova Instalação', 1), ('Troca de Porta', 2), ('Manutenção Preventiva', 3);
INSERT INTO public.servicos_cto (nome, ordem) VALUES
  ('Instalação de cliente', 1), ('Manutenção', 2), ('Troca de porta', 3),
  ('Retirada de cliente', 4), ('Vistoria', 5), ('Outro', 6);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_servico, public.servicos_cto TO authenticated;
GRANT ALL ON public.tipos_servico, public.servicos_cto TO service_role;
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_cto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver tipos" ON public.tipos_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "ti gerencia tipos" ON public.tipos_servico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ti')) WITH CHECK (public.has_role(auth.uid(),'ti'));
CREATE POLICY "ver servicos" ON public.servicos_cto FOR SELECT TO authenticated USING (true);
CREATE POLICY "ti gerencia servicos" ON public.servicos_cto FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ti')) WITH CHECK (public.has_role(auth.uid(),'ti'));
