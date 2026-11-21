-- 1) Bloco de notas da TI (substitui o menu de tarefas para técnicos).
--    As tarefas antigas continuam no banco (nada é apagado), apenas deixam de ser usadas.
CREATE TABLE IF NOT EXISTS public.anotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  conteudo text NOT NULL DEFAULT '',
  fixada boolean NOT NULL DEFAULT false,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_nome text NOT NULL DEFAULT 'Sistema',
  atualizado_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anotacoes_nao_vazia CHECK (btrim(titulo) <> '' OR btrim(conteudo) <> '')
);
CREATE INDEX IF NOT EXISTS anotacoes_ordem_idx ON public.anotacoes (fixada DESC, updated_at DESC);

-- Autor e datas preenchidos pelo banco
CREATE OR REPLACE FUNCTION public.anotacoes_antes_salvar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.autor_id := auth.uid();
    NEW.autor_nome := public.nome_usuario_atual();
    NEW.atualizado_por := NULL;
    NEW.created_at := now();
  ELSE
    NEW.autor_id := OLD.autor_id;
    NEW.autor_nome := OLD.autor_nome;
    NEW.created_at := OLD.created_at;
    NEW.atualizado_por := public.nome_usuario_atual();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS anotacoes_antes_salvar ON public.anotacoes;
CREATE TRIGGER anotacoes_antes_salvar BEFORE INSERT OR UPDATE ON public.anotacoes
FOR EACH ROW EXECUTE FUNCTION public.anotacoes_antes_salvar();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anotacoes TO authenticated;
GRANT ALL ON public.anotacoes TO service_role;
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ti gerencia anotacoes" ON public.anotacoes;
CREATE POLICY "ti gerencia anotacoes" ON public.anotacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ti')) WITH CHECK (public.has_role(auth.uid(), 'ti'));

-- 2) Registrar serviço: somente Instalação de cliente, Retirada de cliente e Outros.
UPDATE public.servicos_cto SET nome = 'Outros'
WHERE nome = 'Outro' AND NOT EXISTS (SELECT 1 FROM public.servicos_cto WHERE nome = 'Outros');
INSERT INTO public.servicos_cto (nome, ordem, ativo) VALUES
  ('Instalação de cliente', 1, true), ('Retirada de cliente', 2, true), ('Outros', 3, true)
ON CONFLICT (nome) DO UPDATE SET ordem = EXCLUDED.ordem, ativo = true;
UPDATE public.servicos_cto SET ativo = false
WHERE nome NOT IN ('Instalação de cliente', 'Retirada de cliente', 'Outros');

CREATE OR REPLACE FUNCTION public.registrar_servico_cto(
  _cto uuid, _servico text, _descricao text, _portas_utilizadas text, _portas_ocupadas_obs int
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.ctos; novo uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  SELECT * INTO c FROM ctos WHERE id = _cto;
  IF c.id IS NULL THEN RAISE EXCEPTION 'CTO não encontrada'; END IF;
  IF NOT c.ativa THEN RAISE EXCEPTION 'CTO desativada'; END IF;
  IF COALESCE(btrim(_servico),'') NOT IN ('Instalação de cliente', 'Retirada de cliente', 'Outros') THEN
    RAISE EXCEPTION 'serviço inválido: escolha Instalação de cliente, Retirada de cliente ou Outros';
  END IF;
  IF COALESCE(btrim(_descricao),'') = '' THEN RAISE EXCEPTION 'descreva o que foi feito'; END IF;
  IF _portas_ocupadas_obs IS NOT NULL AND (_portas_ocupadas_obs < 0 OR (c.portas_total IS NOT NULL AND _portas_ocupadas_obs > c.portas_total)) THEN
    RAISE EXCEPTION 'quantidade de portas inválida';
  END IF;
  INSERT INTO historico (cto_id, cto_codigo, tecnico, usuario_id, categoria, acao, descricao, portas_utilizadas, portas_ocupadas_obs)
  VALUES (c.id, c.codigo, public.nome_usuario_atual(), auth.uid(), 'servico', btrim(_servico), btrim(_descricao),
    NULLIF(btrim(COALESCE(_portas_utilizadas,'')),''), _portas_ocupadas_obs)
  RETURNING id INTO novo;
  RETURN novo;
END $$;

NOTIFY pgrst, 'reload schema';
