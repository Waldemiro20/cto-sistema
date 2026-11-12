import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RegistroItem } from "@/components/RegistroItem";
import { ctosQuery, meQuery, meusRegistrosQuery } from "@/lib/fgtech";

export const Route = createFileRoute("/_authenticated/meus-registros")({
  head: () => ({ meta: [{ title: "Meus registros · FGTECH CTO Maps" }] }),
  component: MeusRegistrosPage,
});

function MeusRegistrosPage() {
  const me = useQuery(meQuery);
  const ctos = useQuery(ctosQuery);
  const regs = useQuery({
    ...meusRegistrosQuery(me.data?.id ?? ""),
    enabled: !!me.data?.id,
  });
  const ctoById = useMemo(() => new Map((ctos.data ?? []).map((c) => [c.id, c])), [ctos.data]);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
      <Link
        to="/consultar"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Consultar CTO
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Meus registros</h1>
      <p className="text-sm text-muted-foreground">
        Serviços que você registrou nas CTOs. A TI vê estes mesmos registros no histórico.
      </p>

      {regs.isLoading || me.isLoading ? (
        <Loader2 className="mt-6 size-6 animate-spin text-muted-foreground" />
      ) : !regs.data?.length ? (
        <p className="mt-6 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Você ainda não registrou nenhum serviço. Abra uma CTO em{" "}
          <Link to="/consultar" className="font-semibold text-primary-soft underline">
            Consultar CTO
          </Link>{" "}
          e use “Registrar serviço”.
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-muted-foreground">{regs.data.length} registro(s)</p>
          <ul className="mt-2 flex flex-col gap-2">
            {regs.data.map((h) => (
              <RegistroItem
                key={h.id}
                r={h}
                cto={h.cto_id ? ctoById.get(h.cto_id) : undefined}
                mostrarCto
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
