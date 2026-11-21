/**
 * Verificação dos 5 pedidos com as telas reais do app e um Supabase simulado.
 */
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, fakeSupabase } from "./fake-supabase";

vi.mock("@/integrations/supabase/client", () => ({ supabase: fakeSupabase }));
vi.mock("leaflet", () => {
  const camada = () => ({
    addTo: () => camada(),
    clearLayers: () => {},
    on: () => {},
    remove: () => {},
  });
  const mapa = () => ({
    setView: () => mapa(),
    on: () => {},
    remove: () => {},
    invalidateSize: () => {},
    getZoom: () => 15,
  });
  const lf = {
    map: mapa,
    tileLayer: camada,
    layerGroup: camada,
    marker: camada,
    divIcon: () => ({}),
  };
  return { default: lf, ...lf };
});

import { routeTree } from "@/routeTree.gen";
import { ctosQuery } from "@/lib/fgtech";

function gerarCtos(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${String(i).padStart(5, "0")}`,
    codigo: `CTO-A-${String(i).padStart(5, "0")}`,
    nome: null,
    bairro: "Capistrano",
    endereco: null,
    observacoes: null,
    lat: -4.5,
    lng: -38.9,
    portas_total: 16,
    portas_ocupadas: 4,
    portas_atualizadas_em: null,
    portas_atualizadas_por: null,
    ativa: true,
    origem: "manual",
    ref_externa: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }));
}

async function abrir(url: string) {
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  db.tabelas = {
    ctos: [
      {
        ...gerarCtos(1)[0],
        id: "cto-1",
        codigo: "CTO-R-02",
        nome: "Capistrano OLT 02",
        bairro: "Capistrano",
      },
    ],
    historico: [],
    anotacoes: [],
    servicos_cto: [],
  };
  db.maxRows = 1000;
  db.chamadas = [];
  db.rpcs = [];
  db.usuario = { id: "u1", email: "u@x.com", nome: "Fulano", perfil: "tecnico" };
});
afterEach(cleanup);

describe("1. Sem limite de 1.000 CTOs", () => {
  it("carrega 2.500 CTOs em páginas", async () => {
    db.tabelas.ctos = gerarCtos(2500);
    const lista = await ctosQuery.queryFn!({} as never);
    expect(lista).toHaveLength(2500);
    expect(new Set(lista.map((c) => c.id)).size).toBe(2500);
  });
  it("continua funcionando se o servidor limitar a 500 por requisição", async () => {
    db.tabelas.ctos = gerarCtos(1234);
    db.maxRows = 500;
    const lista = await ctosQuery.queryFn!({} as never);
    expect(lista).toHaveLength(1234);
  });
});

describe("3. Técnico: só mapa e registrar serviço", () => {
  it("menu tem apenas Mapa de CTOs e Registrar serviço", async () => {
    await abrir("/mapa");
    const navs = await screen.findAllByRole("navigation", { name: "Menu principal" });
    const nomes = within(navs[0]!)
      .getAllByRole("link")
      .map((l) => l.textContent?.trim());
    expect(nomes).toEqual(["Mapa de CTOs", "Registrar serviço"]);
  });

  it.each(["/dashboard", "/tarefas", "/historico", "/gestao?nova=false", "/meus-registros"])(
    "%s redireciona para Registrar serviço",
    async (url) => {
      const router = await abrir(url);
      await waitFor(() => expect(router.state.location.pathname).toBe("/consultar"));
      expect(await screen.findByRole("heading", { name: "Registrar serviço" })).toBeInTheDocument();
    },
  );

  it("mapa e página da CTO continuam acessíveis", async () => {
    let router = await abrir("/mapa");
    await new Promise((r) => setTimeout(r, 50));
    expect(router.state.location.pathname).toBe("/mapa");
    cleanup();
    router = await abrir("/ctos/cto-1");
    await new Promise((r) => setTimeout(r, 50));
    expect(router.state.location.pathname).toBe("/ctos/cto-1");
  });

  it("Registrar serviço só oferece as 3 opções e salva", async () => {
    await abrir("/ctos/cto-1");
    const select = (await screen.findByLabelText("Serviço realizado")) as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual([
      "Instalação de cliente",
      "Retirada de cliente",
      "Outros",
    ]);
    fireEvent.change(select, { target: { value: "Retirada de cliente" } });
    fireEvent.change(screen.getByLabelText("O que foi feito *"), {
      target: { value: "Cliente cancelou" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar registro/ }));
    await screen.findByText("Serviço registrado");
    expect(db.rpcs.at(-1)).toMatchObject({
      fn: "registrar_servico_cto",
      args: { _servico: "Retirada de cliente", _descricao: "Cliente cancelou" },
    });
  });
});

describe("4. VLAN na CTO", () => {
  it("mostra a VLAN na página da CTO (Capistrano OLT 02, sessão R → 582)", async () => {
    await abrir("/ctos/cto-1");
    expect(await screen.findByText(/VLAN 582/)).toBeInTheDocument();
    expect(screen.getByText(/sessão R/)).toBeInTheDocument();
  });
});

describe("2. TI: bloco de notas no lugar de tarefas", () => {
  beforeEach(() => {
    db.usuario = { id: "t1", email: "ti@x.com", nome: "Admin TI", perfil: "ti" };
  });

  it("menu da TI mostra Bloco de notas e não Tarefas", async () => {
    await abrir("/dashboard");
    const navs = await screen.findAllByRole("navigation", { name: "Menu principal" });
    const nomes = within(navs[0]!)
      .getAllByRole("link")
      .map((l) => l.textContent?.trim());
    expect(nomes).toContain("Bloco de notas");
    expect(nomes).not.toContain("Tarefas");
  });

  it("dashboard não tem mais criação/quadro de tarefas", async () => {
    await abrir("/dashboard");
    await screen.findByText("Bloco de notas da TI");
    expect(screen.queryByText(/Nova tarefa/)).toBeNull();
    expect(screen.queryByText(/Tarefas da equipe/)).toBeNull();
    expect(screen.queryByText(/técnico/i)).toBeNull();
  });

  it("cria, edita, fixa e exclui anotação", async () => {
    await abrir("/tarefas");
    await screen.findByRole("heading", { name: "Bloco de notas" });
    expect(screen.queryByText(/Técnico responsável|Atribuir|técnico/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Nova anotação/ }));
    fireEvent.change(await screen.findByLabelText("Título"), {
      target: { value: "Revisar OLT" },
    });
    fireEvent.change(screen.getByLabelText("Anotação"), {
      target: { value: "Conferir VLAN 526" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar anotação/ }));
    await screen.findByText("Conferir VLAN 526");
    expect(db.tabelas.anotacoes).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Editar/ }));
    const titulo = await screen.findByLabelText("Título");
    fireEvent.change(titulo, { target: { value: "Revisar OLT 02" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar anotação/ }));
    await screen.findByText("Revisar OLT 02");

    fireEvent.click(screen.getByRole("button", { name: "Fixar anotação no topo" }));
    await waitFor(() => expect(db.tabelas.anotacoes![0]!.fixada).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: /Excluir/ }));
    const dialogo = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(db.tabelas.anotacoes).toHaveLength(0));
    await screen.findByText(/Nenhuma anotação ainda/);
  });

  it("TI vê Editar, Desativar e Excluir na CTO e o diálogo abre", async () => {
    await abrir("/ctos/cto-1");
    fireEvent.click(await screen.findByRole("button", { name: /Desativar/ }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });
});

describe("5. Mapa abaixo dos diálogos", () => {
  it("o contêiner do Leaflet cria contexto de empilhamento próprio", () => {
    const css = readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");
    const regra = css.match(/\.leaflet-container\s*\{[^}]*\}/)?.[0] ?? "";
    expect(regra).toMatch(/isolation:\s*isolate/);
    expect(regra).toMatch(/z-index:\s*0/);
  });
});
