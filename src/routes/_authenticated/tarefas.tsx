import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Loader2, NotebookPen, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  anotacoesQuery,
  dataHora,
  meQuery,
  mensagemErro,
  normalizar,
  type Anotacao,
} from "@/lib/fgtech";
import { cn } from "@/lib/utils";

/** Menu "Bloco de notas" (rota /tarefas): anotações livres da equipe de TI. */
export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({ meta: [{ title: "Bloco de notas · FGTECH CTO Maps" }] }),
  component: BlocoDeNotasPage,
});

const campo =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary";

function BlocoDeNotasPage() {
  const me = useQuery(meQuery);
  if (me.data?.perfil === "tecnico") return <Navigate to="/consultar" replace />;
  return <BlocoDeNotas />;
}

function BlocoDeNotas() {
  const qc = useQueryClient();
  const notas = useQuery(anotacoesQuery);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Anotacao | "nova" | null>(null);
  const [excluir, setExcluir] = useState<Anotacao | null>(null);

  const termo = normalizar(busca);
  const lista = (notas.data ?? []).filter(
    (n) => !termo || normalizar(`${n.titulo} ${n.conteudo} ${n.autor_nome}`).includes(termo),
  );

  async function alternarFixada(n: Anotacao) {
    const { error } = await supabase.from("anotacoes").update({ fixada: !n.fixada }).eq("id", n.id);
    if (error) {
      toast.error(mensagemErro(error));
      return;
    }
    qc.invalidateQueries({ queryKey: ["anotacoes"] });
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const { error } = await supabase.from("anotacoes").delete().eq("id", excluir.id);
    setExcluir(null);
    if (error) {
      toast.error(mensagemErro(error));
      return;
    }
    toast.success("Anotação excluída.");
    qc.invalidateQueries({ queryKey: ["anotacoes"] });
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-primary-soft">Equipe de TI</p>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">Bloco de notas</h1>
          <p className="text-sm text-muted-foreground">
            Anote informações para guardar, coisas para revisar depois, lembretes e observações.
          </p>
        </div>
        <Button onClick={() => setEditando("nova")}>
          <Plus /> Nova anotação
        </Button>
      </header>

      <div role="search" className="relative mt-5">
        <Search
          className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nas anotações"
          aria-label="Buscar nas anotações"
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="mt-5">
        {notas.isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : notas.isError ? (
          <p role="alert" className="rounded-xl border border-danger/40 p-4 text-sm text-danger">
            Não foi possível carregar as anotações. {mensagemErro(notas.error)}
          </p>
        ) : !lista.length ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <NotebookPen className="mx-auto mb-2 size-6" aria-hidden />
            {busca
              ? "Nenhuma anotação encontrada para essa busca."
              : "Nenhuma anotação ainda. Use “Nova anotação” para começar."}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((n) => (
              <li
                key={n.id}
                className={cn("surface flex min-w-0 flex-col p-4", n.fixada && "border-primary/50")}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words font-bold">
                    {n.titulo || <span className="text-muted-foreground">Sem título</span>}
                  </h2>
                  <button
                    type="button"
                    onClick={() => void alternarFixada(n)}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg hover:bg-secondary",
                      n.fixada ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-label={n.fixada ? "Desafixar anotação" : "Fixar anotação no topo"}
                    title={n.fixada ? "Desafixar" : "Fixar no topo"}
                  >
                    {n.fixada ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                  </button>
                </div>
                {n.conteudo && (
                  <p className="mt-2 line-clamp-[10] whitespace-pre-line break-words text-sm">
                    {n.conteudo}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {n.autor_nome} · {dataHora(n.created_at)}
                  {n.atualizado_por &&
                    ` · editada por ${n.atualizado_por} em ${dataHora(n.updated_at)}`}
                </p>
                <div className="mt-auto flex gap-2 pt-3">
                  <Button size="sm" variant="outline" onClick={() => setEditando(n)}>
                    <Pencil /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-danger/50 text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => setExcluir(n)}
                  >
                    <Trash2 /> Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={editando != null} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="app-theme-portal max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando === "nova" ? "Nova anotação" : "Editar anotação"}</DialogTitle>
          </DialogHeader>
          {editando != null && (
            <FormAnotacao
              nota={editando === "nova" ? null : editando}
              onSalvo={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={excluir != null} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent className="app-theme-portal">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluir?.titulo ? `“${excluir.titulo}” ` : "A anotação "}
              será removida do bloco de notas e não pode ser recuperada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmarExclusao()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormAnotacao({ nota, onSalvo }: { nota: Anotacao | null; onSalvo: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState(nota?.titulo ?? "");
  const [conteudo, setConteudo] = useState(nota?.conteudo ?? "");
  const [fixada, setFixada] = useState(nota?.fixada ?? false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!titulo.trim() && !conteudo.trim()) return setErro("Escreva um título ou um texto.");
    setSalvando(true);
    const dados = { titulo: titulo.trim(), conteudo: conteudo.trim(), fixada };
    const { error } = nota
      ? await supabase.from("anotacoes").update(dados).eq("id", nota.id)
      : await supabase.from("anotacoes").insert(dados);
    setSalvando(false);
    if (error) return setErro(mensagemErro(error));
    toast.success(nota ? "Anotação atualizada." : "Anotação salva.");
    await qc.invalidateQueries({ queryKey: ["anotacoes"] });
    onSalvo();
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="nota-titulo" className="mb-1.5 block text-sm font-semibold">
          Título
        </label>
        <input
          id="nota-titulo"
          className={campo}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Revisar CTOs da Palmatória"
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="nota-conteudo" className="mb-1.5 block text-sm font-semibold">
          Anotação
        </label>
        <Textarea
          id="nota-conteudo"
          rows={8}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Informações, lembretes ou observações."
        />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={fixada}
          onChange={(e) => setFixada(e.target.checked)}
        />
        Fixar no topo
      </label>
      {erro && (
        <p
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          {erro}
        </p>
      )}
      <Button type="submit" size="lg" disabled={salvando}>
        {salvando && <Loader2 className="animate-spin" />} Salvar anotação
      </Button>
    </form>
  );
}
