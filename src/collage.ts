import type { Artwork } from "./logic";
import { readStorage, writeStorage } from "./storage";
import { makeDraggable, setTopZ } from "./draggable";

// TIPOS Y CONSTANTES
interface PieceLayout {
     left: number;
     top: number;
     width: number;
     z: number;
}
type Layout = Record<string, PieceLayout>;

const STORAGE_KEY = "collage";
const DEFAULT_WIDTH = 150;



// FUNCIONES QUE USA main.ts
export function renderCollage(board: HTMLElement, artworks: Artwork[]): void {
     if(artworks.length === 0){
          board.replaceChildren(createEmptyMessage());
          return;
     }

     const layout = getLayout();
     setTopZ(Object.values(layout).reduce((max, piece) => Math.max(max, piece.z), 1));
     board.replaceChildren(...artworks.map((art, index) => createPiece(board, art, layout[art.id] ?? defaultLayout(index))));
}

export function saveCollage(board: HTMLElement): void {
     const pieces = [...board.querySelectorAll<HTMLElement>(".piece")];
     const layout: Layout = Object.fromEntries(pieces.map((piece) => [piece.dataset.id ?? "", readLayout(piece)]));
     writeStorage(STORAGE_KEY, layout);
}



// CREAR ELEMENTOS
function createPiece(board: HTMLElement, art: Artwork, layout: PieceLayout): HTMLElement {
     const piece = document.createElement("div");
     piece.className = "piece";
     piece.dataset.id = String(art.id);
     applyLayout(piece, layout);

     const img = document.createElement("img");
     img.addEventListener("load", () => {
          piece.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
     }, { once: true });
     img.src = art.imageUrl;
     img.alt = art.title;
     img.draggable = false;

     piece.append(img);
     makeDraggable(piece, () => saveCollage(board));
     return piece;
}

function createEmptyMessage(): HTMLElement {
     const empty = document.createElement("p");
     empty.className = "collage-empty";
     empty.textContent = "Aún no tienes favoritos. Pulsa 🤍 en algunas obras para crear tu collage.";
     return empty;
}



// POSICIÓN Y TAMAÑO
function defaultLayout(index: number): PieceLayout {
     return {
          left: 40 + (index % 5) * 170,
          top: 40 + Math.floor(index / 5) * 210,
          width: DEFAULT_WIDTH,
          z: 1,
     };
}

function applyLayout(piece: HTMLElement, {left, top, width, z}: PieceLayout): void {
     piece.style.left = `${left}px`;
     piece.style.top = `${top}px`;
     piece.style.width = `${width}px`;
     piece.style.zIndex = String(z);
}

function readLayout(piece: HTMLElement): PieceLayout {
     return {
          left: parseFloat(piece.style.left) || 0,
          top: parseFloat(piece.style.top) || 0,
          width: parseFloat(piece.style.width) || DEFAULT_WIDTH,
          z: Number(piece.style.zIndex) || 1,
     };
}



// LEER LO GUARDADO
function isPieceLayout(value: unknown): value is PieceLayout {
     if (typeof value !== "object" || value === null) return false;
     const p = value as Record<string, unknown>;
     return ["left", "top", "width", "z"].every((key) => typeof p[key] === "number");
}

function getLayout(): Layout {
     const saved = readStorage(STORAGE_KEY);
     const object = typeof saved === "object" && saved !== null ? saved : {};
     const valid = Object.entries(object).filter(
          (entry): entry is [string, PieceLayout] => isPieceLayout(entry[1]),
     );
     return Object.fromEntries(valid);
}