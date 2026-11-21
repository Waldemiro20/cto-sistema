/**
 * VLANs por cidade/OLT e sessão (letra da CTO).
 *
 * A VLAN não é gravada no banco: é calculada a partir do cadastro da CTO, então nada muda
 * no cadastro/importação e a tabela abaixo pode ser ajustada sem migração.
 *  - Local (cidade/OLT): procurado no bairro, nome, código, observações e endereço.
 *  - Sessão: letra(s) repetidas no código ou no nome (ex.: "CTO-A-03", "AA05", "CTO WW 2")
 *    ou escrita como "Sessão AA".
 *  - Se a mesma sessão tem mais de uma VLAN no local, todas são mostradas ("520 ou 573").
 *  - Se a sessão não é identificada, mostra as VLANs do local com as respectivas sessões.
 */

export type FaixaVlan = { vlan: string; sessoes: string[]; olt?: string };
type LocalVlan = { nome: string; apelidos: string[]; faixas: FaixaVlan[] };

const s = (txt: string) => txt.split("/");

export const LOCAIS_VLAN: LocalVlan[] = [
  {
    nome: "Capistrano",
    apelidos: ["CAPISTRANO"],
    faixas: [
      { vlan: "520", sessoes: s("A/B/C/D/E/F/G/H"), olt: "01" },
      { vlan: "521", sessoes: s("I/J/K/L/M/N/O/P"), olt: "01" },
      { vlan: "522", sessoes: s("Q/R/S/T/U/V/W/X"), olt: "01" },
      { vlan: "523", sessoes: s("Y/Z/AA/BB/CC/DD/EE/FF"), olt: "01" },
      { vlan: "572", sessoes: s("Y/Z/AA/BB/CC/DD/EE"), olt: "01" },
      { vlan: "573", sessoes: s("A/B/C/D/E/F/G/H"), olt: "01" },
      { vlan: "582", sessoes: s("Q/R/S/T/U/V/W/X"), olt: "02" },
      { vlan: "526", sessoes: s("WW/XX/ZZ/AAA/BBB/CCC/DDD/EEE"), olt: "02" },
    ],
  },
  {
    nome: "Vazantes/Ideal/Capivara",
    apelidos: ["VAZANTES", "VAZANTE", "IDEAL", "CAPIVARA"],
    faixas: [{ vlan: "579", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Antônio Diogo",
    apelidos: ["ANTONIO DIOGO"],
    faixas: [
      { vlan: "524", sessoes: s("GG/HH/II/JJ/KK/LL/MM/NN") },
      { vlan: "580", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "525", sessoes: s("OO/PP/QQ/RR/SS/TT/UU/VV") },
      { vlan: "581", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Cajuás",
    apelidos: ["CAJUAS", "CAJUAIS"],
    faixas: [{ vlan: "590", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Redenção",
    apelidos: ["REDENCAO"],
    faixas: [
      { vlan: "529", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "591", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Itapiúna",
    apelidos: ["ITAPIUNA"],
    faixas: [
      { vlan: "530", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "531", sessoes: s("I/J/K/L/M/N/O/P") },
      { vlan: "532", sessoes: s("Q/R/S/T/U/V/W/X") },
      { vlan: "533", sessoes: s("Y/Z/AA/BB/CC/DD/EE/FF") },
    ],
  },
  {
    nome: "São Bernardo",
    apelidos: ["SAO BERNARDO"],
    faixas: [{ vlan: "536", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Palmatória",
    apelidos: ["PALMATORIA"],
    faixas: [
      { vlan: "537", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "549", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Lagoas",
    apelidos: ["LAGOAS"],
    faixas: [{ vlan: "538", sessoes: s("A/B/C/D") }],
  },
  {
    nome: "Caio Prado/Barra Nova/Barra Frazões/Bico da Arara",
    apelidos: ["CAIO PRADO", "BARRA NOVA", "BARRA FRAZOES", "BICO DA ARARA"],
    faixas: [{ vlan: "539", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Aratuba",
    apelidos: ["ARATUBA"],
    faixas: [
      { vlan: "540", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "541", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Baturité",
    apelidos: ["BATURITE"],
    faixas: [
      { vlan: "550", sessoes: s("I/J/K/L/M/N/O/P"), olt: "01" },
      { vlan: "551", sessoes: s("A/B/C/D/E/F/G/H"), olt: "01" },
      { vlan: "552", sessoes: s("Q/R/S/T/U/V/W/X"), olt: "01" },
      { vlan: "553", sessoes: s("Y/Z/AA/BB/CC/DD/EE/FF"), olt: "01" },
      { vlan: "554", sessoes: s("GG/HH/II/JJ/KK/LL/MM/NN"), olt: "01" },
      { vlan: "555", sessoes: s("OO/PP/QQ/RR/SS/TT/UU/VV"), olt: "01" },
      { vlan: "556", sessoes: s("WW/XX/YY/ZZ/AAA/BBB/CCC/DDD"), olt: "02" },
      { vlan: "557", sessoes: s("EEE/FFF"), olt: "02" },
    ],
  },
  {
    nome: "Aracoiaba",
    apelidos: ["ARACOIABA"],
    faixas: [
      { vlan: "570", sessoes: s("I/J/K/L/M/N/O/P") },
      { vlan: "571", sessoes: s("Q/R/S/T/U/V/W/X") },
    ],
  },
  {
    nome: "Acarape",
    apelidos: ["ACARAPE"],
    faixas: [
      { vlan: "592", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "593", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Guassi",
    apelidos: ["GUASSI"],
    faixas: [{ vlan: "599", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Ocara",
    apelidos: ["OCARA"],
    faixas: [
      { vlan: "620", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "621", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Barreira",
    apelidos: ["BARREIRA"],
    faixas: [
      { vlan: "630", sessoes: s("A/B/C/D/E/F/G/H") },
      { vlan: "631", sessoes: s("I/J/K/L/M/N/O/P") },
    ],
  },
  {
    nome: "Guaramiranga",
    apelidos: ["GUARAMIRANGA"],
    faixas: [{ vlan: "640", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Jaguarão",
    apelidos: ["JAGUARAO"],
    faixas: [{ vlan: "652", sessoes: s("A/B/C/D/E") }],
  },
  {
    nome: "Pindoba",
    apelidos: ["PINDOBA"],
    faixas: [{ vlan: "655", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Custódio",
    apelidos: ["CUSTODIO"],
    faixas: [{ vlan: "656", sessoes: s("A/B/C/D/E/F/G/H/I/J/K/L/M/N/O/P") }],
  },
  {
    nome: "Mulungu",
    apelidos: ["MUNLUNGU", "MULUNGU"],
    faixas: [{ vlan: "660", sessoes: s("A/B/C/D/E/F/G/H") }],
  },
  {
    nome: "Mazagão",
    apelidos: ["MAZAGAO"],
    faixas: [{ vlan: "657", sessoes: s("A/B/C/D/E/F/G/H/I/J/K/L/M/N/O/P") }],
  },
];

export type InfoVlan = {
  local: string;
  /** Sessão identificada na CTO (ex.: "AA"), ou null. */
  sessao: string | null;
  /** VLANs da sessão (exata) ou, sem sessão identificada, todas as VLANs do local. */
  faixas: FaixaVlan[];
  exata: boolean;
};

type CamposCto = {
  codigo: string;
  nome?: string | null;
  bairro?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
};

/** Maiúsculas, sem acentos, só letras/números separados por um espaço. */
function limpar(txt: string | null | undefined) {
  return ` ${(txt ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()} `;
}

/** Sessão válida: uma letra repetida de 1 a 3 vezes (A, AA, AAA). */
const SESSAO = /^([A-Z])\1{0,2}$/;

function acharLocal(c: CamposCto) {
  const campos = [c.bairro, c.nome, c.codigo, c.observacoes, c.endereco];
  for (const campo of campos) {
    const txt = limpar(campo);
    let melhor: { local: LocalVlan; pos: number } | null = null;
    for (const local of LOCAIS_VLAN) {
      for (const apelido of local.apelidos) {
        const pos = txt.indexOf(` ${apelido} `);
        if (pos >= 0 && (!melhor || pos < melhor.pos)) melhor = { local, pos };
      }
    }
    if (melhor) return melhor.local;
  }
  return null;
}

/** Lê a sessão no código ou no nome da CTO. */
export function sessaoDaCto(c: Pick<CamposCto, "codigo" | "nome" | "observacoes">) {
  for (const campo of [c.codigo, c.nome, c.observacoes]) {
    const explicita = limpar(campo).match(/ SE(?:SS|C)AO ([A-Z]{1,3}) /);
    if (explicita && SESSAO.test(explicita[1]!)) return explicita[1]!;
  }
  for (const campo of [c.codigo, c.nome]) {
    const tokens = limpar(campo).trim().split(" ");
    for (const token of tokens) {
      const m = token.match(/^([A-Z]{1,3})(\d*)$/);
      if (m && SESSAO.test(m[1]!)) return m[1]!;
    }
  }
  return null;
}

/** OLT citada na CTO ("OLT 02", "OLT2"), se houver. */
function oltDaCto(c: CamposCto) {
  const txt = [c.bairro, c.nome, c.codigo, c.observacoes].map(limpar).join(" ");
  const m = txt.match(/ OLT ?0*(\d+) /);
  return m ? m[1]!.padStart(2, "0") : null;
}

export function vlanDaCto(c: CamposCto): InfoVlan | null {
  const local = acharLocal(c);
  if (!local) return null;
  const olt = oltDaCto(c);
  const faixasLocal =
    olt && local.faixas.some((f) => f.olt === olt)
      ? local.faixas.filter((f) => f.olt === olt)
      : local.faixas;
  const sessao = sessaoDaCto(c);
  const daSessao = sessao ? faixasLocal.filter((f) => f.sessoes.includes(sessao)) : [];
  return daSessao.length
    ? { local: local.nome, sessao, faixas: daSessao, exata: true }
    : { local: local.nome, sessao, faixas: faixasLocal, exata: false };
}

function intervalo(f: FaixaVlan) {
  const a = f.sessoes[0];
  const b = f.sessoes[f.sessoes.length - 1];
  return a === b ? a : `${a}–${b}`;
}

/** Texto curto para exibir/compartilhar. Ex.: "520 (Capistrano · sessão A)". */
export function textoVlan(c: CamposCto) {
  const info = vlanDaCto(c);
  if (!info) return null;
  if (info.exata) {
    const vlans = info.faixas.map((f) => f.vlan).join(" ou ");
    const aviso = info.faixas.length > 1 ? " — confirme na OLT" : "";
    return `${vlans} (${info.local} · sessão ${info.sessao}${aviso})`;
  }
  return `${info.local}: ${info.faixas.map((f) => `${f.vlan} (${intervalo(f)})`).join(", ")}`;
}

export { intervalo as intervaloSessoes };
