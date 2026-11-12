import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Crosshair, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PortasBadge } from "@/components/CtoPortas";
import { Button } from "@/components/ui/button";
import {
  ctosQuery,
  filtrarCtos,
  formatarDistancia,
  maisProximas,
  meQuery,
  posicaoAtual,
  saudacao,
  type Cto,
} from "@/lib/fgtech";

export const Route = createFileRoute("/_authenticated/consultar")({
  head: () => ({ meta: [{ title: "Consultar CTO · FGTECH CTO Maps" }] }),
  component: ConsultarPage,
});

/** Tela inicial do técnico: achar a CTO e abrir para registrar o que foi feito. */
function ConsultarPage() {
  const me = useQuery(meQuery);
  const ctos = useQuery(ctosQuery);
  const [termo, setTermo] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [localizando, setLocalizando] = useState(false);

  const ativas = useMemo(() => (ctos.data ?? []).filter((c) => c.ativa), [ctos.data]);
  const encontradas = termo.trim() ? filtrarCtos(ativas, termo).slice(0, 40) : [];
  const proximas = pos ? maisProximas(ativas, pos, 8) : [];

  async function localizar() {
    setLocalizando(true);
    try {
      setPos(await posicaoAtual());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLocalizando(false);
    }
  }

  const primeiroNome = me.data?.nome.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
      <p className="text-sm text-muted-foreground">
        {saudacao()}
        {primeiroNome ? `, ${primeiroNome}` : ""}
      </p>
      <h1 className="text-2xl font-extrabold">Consultar CTO</h1>
      <p className="text-sm text-muted-foreground">
        Encontre a CTO e registre o serviço que você fez nela.
      </p>

      <div role="search" className="mt-4 flex flex-col gap-2">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Código, nome, bairro ou endereço da CTO"
            aria-label="Buscar CTO"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
          {termo && (
            <button
              type="button"
              onClick={() => setTermo("")}
              className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={localizar} disabled={localizando}>
            {localizando ? <Loader2 className="animate-spin" /> : <Crosshair />} Perto de mim
          </Button>
          <Button asChild variant="outline">
            <Link to="/meus-registros">
              <ClipboardList /> Meus registros
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {ctos.isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : termo.trim() ? (
          <Lista
            titulo={`CTOs encontradas (${encontradas.length})`}
            vazio="Nenhuma CTO com esse código, nome ou endereço."
            itens={encontradas.map((c) => ({ cto: c, dist: null }))}
          />
        ) : pos ? (
          <Lista
            titulo="CTOs mais próximas de você"
            vazio="Nenhuma CTO ativa cadastrada."
            itens={proximas}
          />
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Digite o código da CTO (ex.: <strong className="text-foreground">CTO-12</strong>) ou
            toque em <strong className="text-foreground">Perto de mim</strong> para ver as CTOs mais
            próximas. {ativas.length > 0 && `${ativas.length} CTOs ativas cadastradas.`}
          </p>
        )}
      </div>
    </div>
  );
}

function Lista({
  titulo,
  vazio,
  itens,
}: {
  titulo: string;
  vazio: string;
  itens: { cto: Cto; dist: number | null }[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h2>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {itens.map(({ cto, dist }) => (
            <li key={cto.id}>
              <Link
                to="/ctos/$id"
                params={{ id: cto.id }}
                className="surface flex min-h-16 items-center gap-3 p-3 hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{cto.codigo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[cto.nome, cto.bairro, cto.endereco].filter(Boolean).join(" · ")}
                  </p>
                  <PortasBadge cto={cto} className="mt-1.5" />
                </div>
                {dist != null && (
                  <span className="shrink-0 text-sm font-bold text-info">
                    {formatarDistancia(dist)}
                  </span>
                )}
                <span className="hidden shrink-0 text-sm font-semibold text-primary sm:inline">
                  Registrar
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
