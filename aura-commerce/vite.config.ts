import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  /** Must match `PORT` in `backend/shopfluence-api/.env` (Nest default is 3000). */
  const apiProxyTarget = env.VITE_PROXY_TARGET || "http://localhost:3000";

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    /** Same-origin `/api/v1` → Nest (cookie `admin_token` works; avoids ERR_CONNECTION_REFUSED to wrong port). */
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      /** Socket.IO (platform-admin namespace + user notifications namespace). */
      "/socket.io": {
        target: apiProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  assetsInclude: ['**/*.glb'],
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
