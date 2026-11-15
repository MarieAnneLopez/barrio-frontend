// Cloudflare Pages Function: todo /api/* se reenvía al backend (src/lib/pagesProxy.ts, D62).
import { proxyToBackend, type ProxyEnv } from '../../src/lib/pagesProxy';

export const onRequest = (context: { request: Request; env: ProxyEnv }) =>
  proxyToBackend(context.request, context.env);
