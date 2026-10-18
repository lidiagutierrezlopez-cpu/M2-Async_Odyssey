import type { RawArtwork } from "./api";
import { toPlainText } from "./html-text";

// MODELO PROPIO DE LA APP
export interface Artwork{
     id: number;
     title: string;
     artist: string;
     date: string;
     year: number | null;
     type: string;
     technique: string;
     department: string;
     description: string | null;
     imageUrl: string;
}



// DE LA API AL MODELO PROPIO
export function toArtworks(raw: RawArtwork[]): Artwork[] {
     return raw.flatMap((a) => {
          const imageUrl = a.images?.web?.url;
          if (!imageUrl) return [];

          return [{
               id: a.id,
               title: a.title ?? "Sin título",
               artist: a.creators?.[0]?.description ?? "Artista desconocido",
               date: a.creation_date ?? "Fecha desconocida",
               year: a.creation_date_earliest ?? null,
               type: a.type ?? "Otros",
               technique: a.technique ?? "Técnica desconocida",
               department: a.department ?? "Departamento desconocido",
               description: toPlainText(a.description || a.wall_description || a.digital_description || a.did_you_know || a.fun_fact || null),
               imageUrl,
          }];
     });
}



// OPERACIONES SOBRE LA LISTA
export function summary(list: Artwork[]): string {
     const artists = new Set(list.map((a) => a.artist));
     const [topType] = Object.entries(countByType(list)).reduce(
          (best, current) => (current[1] > best[1] ? current : best),
          ["", 0] as [string, number],
     );

     const parts = [`${list.length} obras`, `${artists.size} artistas`];
     if (topType) parts.push(`sobre todo ${topType.toLowerCase()}`);
     return parts.join(" · ");
}

export function getTypes(list: Artwork[]): string[] {
     return [...new Set(list.map((a) => a.type))].toSorted((a, b) => a.localeCompare(b, "es"));
}

export function filterByType(list: Artwork[], type: string): Artwork[] {
     return type === "all" ? list: list.filter((a) => a.type === type);
}

export function sortArtworks(list: Artwork[], order: string): Artwork[] {
     if (order === "title"){
          return list.toSorted((a,b) => a.title.localeCompare(b.title, "es"));
     }
     if (order === "date"){
          return list.toSorted((a,b) => (a.year ?? Infinity) - (b.year ?? Infinity))
     }
     return list;
}

export function countByType(list: Artwork[]): Record<string, number>{
     return list.reduce<Record<string, number>>((counts, art) => {
          counts[art.type] = (counts[art.type] ?? 0) + 1;
          return counts;
     }, {});
}