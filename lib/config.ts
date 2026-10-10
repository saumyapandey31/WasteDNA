/** NEXT_PUBLIC_ANALYSIS_MODE=api (default) uses the Next.js backend. "mock" keeps everything in the browser for offline demos. */
export const API_MODE = process.env.NEXT_PUBLIC_ANALYSIS_MODE !== "mock";
