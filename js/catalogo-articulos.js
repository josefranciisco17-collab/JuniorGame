"use strict";

/*
  JUNIOR GAME — CATÁLOGO DE ARTÍCULOS V2

  - Todos los precios comienzan en 0 diamantes.
  - No incluye la categoría Coronas.
  - Sombreros y lentes utilizan imágenes PNG.
  - Las demás categorías conservan emojis temporalmente.
  - Las posiciones están preparadas para usuarioropa.png.
*/

/* =========================================
   POSICIONES BASE DEL MANIQUÍ
========================================= */

const POSICION_SOMBRERO = Object.freeze({
  top: "17%",
  left: "50%",
  width: "28%",
  transform: "translateX(-50%)"
});

const POSICION_LENTES = Object.freeze({
  top: "30%",
  left: "50%",
  width: "24%",
  transform: "translateX(-50%)"
});

const POSICION_PANUELO = Object.freeze({
  top: "43%",
  left: "50%",
  width: "31%",
  transform: "translateX(-50%)"
});

const POSICION_MOCHILA = Object.freeze({
  top: "43%",
  left: "18%",
  width: "29%",
  transform: "rotate(-8deg)"
});

const POSICION_ZAPATOS = Object.freeze({
  bottom: "2%",
  left: "50%",
  width: "42%",
  transform: "translateX(-50%)"
});

/*
  Crea una copia de la posición base y permite ajustes particulares.
  Ejemplo: posicionSombrero({ top: "15%", width: "31%" })
*/
function posicionSombrero(ajuste = {}) {
  return { ...POSICION_SOMBRERO, ...ajuste };
}

function posicionLentes(ajuste = {}) {
  return { ...POSICION_LENTES, ...ajuste };
}

/* =========================================
   CATEGORÍAS DE ROPA
========================================= */

export const CATEGORIAS_ROPA = [
  {
    id: "sombreros",
    nombre: "Sombreros",
    icono: "🎩",
    accion: "Probar sombrero"
  },
  {
    id: "lentes",
    nombre: "Lentes",
    icono: "👓",
    accion: "Probar lentes"
  },
  {
    id: "panuelos",
    nombre: "Pañuelos",
    icono: "🧣",
    accion: "Probar pañuelo"
  },
  {
    id: "mochilas",
    nombre: "Mochilas",
    icono: "🎒",
    accion: "Probar mochila"
  },
  {
    id: "zapatos",
    nombre: "Zapatos",
    icono: "👟",
    accion: "Probar zapatos"
  }
];

/* =========================================
   CATÁLOGO COMPLETO
========================================= */

