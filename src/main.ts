import "./style.css";
import { searchArtworks, PAGE_SIZE } from "./api";
import type { SearchResult } from "./api";
import { toArtworks, summary, getTypes, filterByType, sortArtworks } from "./logic";
import type { Artwork } from "./logic";
import { showLoading, showError, showWarning, showArtworks, fillTypeOptions, setMoreButton, renderRooms } from "./render";
import type { Room } from "./render";
import { getFavorites, toggleFavorite } from "./favorites";
import { renderCollage, saveCollage } from "./collage";
import { getElement } from "./dom";
import { initTheme } from "./theme";

// CONFIGURACIÓN
const DEFAULT_QUERY = "monet";

const ROOMS: Room[] = [
     { label: "Monet", query: "monet"},
     { label: "Impresionismo", query: "impressionism" },
     { label: "Paisajes", query: "landscape" },
     { label: "Retratos", query: "portrait" },
     { label: "Japón", query: "japan" },
     { label: "Egipto", query: "egypt" },
];



// ELEMENTOS DE LA PÁGINA
const form = getElement<HTMLFormElement>("#form");
const input = getElement<HTMLInputElement>("#input");
const sortSelect = getElement<HTMLSelectElement>("#sort");
const typeSelect = getElement<HTMLSelectElement>("#type");
const moreButton = getElement<HTMLButtonElement>("#more");
const collectionButton = getElement<HTMLButtonElement>("#collection");
const collageDialog = getElement<HTMLDialogElement>("#collage");
const openCollageButton = getElement<HTMLButtonElement>("#open-collage");
const closeCollageButton = getElement<HTMLButtonElement>("#close-collage");
const board = getElement<HTMLDivElement>("#collage #board");



// ESTADO DE LA APP
const estado = {
     query: "",
     artworks: [] as Artwork[],
     nextSkip: 0,
     viewingCollection: false,
     fromCache: false,
}
let controller = new AbortController();
let moreController = new AbortController();



// PINTAR
function update(): void {
     const filtered = filterByType(estado.artworks, typeSelect.value);
     const sorted = sortArtworks(filtered, sortSelect.value);
     const favoriteIds = new Set(getFavorites().map((a) => a.id));
     const emptyText = estado.viewingCollection ? "Tu colección está vacía. Pulsa 🤍 en una obra para guardarla." : "No hay obras para esta búsqueda.";
     const text = summary(sorted) + (estado.fromCache && !estado.viewingCollection ? " · desde caché": "");
     showArtworks(sorted, text, favoriteIds, onToggleFavorite, emptyText);
}

function resetView(query: string, collection: boolean): void {
     estado.viewingCollection = collection;
     estado.query = query;
     estado.artworks = [];
     estado.nextSkip = 0;
     typeSelect.value = "all";
     estado.fromCache = false;
     controller.abort();
     moreController.abort();
     renderRooms(ROOMS, query, pickRoom);
     setMoreButton("hidden");
}

function addResults(result: SearchResult): void {
     estado.fromCache = result.fromCache;
     estado.nextSkip += result.artworks.length;
     const existingIds = new Set(estado.artworks.map((a) => a.id));
     const newArtworks = toArtworks(result.artworks).filter((a) => !existingIds.has(a.id));
     estado.artworks = [...estado.artworks, ...newArtworks];
     fillTypeOptions(getTypes(estado.artworks));
     update();
     setMoreButton(result.artworks.length < PAGE_SIZE ? "hidden" : "ready");
}



// BÚSQUEDA
async function load(query: string): Promise<void> {
     resetView(query, false);
     showLoading();

     try{
          controller = new AbortController();
          const result = await searchArtworks(query, 0, controller.signal);
          if (query !== estado.query) return;
          addResults(result);
     } catch (error){
          if(isAbortError(error) || query !== estado.query) return;
          showError(errorMessage(error), () => load(query));
     }
}

async function loadMore(): Promise<void> {
     const query = estado.query;
     setMoreButton("loading");

     try {
          moreController.abort();
          moreController = new AbortController();
          const result = await searchArtworks(query, estado.nextSkip, moreController.signal);
          if (query !== estado.query) return;
          addResults(result);
     } catch (error) {
          if(isAbortError(error) || query !== estado.query) return;
          showWarning(`No se pudieron cargar más obras. ${errorMessage(error)}`);
          setMoreButton("ready");
     }
}

function onSubmit(evento: SubmitEvent): void {
     evento.preventDefault();
     const query = input.value.trim();

     if (query === ""){
          showWarning("Escribe algo para buscar.");
          input.focus();
          return;
     }
     load(query);
}

function pickRoom(query: string): void {
     input.value = query;
     load(query);
}



// FAVORITOS
function showCollection(): void {
     resetView("", true);
     input.value = "";
     estado.artworks = getFavorites();
     fillTypeOptions(getTypes(estado.artworks));
     update();     
}

function onToggleFavorite(art: Artwork): void {
     toggleFavorite(art);
     if (estado.viewingCollection) estado.artworks = getFavorites();
     update();
}



// COLLAGE
function openCollage(): void {
     renderCollage(board, getFavorites());
     collageDialog.showModal();
}



// UTILIDADES
function errorMessage(error: unknown): string {
     return error instanceof Error ? error.message: "Error desconocido";
}

function isAbortError(error: unknown): boolean {
     return error instanceof DOMException && error.name === "AbortError";
}



// EVENTOS
form.addEventListener("submit", onSubmit);
sortSelect.addEventListener("change", update);
typeSelect.addEventListener("change", update);
moreButton.addEventListener("click", loadMore);
collectionButton.addEventListener("click", showCollection);
openCollageButton.addEventListener("click", openCollage);
closeCollageButton.addEventListener("click", () => collageDialog.close())
collageDialog.addEventListener("close", () => saveCollage(board));

initTheme(getElement<HTMLButtonElement>("#theme"));
load(DEFAULT_QUERY);