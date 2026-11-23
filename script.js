(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const escenas = {
    sobre: $('#escena-sobre'),
    cofre: $('#escena-cofre'),
    carta: $('#escena-carta'),
    flor: $('#escena-flor'),
  };

  const sobre = $('#sobre');
  const cofre = $('#cofre');
  const mensajeCofre = $('#mensaje-cofre');
  const btnAbrirSobre = $('#abrir-sobre');
  const btnAbrirCofre = $('#abrir-cofre');
  const btnSeguir = $('#seguir-carta');
  const florFinal = $('#flor-final');
  const pistaFlor = $('#pista-flor');
  const reveladoFlor = $('#revelado-flor');
  const aviso = $('#aviso');

  const pocaAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ms = (normal, reducido = 0) => (pocaAnimacion.matches ? reducido : normal);

  let actual = 'sobre';
  let cambiando = false;
  const temporizadores = new Set();

  function despues(tiempo, fn) {
    const id = setTimeout(() => {
      temporizadores.delete(id);
      fn();
    }, tiempo);
    temporizadores.add(id);
    return id;
  }

  function cancelarTemporizadores() {
    temporizadores.forEach(clearTimeout);
    temporizadores.clear();
  }

  function anunciar(texto) {
    aviso.textContent = '';
    // Pequeña pausa para que los lectores de pantalla noten el cambio.
    setTimeout(() => { aviso.textContent = texto; }, 60);
  }

  /* ---------- Cambio de escena ---------- */

  function irA(nombre, alCambiar) {
    if (cambiando || nombre === actual) return;
    cambiando = true;

    const sale = escenas[actual];
    const entra = escenas[nombre];
    sale.classList.remove('is-activa');

    setTimeout(() => {
      sale.hidden = true;
      if (alCambiar) alCambiar();
      entra.hidden = false;
      window.scrollTo(0, 0);
      void entra.offsetWidth; // fuerza el reflow para que la entrada se anime
      entra.classList.add('is-activa');
      actual = nombre;
      cambiando = false;

      const foco = $('[data-foco]', entra);
      if (foco) foco.focus({ preventScroll: true });
    }, ms(300));
  }

  /* ---------- Escena 1: sobre ---------- */

  function abrirSobre() {
    if (cambiando || sobre.classList.contains('is-abierto')) return;
    sobre.classList.add('is-abierto');
    escenas.sobre.classList.add('is-abriendo');
    btnAbrirSobre.disabled = true;
    despues(ms(2100, 300), () => irA('cofre'));
  }

  btnAbrirSobre.addEventListener('click', abrirSobre);
  sobre.addEventListener('click', abrirSobre);

  /* ---------- Escena 2: cofre ---------- */

  function abrirCofre() {
    if (cambiando || cofre.classList.contains('is-abierto')) return;
    cofre.classList.add('is-abierto');
    btnAbrirCofre.disabled = true;

    despues(ms(700, 0), () => {
      mensajeCofre.classList.add('is-visible');
      anunciar(mensajeCofre.textContent);
    });

    // «Seguir» aparece enseguida, pero no tan pronto como para pulsarlo con un doble toque.
    despues(ms(1100, 500), () => {
      const teniaFoco = document.activeElement === btnAbrirCofre || document.activeElement === document.body;
      btnAbrirCofre.hidden = true;
      btnSeguir.hidden = false;
      if (teniaFoco) btnSeguir.focus({ preventScroll: true });
    });
  }

  btnAbrirCofre.addEventListener('click', abrirCofre);
  cofre.addEventListener('click', abrirCofre);
  btnSeguir.addEventListener('click', () => irA('carta'));

  /* ---------- Escena 3: carta ---------- */

  $('#ir-flor').addEventListener('click', () => irA('flor'));

  /* ---------- Escena 4: última flor ---------- */

  function soltarCorazones() {
    if (pocaAnimacion.matches) return;
    const cantidad = 9;
    for (let i = 0; i < cantidad; i++) {
      const c = document.createElement('img');
      c.className = 'chispa';
      c.alt = '';
      c.src = i % 3 === 2 ? './assets/flowers/destello.svg' : './assets/corazon.svg';
      const angulo = (-150 + (120 / (cantidad - 1)) * i + (Math.random() * 16 - 8)) * (Math.PI / 180);
      const distancia = 5.5 + Math.random() * 3.5;
      c.style.setProperty('--cx', (Math.cos(angulo) * distancia).toFixed(2) + 'rem');
      c.style.setProperty('--cy', (Math.sin(angulo) * distancia).toFixed(2) + 'rem');
      c.style.setProperty('--ct', (i * 35) + 'ms');
      c.style.setProperty('--cs', (0.9 + Math.random() * 0.7).toFixed(2) + 'rem');
      c.addEventListener('animationend', () => c.remove());
      florFinal.appendChild(c);
    }
  }

  function tocarFlor() {
    if (cambiando) return;
    if (!florFinal.classList.contains('is-florecida')) {
      florFinal.classList.add('is-florecida');
      florFinal.setAttribute('aria-label', 'La florecita, ya abierta');
      pistaFlor.classList.add('is-oculta');
      reveladoFlor.classList.add('is-visible');
      anunciar(reveladoFlor.textContent.replace(/\s+/g, ' ').trim());
    }
    if (florFinal.querySelectorAll('.chispa').length < 18) soltarCorazones();
  }

  florFinal.addEventListener('click', tocarFlor);

  $('#releer').addEventListener('click', () => irA('carta'));

  /* ---------- Reinicio limpio, sin recargar ---------- */

  function reiniciar() {
    if (cambiando) return;
    cancelarTemporizadores();
    irA('sobre', () => {
      sobre.classList.remove('is-abierto');
      escenas.sobre.classList.remove('is-abriendo');
      btnAbrirSobre.disabled = false;

      cofre.classList.remove('is-abierto');
      mensajeCofre.classList.remove('is-visible');
      btnAbrirCofre.disabled = false;
      btnAbrirCofre.hidden = false;
      btnSeguir.hidden = true;

      florFinal.classList.remove('is-florecida');
      florFinal.setAttribute('aria-label', 'Tocar la florecita');
      florFinal.querySelectorAll('.chispa').forEach((c) => c.remove());
      pistaFlor.classList.remove('is-oculta');
      reveladoFlor.classList.remove('is-visible');
      aviso.textContent = '';
    });
  }

  $('#reiniciar').addEventListener('click', reiniciar);

  /* ---------- Florecitas que caen despacio de fondo ---------- */

  (function sembrarAmbiente() {
    const capa = $('#ambiente');
    const tonos = ['rosa', 'rosa', 'crema', 'salvia', 'oro'];
    const cantidad = window.innerWidth < 600 ? 11 : 18;
    for (let i = 0; i < cantidad; i++) {
      const p = document.createElement('span');
      p.className = 'petalo petalo-' + tonos[i % tonos.length];
      const duracion = 16 + Math.random() * 16;
      p.style.setProperty('--px', (Math.random() * 100).toFixed(1) + '%');
      p.style.setProperty('--py', (Math.random() * 100).toFixed(1) + '%');
      p.style.setProperty('--pu', (2 + Math.round(Math.random() * 2)) + 'px');
      p.style.setProperty('--pt', duracion.toFixed(1) + 's');
      p.style.setProperty('--pd', (-Math.random() * duracion).toFixed(1) + 's');
      p.style.setProperty('--pv', (Math.random() * 14 - 7).toFixed(1) + 'vw');
      capa.appendChild(p);
    }
  })();
})();
