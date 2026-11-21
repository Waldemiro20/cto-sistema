-- Exclusão definitiva de CTO (somente TI).
-- O histórico é preservado: os registros ficam com cto_id NULL, mas mantêm cto_codigo,
-- técnico, data e descrição. Tarefas já concluídas também são mantidas, sem a CTO.

ALTER TABLE public.historico DROP CONSTRAINT IF EXISTS historico_cto_id_fkey;
ALTER TABLE public.historico
  ADD CONSTRAINT historico_cto_id_fkey FOREIGN KEY (cto_id) REFERENCES public.ctos(id) ON DELETE SET NULL;

ALTER TABLE public.tarefas ALTER COLUMN cto_id DROP NOT NULL;
ALTER TABLE public.tarefas DROP CONSTRAINT IF EXISTS tarefas_cto_id_fkey;
ALTER TABLE public.tarefas
  ADD CONSTRAINT tarefas_cto_id_fkey FOREIGN KEY (cto_id) REFERENCES public.ctos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tarefas_cto_idx ON public.tarefas (cto_id);

CREATE OR REPLACE FUNCTION public.excluir_cto(_cto uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  c public.ctos;
  abertas int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'ti') THEN
    RAISE EXCEPTION 'Somente a equipe de TI pode excluir CTOs.';
  END IF;

  SELECT * INTO c FROM public.ctos WHERE id = _cto FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'CTO não encontrada.'; END IF;

  SELECT count(*) INTO abertas FROM public.tarefas WHERE cto_id = _cto AND status <> 'concluida';
  IF abertas > 0 THEN
    RAISE EXCEPTION 'Esta CTO tem % tarefa(s) em aberto. Conclua as tarefas antes de excluir.', abertas;
  END IF;

  -- Registro permanente da exclusão (sem cto_id, pois a CTO deixará de existir)
  INSERT INTO public.historico (cto_id, cto_codigo, tecnico, usuario_id, categoria, acao, descricao)
  VALUES (NULL, c.codigo, public.nome_usuario_atual(), auth.uid(), 'status', 'CTO excluída',
    concat_ws(E'\n',
      NULLIF(concat_ws(' · ', c.nome, c.bairro, c.endereco), ''),
      format('Localização: %s, %s', round(c.lat::numeric, 6), round(c.lng::numeric, 6))));

  DELETE FROM public.ctos WHERE id = _cto;
END $$;

REVOKE ALL ON FUNCTION public.excluir_cto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.excluir_cto(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
