import { Network } from "lucide-react";
import { intervaloSessoes, vlanDaCto } from "@/lib/vlans";
import type { Cto } from "@/lib/fgtech";
import { cn } from "@/lib/utils";

/** VLAN da CTO, calculada pela cidade/OLT e pela sessão (letra) da CTO. */
export function CtoVlan({
  cto,
  className,
}: {
  cto: Pick<Cto, "codigo" | "nome" | "bairro" | "endereco" | "observacoes">;
  className?: string;
}) {
  const info = vlanDaCto(cto);
  if (!info) return null;

  return (
    <div className={cn("rounded-xl border bg-secondary/60 p-3 text-sm", className)}>
      <p className="flex items-center gap-2 font-bold">
        <Network className="size-4 shrink-0 text-info" aria-hidden />
        {info.exata ? (
          <>
            VLAN {info.faixas.map((f) => f.vlan).join(" ou ")}
            <span className="font-normal text-muted-foreground">
              · {info.local} · sessão {info.sessao}
            </span>
          </>
        ) : (
          <>VLANs de {info.local}</>
        )}
      </p>
      {info.exata && info.faixas.length > 1 && (
        <p className="mt-1 text-xs text-muted-foreground">
          A sessão {info.sessao} aparece em mais de uma VLAN neste local:{" "}
          {info.faixas
            .map((f) => `${f.vlan} (${f.sessoes.join("/")}${f.olt ? ` · OLT ${f.olt}` : ""})`)
            .join("; ")}
          . Confirme na OLT qual está em uso.
        </p>
      )}
      {!info.exata && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            {info.sessao
              ? `A sessão ${info.sessao} não consta na tabela deste local.`
              : "Sessão da CTO não identificada no código."}{" "}
            VLANs do local por sessão:
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {info.faixas.map((f) => (
              <li
                key={f.vlan}
                className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold"
                title={`Sessões ${f.sessoes.join("/")}`}
              >
                {f.vlan} · {intervaloSessoes(f)}
                {f.olt ? ` · OLT ${f.olt}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
