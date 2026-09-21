import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//
// `base` is the GitHub Pages URL prefix. We keep it aligned with the
// GitHub repository name (`Maneeeeee/MEDAIR`) — not the brand name
// (`DroneAid`) — so that the existing deployment URL keeps working.
export default defineConfig({
  plugins: [react()],
  base: '/MEDAIR/',
})
