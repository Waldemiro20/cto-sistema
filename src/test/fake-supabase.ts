/* Supabase simulado em memória para testes de tela (sem rede). */
type Linha = Record<string, unknown>;

export const db: {
  usuario: { id: string; email: string; nome: string; perfil: "ti" | "tecnico" };
  tabelas: Record<string, Linha[]>;
  /** Teto de linhas por requisição, como o max_rows do PostgREST. */
  maxRows: number;
  chamadas: { tabela: string; op: string; args: unknown[] }[];
  rpcs: { fn: string; args: Record<string, unknown> }[];
} = {
  usuario: { id: "u1", email: "u@x.com", nome: "Fulano", perfil: "tecnico" },
  tabelas: {},
  maxRows: 1000,
  chamadas: [],
  rpcs: [],
};

class Consulta implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private filtros: ((l: Linha) => boolean)[] = [];
  private ordens: { col: string; asc: boolean }[] = [];
  private faixa: [number, number] | null = null;
  private lim: number | null = null;
  private op: "select" | "insert" | "update" | "delete" = "select";
  private payload: Linha | Linha[] | null = null;
  private unico: "single" | "maybe" | null = null;

  constructor(private tabela: string) {}

  private log(op: string, ...args: unknown[]) {
    db.chamadas.push({ tabela: this.tabela, op, args });
    return this;
  }
  select(..._a: unknown[]) {
    return this.log("select");
  }
  insert(p: Linha | Linha[]) {
    this.op = "insert";
    this.payload = p;
    return this.log("insert", p);
  }
  update(p: Linha) {
    this.op = "update";
    this.payload = p;
    return this.log("update", p);
  }
  delete() {
    this.op = "delete";
    return this.log("delete");
  }
  eq(col: string, v: unknown) {
    this.filtros.push((l) => l[col] === v);
    return this.log("eq", col, v);
  }
  in(col: string, vs: unknown[]) {
    this.filtros.push((l) => vs.includes(l[col]));
    return this;
  }
  order(col: string, o?: { ascending?: boolean }) {
    this.ordens.push({ col, asc: o?.ascending ?? true });
    return this;
  }
  range(a: number, b: number) {
    this.faixa = [a, b];
    return this.log("range", a, b);
  }
  limit(n: number) {
    this.lim = n;
    return this;
  }
  single() {
    this.unico = "single";
    return this;
  }
  maybeSingle() {
    this.unico = "maybe";
    return this;
  }

  private executar() {
    const t = (db.tabelas[this.tabela] ??= []);
    if (this.op === "insert") {
      const novos = (Array.isArray(this.payload) ? this.payload : [this.payload!]).map((p) => ({
        id: `novo-${t.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        autor_nome: db.usuario.nome,
        atualizado_por: null,
        fixada: false,
        titulo: "",
        conteudo: "",
        ...p,
      }));
      t.push(...novos);
      return { data: this.unico ? novos[0] : novos, error: null };
    }
    let linhas = t.filter((l) => this.filtros.every((f) => f(l)));
    if (this.op === "update") {
      linhas.forEach((l) => Object.assign(l, this.payload));
      return { data: this.unico ? linhas[0] : linhas, error: null };
    }
    if (this.op === "delete") {
      db.tabelas[this.tabela] = t.filter((l) => !linhas.includes(l));
      return { data: null, error: null };
    }
    linhas = [...linhas].sort((a, b) => {
      for (const o of this.ordens) {
        const x = String(a[o.col] ?? "");
        const y = String(b[o.col] ?? "");
        if (x !== y) return (x < y ? -1 : 1) * (o.asc ? 1 : -1);
      }
      return 0;
    });
    const ini = this.faixa?.[0] ?? 0;
    const fim = this.faixa ? this.faixa[1] + 1 : linhas.length;
    linhas = linhas.slice(ini, fim);
    if (this.lim != null) linhas = linhas.slice(0, this.lim);
    linhas = linhas.slice(0, db.maxRows); // teto do servidor
    if (this.unico) return { data: linhas[0] ?? null, error: null };
    return { data: linhas, error: null };
  }

  then<R1, R2>(
    ok?: ((v: { data: unknown; error: null }) => R1 | PromiseLike<R1>) | null,
    erro?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ) {
    return Promise.resolve(this.executar()).then(ok, erro);
  }
}

export const fakeSupabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: db.usuario.id, email: db.usuario.email } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
  },
  from: (tabela: string) => {
    if (tabela === "usuarios") {
      db.tabelas.usuarios = [db.usuario];
    }
    return new Consulta(tabela);
  },
  rpc: async (fn: string, args: Record<string, unknown>) => {
    db.rpcs.push({ fn, args });
    if (fn === "registrar_servico_cto") {
      const permitidos = ["Instalação de cliente", "Retirada de cliente", "Outros"];
      if (!permitidos.includes(String(args._servico)))
        return { data: null, error: { message: "serviço inválido" } };
      (db.tabelas.historico ??= []).push({
        id: "h-novo",
        acao: args._servico,
        tecnico: db.usuario.nome,
        descricao: args._descricao,
        created_at: new Date().toISOString(),
        cto_id: args._cto,
      });
      return { data: "h-novo", error: null };
    }
    return { data: null, error: null };
  },
};
