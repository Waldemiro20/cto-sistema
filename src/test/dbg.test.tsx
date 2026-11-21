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


import { appendFileSync } from "node:fs";
const L = (m: string) => appendFileSync("C:/Users/devid/AppData/Local/Temp/dbg.log", m + String.fromCharCode(10));
describe("dbg", () => {
  beforeEach(() => { db.usuario = { id: "t1", email: "ti@x.com", nome: "Admin TI", perfil: "ti" }; });
  it("editar direto", async () => {
    db.tabelas.anotacoes = [{ id: "n1", titulo: "X", conteudo: "Y", fixada: false, autor_nome: "A", atualizado_por: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }];
    await abrir("/tarefas");
    await screen.findByText("Y");
    const { toast } = await import("sonner");
    act(() => { toast.success("oi"); });
    await screen.findByText("oi");
    fireEvent.click(screen.getByRole("button", { name: /Nova anotação/ }));
    await screen.findByLabelText("Título");
    fireEvent.keyDown(screen.getByLabelText("Título"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    L("E1");
    fireEvent.click(screen.getByText("Editar").closest("button")!);
    L("E2");
    await screen.findByLabelText("Título");
    L("E3");
  });
  it.skip("passos", async () => {
    await abrir("/tarefas");
    await screen.findByRole("heading", { name: "Bloco de notas" });
    fireEvent.click(screen.getByRole("button", { name: /Nova anotação/ }));
    await screen.findByLabelText("Título");
    L("P3");
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Revisar OLT" } });
    fireEvent.change(screen.getByLabelText("Anotação"), { target: { value: "Conferir VLAN 526" } });
    L("P4");
    fireEvent.click(screen.getByRole("button", { name: /Salvar anotação/ }));
    L("P5");
    await screen.findByText("Conferir VLAN 526");
    L("P6");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    L("P6a " + document.body.style.pointerEvents + "|" + document.querySelectorAll("[data-radix-focus-guard]").length);
    await new Promise((r) => setTimeout(r, 300));
    const bt = screen.getByText("Editar").closest("button")!;
    L("P6b " + document.body.innerHTML.length);
    fireEvent.click(bt);
    L("P7");
    await screen.findByLabelText("Título");
    L("P8");
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Revisar OLT 02" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar anotação/ }));
    await screen.findByText("Revisar OLT 02");
    L("P9");
    fireEvent.click(screen.getByRole("button", { name: "Fixar anotação no topo" }));
    await waitFor(() => expect(db.tabelas.anotacoes![0]!.fixada).toBe(true));
    L("P10");
  });
});
