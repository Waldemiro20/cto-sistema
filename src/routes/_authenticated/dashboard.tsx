import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  MapPinned,
  NotebookPen,
  Pin,
  Plus,
  RadioTower,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  anotacoesQuery,
  capacidade,
  ctosQuery,
  dataExtenso,
  dataHora,
  meQuery,
  saudacao,
} from "@/lib/fgtech";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FGTECH CTO Maps" }] }),
  component: Dashboard,
});

/** O técnico não usa o painel da TI: vai direto para o registro de serviço. */
function Dashboard() {
  const me = useQuery(meQuery);
  if (me.data?.perfil === "tecnico") return <Navigate to="/consultar" replace />;
  return <DashboardTI />;
}

function DashboardTI() {
  const me = useQuery(meQuery);
  const ctos = useQuery(ctosQuery);
  const notas = useQuery(anotacoesQuery);

  const listaCtos = ctos.data ?? [];
  const listaNotas = notas.data ?? [];
  const ctosCriticas = listaCtos.filter(
    (c) => c.ativa && (capacidade(c) === "lotada" || capacidade(c) === "baixa"),
  );
  const inicializando = ctos.isLoading || me.isLoading;
  const indicadores = [
    {
      label: "CTOs ativas",
      valor: listaCtos.filter((c) => c.ativa).length,
      icon: RadioTower,
      cor: "text-success",
    },
    {
      label: "CTOs cadastradas",
      valor: listaCtos.length,
      icon: MapPinned,
      cor: "text-info",
    },
    {
      label: "CTOs com poucas portas ou lotadas",
      valor: ctosCriticas.length,
      icon: AlertTriangle,
      cor: "text-danger",
    },
    {
      label: "Anotações da TI",
      valor: notas.isLoading ? "—" : listaNotas.length,
      icon: NotebookPen,
      cor: "text-primary",
    },
  ];
  const recentes = listaNotas.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-primary-soft">Visão geral</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            {saudacao()}, {me.data?.nome ?? "Administrador"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{dataExtenso()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to="/tarefas">
              <NotebookPen /> Bloco de notas
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/gestao" search={{ nova: true }}>
              <Plus /> Cadastrar CTO
            </Link>
          </Button>
        </div>
      </header>

      {ctos.isError && (
        <p role="alert" className="mt-5 rounded-xl border border-danger/40 p-4 text-sm text-danger">
          Não foi possível carregar as CTOs. Tente atualizar a página.
        </p>
      )}

      <section
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores do sistema"
      >
        {indicadores.map((item) => (
          <article key={item.label} className="surface min-w-0 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
              <item.icon className={cn("size-5 shrink-0", item.cor)} aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-extrabold">{inicializando ? "—" : item.valor}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="surface p-4 sm:p-5">
          <h2 className="font-bold">Bloco de notas da TI</h2>
          {notas.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando anotações...</p>
          ) : !recentes.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {recentes.map((n) => (
                <li key={n.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {n.fixada && <Pin className="size-3.5 shrink-0 text-primary" aria-hidden />}
                    {n.titulo || n.conteudo.split("\n")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {n.autor_nome} · {dataHora(n.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/tarefas">
              Abrir bloco de notas <ArrowUpRight />
            </Link>
          </Button>
        </article>
        <article className="surface p-4 sm:p-5">
          <h2 className="font-bold">CTOs que precisam de atenção</h2>
          <p className="text-sm text-muted-foreground">
            {ctosCriticas.length} ativas com poucas portas ou lotadas
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/mapa" search={{ criticas: true }}>
              Ver CTOs críticas no mapa <ArrowUpRight />
            </Link>
          </Button>
        </article>
      </section>
    </div>
  );
}
