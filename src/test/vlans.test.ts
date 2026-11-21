import { describe, expect, it } from "vitest";
import { sessaoDaCto, textoVlan, vlanDaCto } from "@/lib/vlans";

const cto = (codigo: string, extra: Record<string, string | null> = {}) => ({
  codigo,
  nome: null,
  bairro: "Centro",
  endereco: null,
  observacoes: null,
  ...extra,
});

describe("VLAN das CTOs", () => {
  it("lê a sessão no código", () => {
    expect(sessaoDaCto(cto("CTO-A-03"))).toBe("A");
    expect(sessaoDaCto(cto("AA05"))).toBe("AA");
    expect(sessaoDaCto(cto("CTO WWW 2"))).toBe("WWW");
    expect(sessaoDaCto(cto("CTO-OLT2-EEE-01"))).toBe("EEE");
    expect(sessaoDaCto(cto("CTO-ARAC-01"))).toBeNull();
    expect(sessaoDaCto(cto("CX 12", { nome: "Sessão GG" }))).toBe("GG");
  });

  it("encontra VLAN única pela cidade e sessão", () => {
    const info = vlanDaCto(cto("CTO-I-04", { bairro: "Redenção" }));
    expect(info).toMatchObject({ local: "Redenção", sessao: "I", exata: true });
    expect(info?.faixas.map((f) => f.vlan)).toEqual(["591"]);
  });

  it("mostra as duas VLANs quando a sessão se repete no local", () => {
    const info = vlanDaCto(cto("CTO-B-01", { bairro: "CAPISTRANO" }));
    expect(info?.faixas.map((f) => f.vlan)).toEqual(["520", "573"]);
    expect(textoVlan(cto("CTO-B-01", { bairro: "CAPISTRANO" }))).toContain("520 ou 573");
  });

  it("usa a OLT citada para escolher a VLAN", () => {
    const info = vlanDaCto(cto("CTO-R-02", { nome: "Capistrano OLT 02" }));
    expect(info?.faixas.map((f) => f.vlan)).toEqual(["582"]);
    const bat = vlanDaCto(cto("EEE-1", { bairro: "Baturité" }));
    expect(bat?.faixas.map((f) => f.vlan)).toEqual(["557"]);
  });

  it("identifica locais com vários nomes e acentos", () => {
    expect(vlanDaCto(cto("CTO-C-1", { bairro: "Bico da Arara" }))?.faixas[0]?.vlan).toBe("539");
    expect(vlanDaCto(cto("CTO-C-1", { bairro: "Antônio Diogo" }))?.faixas[0]?.vlan).toBe("580");
    expect(vlanDaCto(cto("CTO-P-1", { bairro: "Mazagão" }))?.faixas[0]?.vlan).toBe("657");
  });

  it("sem sessão identificada, lista as VLANs do local; sem local, não mostra nada", () => {
    const info = vlanDaCto(cto("CTO-ARAC-01", { bairro: "Ocara" }));
    expect(info).toMatchObject({ exata: false });
    expect(info?.faixas.map((f) => f.vlan)).toEqual(["620", "621"]);
    expect(vlanDaCto(cto("CTO-A-01", { bairro: "Centro" }))).toBeNull();
  });
});
