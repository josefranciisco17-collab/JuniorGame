"use strict";

/*
  Todos los precios comienzan en 0 diamantes.
  Después solo cambia la propiedad precio.

  Para usar imágenes PNG reales, agrega `imagen` con una ruta como:
  imagen: "Fondos-JuniorGame/articulos/sombreros/vaquero.png"
*/

export const CATEGORIAS_ROPA = [
  { id: "sombreros", nombre: "Sombreros", icono: "🎩", accion: "Probar sombrero" },
  { id: "lentes", nombre: "Lentes", icono: "👓", accion: "Probar lentes" },
  { id: "panuelos", nombre: "Pañuelos", icono: "🧣", accion: "Probar pañuelo" },
  { id: "coronas", nombre: "Coronas", icono: "👑", accion: "Probar corona" },
  { id: "mochilas", nombre: "Mochilas", icono: "🎒", accion: "Probar mochila" },
  { id: "zapatos", nombre: "Zapatos", icono: "👟", accion: "Probar zapatos" }
];

export const ARTICULOS = [
  { id: "sombrero-vaquero", tipo: "ropa", categoria: "sombreros", nombre: "Sombrero Vaquero",imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_cazador.png", precio: 0, rareza: "Común", posicion: { top: "3%", left: "50%", width: "38%", transform: "translateX(-50%)" } },
  { id: "gorra-roja", tipo: "ropa", categoria: "sombreros", nombre: "Gorra Roja",imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_rojo.png", precio: 0, rareza: "Común", posicion: { top: "4%", left: "50%", width: "34%", transform: "translateX(-50%)" } },
  { id: "sombrero-fiesta", tipo: "ropa", categoria: "sombreros", nombre: "Sombrero de Fiesta",imagen: "Fondos-JuniorGame/articulos/sombreros/corona_real.png", precio: 0, rareza: "Raro", posicion: { top: "2%", left: "50%", width: "35%", transform: "translateX(-50%)" } },

  { id: "lentes-negros", tipo: "ropa", categoria: "lentes", nombre: "Lentes Negros", icono: "🕶️", precio: 0, rareza: "Común", posicion: { top: "22%", left: "50%", width: "31%", transform: "translateX(-50%)" } },
  { id: "lentes-gamer", tipo: "ropa", categoria: "lentes", nombre: "Lentes Gamer", icono: "🥽", precio: 0, rareza: "Raro", posicion: { top: "21%", left: "50%", width: "32%", transform: "translateX(-50%)" } },

  { id: "panuelo-rojo", tipo: "ropa", categoria: "panuelos", nombre: "Pañuelo Rojo", icono: "🧣", precio: 0, rareza: "Común", posicion: { top: "38%", left: "50%", width: "31%", transform: "translateX(-50%)" } },
  { id: "panuelo-azul", tipo: "ropa", categoria: "panuelos", nombre: "Pañuelo Azul", icono: "🧣", precio: 0, rareza: "Común", posicion: { top: "38%", left: "50%", width: "31%", transform: "translateX(-50%)" } },

  { id: "corona-real", tipo: "ropa", categoria: "coronas", nombre: "Corona Real", icono: "👑", precio: 0, rareza: "Legendario", posicion: { top: "0%", left: "50%", width: "31%", transform: "translateX(-50%)" } },
  { id: "corona-flores", tipo: "ropa", categoria: "coronas", nombre: "Corona de Flores", icono: "🌸", precio: 0, rareza: "Épico", posicion: { top: "3%", left: "50%", width: "31%", transform: "translateX(-50%)" } },

  { id: "mochila-escolar", tipo: "ropa", categoria: "mochilas", nombre: "Mochila Escolar", icono: "🎒", precio: 0, rareza: "Común", posicion: { top: "43%", left: "18%", width: "28%", transform: "rotate(-8deg)" } },
  { id: "mochila-aventura", tipo: "ropa", categoria: "mochilas", nombre: "Mochila Aventurera", icono: "🎒", precio: 0, rareza: "Raro", posicion: { top: "43%", left: "18%", width: "30%", transform: "rotate(-8deg)" } },

  { id: "tenis-deportivos", tipo: "ropa", categoria: "zapatos", nombre: "Tenis Deportivos", icono: "👟", precio: 0, rareza: "Común", posicion: { bottom: "2%", left: "50%", width: "41%", transform: "translateX(-50%)" } },
  { id: "botas-vaqueras", tipo: "ropa", categoria: "zapatos", nombre: "Botas Vaqueras", icono: "🥾", precio: 0, rareza: "Raro", posicion: { bottom: "2%", left: "50%", width: "42%", transform: "translateX(-50%)" } },

  { id: "skin-marron", tipo: "skin", categoria: "skins", nombre: "Pelaje Marrón", icono: "🐕", precio: 0, rareza: "Común", filtro: "none" },
  { id: "skin-gris", tipo: "skin", categoria: "skins", nombre: "Pelaje Gris", icono: "🐺", precio: 0, rareza: "Raro", filtro: "grayscale(1) brightness(.9)" },
  { id: "skin-dorado", tipo: "skin", categoria: "skins", nombre: "Pelaje Dorado", icono: "✨", precio: 0, rareza: "Legendario", filtro: "sepia(.8) saturate(1.8) hue-rotate(350deg) brightness(1.12)" },
  { id: "skin-nieve", tipo: "skin", categoria: "skins", nombre: "Pelaje Nieve", icono: "❄️", precio: 0, rareza: "Épico", filtro: "grayscale(.7) brightness(1.35) contrast(.85)" },

  { id: "poder-escudo", tipo: "poder", categoria: "poderes", nombre: "Escudo Canino", icono: "🛡️", precio: 0, rareza: "Común", duracion: 20, descripcion: "Protege al perro de un impacto durante la partida." },
  { id: "poder-iman", tipo: "poder", categoria: "poderes", nombre: "Imán de Huesos", icono: "🧲", precio: 0, rareza: "Raro", duracion: 30, descripcion: "Atrae automáticamente los huesos cercanos." },
  { id: "poder-salto", tipo: "poder", categoria: "poderes", nombre: "Súper Salto", icono: "🦘", precio: 0, rareza: "Común", duracion: 25, descripcion: "Permite saltar más alto durante unos segundos." },
  { id: "poder-lento", tipo: "poder", categoria: "poderes", nombre: "Tiempo Lento", icono: "⏳", precio: 0, rareza: "Épico", duracion: 15, descripcion: "Reduce temporalmente la velocidad del escenario." },
  { id: "poder-fragmentos", tipo: "poder", categoria: "poderes", nombre: "Detector de Fragmentos", icono: "💠", precio: 0, rareza: "Legendario", duracion: 40, descripcion: "Aumenta la posibilidad de encontrar fragmentos de diamante." },
  { id: "poder-fantasma", tipo: "poder", categoria: "poderes", nombre: "Modo Fantasma", icono: "👻", precio: 0, rareza: "Épico", duracion: 20, descripcion: "Permite atravesar obstáculos sin perder vidas." },
  { id: "poder-frenesi", tipo: "poder", categoria: "poderes", nombre: "Frenesí Canino", icono: "🔥", precio: 0, rareza: "Legendario", duracion: 15, descripcion: "Destruye obstáculos automáticamente durante el efecto." },
  { id: "poder-precision", tipo: "poder", categoria: "poderes", nombre: "Precisión", icono: "🎯", precio: 0, rareza: "Raro", duracion: 30, descripcion: "Amplía el área para atrapar objetos especiales." },
  { id: "poder-vida", tipo: "poder", categoria: "poderes", nombre: "Corazón Extra", icono: "❤️", precio: 0, rareza: "Raro", duracion: 0, descripcion: "Entrega una vida adicional para la siguiente partida." },
  { id: "poder-suerte", tipo: "poder", categoria: "poderes", nombre: "Suerte Legendaria", icono: "🌈", precio: 0, rareza: "Mítico", duracion: 20, descripcion: "Aumenta temporalmente la aparición de objetos raros." },
  { id: "poder-doble", tipo: "poder", categoria: "poderes", nombre: "Huesos Dobles", icono: "✖️2", precio: 0, rareza: "Épico", duracion: 30, descripcion: "Cada hueso atrapado cuenta como dos." },
  { id: "poder-velocidad", tipo: "poder", categoria: "poderes", nombre: "Impulso", icono: "⚡", precio: 0, rareza: "Raro", duracion: 20, descripcion: "Aumenta la velocidad y el ritmo de la partida." }
];

export function obtenerArticulo(id) {
  return ARTICULOS.find((articulo) => articulo.id === id) || null;
}
