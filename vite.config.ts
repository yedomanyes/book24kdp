import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPagesBuild ? '/book24kdp/' : '/',
  plugins: [react()],
})
