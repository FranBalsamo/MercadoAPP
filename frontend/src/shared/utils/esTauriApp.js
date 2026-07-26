// Distingue la app de escritorio instalada (o "npm run tauri dev") del modo de desarrollo
// en el navegador (import.meta.env.DEV con "npm run dev" suelto): varias APIs de Tauri
// (updater, notificaciones nativas, etc.) no existen fuera de un webview de Tauri.
export const esTauriApp = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