export const ARTICULOS = [
  /* -----------------------------------------
     SOMBREROS
  ----------------------------------------- */
  {
    id: "sombrero-cazador",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Sombrero Cazador",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_cazador.png",
    precio: 0,
    rareza: "Común",
    posicion: posicionSombrero()
  },
  {
    id: "sombrero-rojo",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Gorra Roja",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_rojo.png",
    precio: 0,
    rareza: "Común",
    posicion: posicionSombrero({
      top: "18%",
      width: "27%"
    })
  },
  {
    id: "sombrero-emo",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Sombrero Emo",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_emo.png",
    precio: 0,
    rareza: "Épico",
    posicion: posicionSombrero({
      top: "15%",
      width: "30%"
    })
  },
  {
    id: "sombrero-gotico",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Sombrero Gótico",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_gotico.png",
    precio: 0,
    rareza: "Épico",
    posicion: posicionSombrero({
      top: "15%",
      width: "30%"
    })
  },
  {
    id: "sombrero-floral",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Sombrero Floral",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_floral.png",
    precio: 0,
    rareza: "Raro",
    posicion: posicionSombrero({
      top: "16%",
      width: "32%"
    })
  },
  {
    id: "sombrero-rosa",
    tipo: "ropa",
    categoria: "sombreros",
    nombre: "Sombrero Rosa",
    imagen: "Fondos-JuniorGame/articulos/sombreros/sombrero_rosa.png",
    precio: 0,
    rareza: "Raro",
    posicion: posicionSombrero({
      top: "16%",
      width: "33%"
    })
  },

  /* -----------------------------------------
     LENTES
  ----------------------------------------- */
  {
    id: "lentes-redondos",
    tipo: "ropa",
    categoria: "lentes",
    nombre: "Lentes Redondos",
    imagen: "Fondos-JuniorGame/articulos/lentes/lentes_redondos.png",
    precio: 0,
    rareza: "Común",
    posicion: posicionLentes({
      top: "30%",
      width: "23%"
    })
  },
  {
    id: "lentes-goticos",
    tipo: "ropa",
    categoria: "lentes",
    nombre: "Lentes Góticos",
    imagen: "Fondos-JuniorGame/articulos/lentes/lentes_goticos.png",
    precio: 0,
    rareza: "Raro",
    posicion: posicionLentes({
      top: "30%",
      width: "25%"
    })
  },
  {
    id: "lentes-arcoiris",
    tipo: "ropa",
    categoria: "lentes",
    nombre: "Lentes Arcoíris",
    imagen: "Fondos-JuniorGame/articulos/lentes/lentes_arcoiris.png",
    precio: 0,
    rareza: "Épico",
    posicion: posicionLentes({
      top: "30%",
      width: "26%"
    })
  },

  /* -----------------------------------------
     PAÑUELOS — EMOJIS TEMPORALES
  ----------------------------------------- */
  {
    id: "panuelo-rojo",
    tipo: "ropa",
    categoria: "panuelos",
    nombre: "Pañuelo Rojo",
    icono: "🧣",
    precio: 0,
    rareza: "Común",
    posicion: { ...POSICION_PANUELO }
  },
  {
    id: "panuelo-azul",
    tipo: "ropa",
    categoria: "panuelos",
    nombre: "Pañuelo Azul",
    icono: "🧣",
    precio: 0,
    rareza: "Común",
    posicion: { ...POSICION_PANUELO }
  },

  /* -----------------------------------------
     MOCHILAS — EMOJIS TEMPORALES
  ----------------------------------------- */
  {
    id: "mochila-escolar",
    tipo: "ropa",
    categoria: "mochilas",
    nombre: "Mochila Escolar",
    icono: "🎒",
    precio: 0,
    rareza: "Común",
    posicion: { ...POSICION_MOCHILA }
  },
  {
    id: "mochila-aventura",
    tipo: "ropa",
    categoria: "mochilas",
    nombre: "Mochila Aventurera",
    icono: "🎒",
    precio: 0,
    rareza: "Raro",
    posicion: {
      ...POSICION_MOCHILA,
      width: "30%"
    }
  },

  /* -----------------------------------------
     ZAPATOS — EMOJIS TEMPORALES
  ----------------------------------------- */
  {
    id: "tenis-deportivos",
    tipo: "ropa",
    categoria: "zapatos",
    nombre: "Tenis Deportivos",
    icono: "👟",
    precio: 0,
    rareza: "Común",
    posicion: { ...POSICION_ZAPATOS }
  },
  {
    id: "botas-vaqueras",
    tipo: "ropa",
    categoria: "zapatos",
    nombre: "Botas Vaqueras",
    icono: "🥾",
    precio: 0,
    rareza: "Raro",
    posicion: { ...POSICION_ZAPATOS }
  },

  /* -----------------------------------------
     SKINS
  ----------------------------------------- */
  {
    id: "skin-marron",
    tipo: "skin",
    categoria: "skins",
    nombre: "Pelaje Marrón",
    icono: "🐕",
    precio: 0,
    rareza: "Común",
    filtro: "none"
  },
  {
    id: "skin-gris",
    tipo: "skin",
    categoria: "skins",
    nombre: "Pelaje Gris",
    icono: "🐺",
    precio: 0,
    rareza: "Raro",
    filtro: "grayscale(1) brightness(.9)"
  },
  {
    id: "skin-dorado",
    tipo: "skin",
    categoria: "skins",
    nombre: "Pelaje Dorado",
    icono: "✨",
    precio: 0,
    rareza: "Legendario",
    filtro: "sepia(.8) saturate(1.8) hue-rotate(350deg) brightness(1.12)"
  },
  {
    id: "skin-nieve",
    tipo: "skin",
    categoria: "skins",
    nombre: "Pelaje Nieve",
    icono: "❄️",
    precio: 0,
    rareza: "Épico",
    filtro: "grayscale(.7) brightness(1.35) contrast(.85)"
  },

  /* -----------------------------------------
     PODERES
  ----------------------------------------- */
  {
    id: "poder-escudo",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Escudo Canino",
    icono: "🛡️",
    precio: 0,
    rareza: "Común",
    duracion: 20,
    descripcion: "Protege al perro de un impacto durante la partida."
  },
  {
    id: "poder-iman",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Imán de Huesos",
    icono: "🧲",
    precio: 0,
    rareza: "Raro",
    duracion: 30,
    descripcion: "Atrae automáticamente los huesos cercanos."
  },
  {
    id: "poder-salto",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Súper Salto",
    icono: "🦘",
    precio: 0,
    rareza: "Común",
    duracion: 25,
    descripcion: "Permite saltar más alto durante unos segundos."
  },
  {
    id: "poder-lento",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Tiempo Lento",
    icono: "⏳",
    precio: 0,
    rareza: "Épico",
    duracion: 15,
    descripcion: "Reduce temporalmente la velocidad del escenario."
  },
  {
    id: "poder-fragmentos",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Detector de Fragmentos",
    icono: "💠",
    precio: 0,
    rareza: "Legendario",
    duracion: 40,
    descripcion: "Aumenta la posibilidad de encontrar fragmentos de diamante."
  },
  {
    id: "poder-fantasma",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Modo Fantasma",
    icono: "👻",
    precio: 0,
    rareza: "Épico",
    duracion: 20,
    descripcion: "Permite atravesar obstáculos sin perder vidas."
  },
  {
    id: "poder-frenesi",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Frenesí Canino",
    icono: "🔥",
    precio: 0,
    rareza: "Legendario",
    duracion: 15,
    descripcion: "Destruye obstáculos automáticamente durante el efecto."
  },
  {
    id: "poder-precision",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Precisión",
    icono: "🎯",
    precio: 0,
    rareza: "Raro",
    duracion: 30,
    descripcion: "Amplía el área para atrapar objetos especiales."
  },
  {
    id: "poder-vida",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Corazón Extra",
    icono: "❤️",
    precio: 0,
    rareza: "Raro",
    duracion: 0,
    descripcion: "Entrega una vida adicional para la siguiente partida."
  },
  {
    id: "poder-suerte",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Suerte Legendaria",
    icono: "🌈",
    precio: 0,
    rareza: "Mítico",
    duracion: 20,
    descripcion: "Aumenta temporalmente la aparición de objetos raros."
  },
  {
    id: "poder-doble",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Huesos Dobles",
    icono: "✖️2",
    precio: 0,
    rareza: "Épico",
    duracion: 30,
    descripcion: "Cada hueso atrapado cuenta como dos."
  },
  {
    id: "poder-velocidad",
    tipo: "poder",
    categoria: "poderes",
    nombre: "Impulso",
    icono: "⚡",
    precio: 0,
    rareza: "Raro",
    duracion: 20,
    descripcion: "Aumenta la velocidad y el ritmo de la partida."
  }
];

/* =========================================
   FUNCIONES AUXILIARES
========================================= */

export function obtenerArticulo(id) {
  return ARTICULOS.find((articulo) => articulo.id === id) || null;
}
