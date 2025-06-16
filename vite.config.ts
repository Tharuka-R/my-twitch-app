// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// VERY IMPORTANT: Replace 'your-actual-repo-name' below
// with the name of the GitHub repository you will create for this project.
// For example, if your GitHub repo will be named 'twitch-stats-tracker', use that.
const GITHUB_REPO_NAME = 'my-twitch-app'; 

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: '/my-twitch-app/',
  };

  if (command === 'build') {
    // Set the base path ONLY when building for deployment
    config.base = `/${GITHUB_REPO_NAME}/`;
  }

  return config;
});