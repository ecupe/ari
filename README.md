# Ari ♡

Una cartita interactiva: un sobre, un cofre con flores, una carta y una última florecita.

Hecha con HTML, CSS y JavaScript, sin dependencias ni paso de compilación. El 3D es CSS puro.

## Verla en local

Sirve la carpeta con cualquier servidor estático y abre `index.html`.

## Estructura

```text
index.html          contenido y texto de la carta
style.css           estilos, animaciones y 3D
script.js           cambio de escenas e interacciones
assets/cofre/       caras del cofre
assets/maceta/      caras de la maceta
assets/flowers/     flores
assets/stickers/    estampitas de la carta
assets/fonts/       tipografías y sus licencias
```

## Cambiar las estampitas

Las estampitas de la carta usan las imágenes `estampa-ellie.jpg`, `estampa-ellie-rosa.jpg` y `estampa-leon.jpg` de `assets/stickers/`.
Para poner otras imágenes:

1. Guarda la imagen en `assets/stickers/` (PNG, JPG o WebP; con unos 300 px de ancho basta).
2. En `index.html`, busca los comentarios `Sticker` y cambia el `src` de la imagen que está justo debajo.
3. Si la imagen es una foto o ilustración que debe llenar el sello, añade la clase `estampa-foto` a su `<figure>`.

El texto bajo cada estampita está en su `<figcaption>`.

## Tipografías

Pixelify Sans y Mali, ambas con licencia SIL Open Font License 1.1 (ver `assets/fonts/`).
