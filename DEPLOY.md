# Publicar el frontend (Cloudflare Pages)

Guía completa, con el backend, en `docs/PUBLICACION.md` de la carpeta del proyecto. Resumen del frontend:

- **Sitio estático:** React 18 + Vite (`npm run build` produce `dist/`).
- **URL del backend:** el código llama a `/api/v1` en su mismo dominio. En Cloudflare Pages, la función `functions/api/[[path]].ts` reenvía `/api/*` al backend de Render (`src/lib/pagesProxy.ts`). Así:
  - la cookie de sesión sigue siendo de mismo origen;
  - no hace falta CORS con credenciales;
  - la IP real del visitante llega al backend para los límites de intentos.
- **Servicios externos:** ninguno. Mapa con capas propias, fotos y fuentes tipográficas locales.
- **Ruteo:** Pages sirve `index.html` para las rutas del SPA porque no hay `404.html`.
- **Cabeceras de seguridad:** `public/_headers`.

## Configuración en Cloudflare Pages

| Campo | Valor |
|---|---|
| Framework preset | None (o Vite) |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Variable `NODE_VERSION` | `24` (también en `.nvmrc`) |
| Variable `BACKEND_URL` | `https://<tu-servicio>.onrender.com` |
| Variable `PROXY_SECRET` (secreta) | el mismo valor que en Render |
