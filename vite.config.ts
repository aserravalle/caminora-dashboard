import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


export default defineConfig({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 8080,
  },
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
});
