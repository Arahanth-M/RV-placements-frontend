import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** Docker / CI: build args set `process.env`; `loadEnv` only reads `.env` files. */
  const pick = (name) => String(env[name] ?? process.env[name] ?? '').trim();

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      // Force proper resolution of ESM packages that use re-exports (avoids "default cannot be resolved by star export")
      include: ['react-icons/fa', 'react-icons'],
    },
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(pick('REACT_APP_API_URL')),
      'process.env.REACT_APP_MAIN_API_URL': JSON.stringify(pick('REACT_APP_MAIN_API_URL')),
      'process.env.REACT_APP_INTERVIEW_API_URL': JSON.stringify(pick('REACT_APP_INTERVIEW_API_URL')),
      'process.env.REACT_APP_DEBUG_API_ROUTING': JSON.stringify(pick('REACT_APP_DEBUG_API_ROUTING')),
      'process.env.REACT_APP_ENABLE_RESUME_BUILDER': JSON.stringify(
        pick('REACT_APP_ENABLE_RESUME_BUILDER')
      ),
    },
  };
})
