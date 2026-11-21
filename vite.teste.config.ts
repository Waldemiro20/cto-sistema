// TEMPORÁRIO: servidor de verificação com Supabase simulado. Remover após o teste.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const fake = path.resolve(__dirname, "src/test/fake-client-browser.ts");

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: {
    plugins: [
      {
        name: "supabase-simulado",
        enforce: "pre",
        resolveId(id, importer) {
          if (importer?.includes("fake-client-browser")) return null;
          if (/integrations\/supabase\/client(\.ts)?$/.test(id)) return fake;
          return null;
        },
      },
    ],
  },
});
