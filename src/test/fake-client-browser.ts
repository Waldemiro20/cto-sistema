// TEMPORÁRIO (verificação no navegador): substitui o Supabase real por dados em memória.
import { db, fakeSupabase } from "./fake-supabase";

const perfil = ((typeof localStorage !== "undefined" && localStorage.getItem("teste-perfil")) || "ti") as "ti" | "tecnico";
db.usuario = { id: "u1", email: "u@x.com", nome: perfil === "ti" ? "Admin TI" : "Téc João", perfil };
const base = {
  nome: null,
  endereco: null,
  observacoes: null,
  portas_total: 16,
  portas_ocupadas: 4,
  portas_atualizadas_em: null,
  portas_atualizadas_por: null,
  ativa: true,
  origem: "manual",
  ref_externa: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
db.tabelas = {
  ctos: Array.from({ length: 1500 }, (_, i) => ({
    ...base,
    id: `c${i}`,
    codigo: `CTO-${["A", "B", "Q", "AA"][i % 4]}-${String(i).padStart(4, "0")}`,
    bairro: ["Capistrano", "Baturité", "Ocara"][i % 3],
    lat: -4.47 + (i % 40) * 0.0004,
    lng: -38.9 + Math.floor(i / 40) * 0.0004,
  })),
  historico: [],
  anotacoes: [],
  servicos_cto: [],
};
export const supabase = fakeSupabase;
