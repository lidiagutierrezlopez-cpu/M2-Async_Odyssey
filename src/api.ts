import { getCache, setCache } from "./cache";

// CONFIGURACIÓN
const BASE_URL = "https://openaccess-api.clevelandart.org/api/artworks/";
export const PAGE_SIZE = 20;
const CACHE_MAX_AGE = 24*60*60*1000;
const TIMEOUT_MS = 10_000;


// DATOS QUE DEVUELVE LA API
export interface RawArtwork{
     id: number;
     title: string | null;
     type: string | null;
     creators: { description: string | null}[] | null;
     creation_date: string | null;
     creation_date_earliest: number | null;
     technique: string | null;
     department: string | null;
     images: { web?: { url: string } } | null;
     
     wall_description: string | null;
     digital_description: string | null;
     fun_fact: string | null;
     description: string | null;
     did_you_know: string | null;
}

// DE DÓNDE VIENEN LOS DATOS
export interface SearchResult{
     artworks: RawArtwork[];
     fromCache: boolean;
}



// PETICIÓN
export async function searchArtworks(query: string, skip: number, signal?: AbortSignal): Promise<SearchResult> {
     const cacheKey = `busqueda:${query.toLowerCase()}:${skip}`;
     const cached = getCache<unknown>(cacheKey, CACHE_MAX_AGE);
     if (Array.isArray(cached) && cached.every(isRawArtwork)) {
          return { artworks: cached, fromCache: true };
     }

     const params = new URLSearchParams({
          q: query,
          has_image: "1",
          limit: String(PAGE_SIZE),
          skip: String(skip)
     });
     
     const json = await fetchJSON(`${BASE_URL}?${params}`, signal)
     const data = (json as {data?: unknown} | null)?.data;
     const artworks: RawArtwork[] = Array.isArray(data) ? data : [];

     if (artworks.length > 0) setCache(cacheKey, artworks);
     return { artworks, fromCache: false};
}

async function fetchJSON (url: string, signal?: AbortSignal): Promise<unknown> {
     const timeout = AbortSignal.timeout(TIMEOUT_MS);
     const finalSignal = signal ? AbortSignal.any([signal, timeout]): timeout;

     let respuesta: Response;
     try {
          respuesta = await fetch(url, {signal: finalSignal});
     } catch (error) {
          if (signal?.aborted) throw error;
          if (timeout.aborted) {
               throw new Error ("El museo está tardando demasiado en responder.", {cause: error});
          }
          throw new Error("No hay conexión con el museo.", {cause: error});
     }
     if (!respuesta.ok) throw new Error(`El museo respondió con un error (HTTP ${respuesta.status}).`);

     try {
          return await respuesta.json();
     } catch (error){
          throw new Error("El museo ha devuelto una respuesta que no se puede leer.", {cause: error});
     }
}

function isRawArtwork(value: unknown): value is RawArtwork {
     return typeof value === "object" && value !== null && typeof (value as RawArtwork).id === "number";
}