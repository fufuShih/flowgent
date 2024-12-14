# Flowgent Frontend

A React-based frontend for the Flowgent application, built with Vite, TypeScript, and TailwindCSS.

## Tech Stack

- React 18.3 with TypeScript
- Vite 6.0 for build tooling
- TailwindCSS for styling
- @xyflow/react for flow diagram editing
- Shadcn UI components
- Lucide React icons

## Project Structure

- `/src/components` - Reusable UI components

  - `/ui` - Shadcn UI base components
  - `FlowEditor.tsx` - Flow diagram editor component
  - `Navbar.tsx` - Main navigation component
  - `Sidebar.tsx` - Side navigation panel

- `/src/pages` - Application routes
  - `ProjectsPage.tsx` - Projects listing
  - `ProjectDetail.tsx` - Project details with matrix management
  - `MatrixEditor.tsx` - Matrix flow editor interface
  - `MatrixList.tsx` - List of matrices in a project

## Development

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```
