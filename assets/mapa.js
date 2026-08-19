(function () {
  "use strict";

  var LOCATIONS = {
    /* ── AETHON ── */
    "setor-i": {
      world: "aethon",
      type: "setor",
      tag: "Setor I · Norte",
      title: "Setor I-Norte",
      sub: "Concordia Heliárquica",
      body: [
        "Região mais próxima do Sol Imóvel. Aqui ficam as torres de amplificação solar — armas geográficas capazes de derreter gelo nocturno a quilômetros de distância.",
        "Foi aqui que Solenne das Torres executou a Queima do Setor I-Norte: 3 km de gelo evaporados numa única noite. O calor ainda marca o solo."
      ],
      meta: { governante: "Concordia Heliárquica", perigo: "Radiação extrema", status: "Sob controle militar" }
    },
    "concordia": {
      world: "aethon",
      type: "cidade",
      tag: "Capital · Setor I",
      title: "Concordia",
      sub: "Sede da Concordia Heliárquica",
      body: [
        "Capital heliárquica da Faixa. Cidade-fortaleza construída em espiral ao redor das torres solares. Soldados patrulham cada anel.",
        "Ordem de captura viva contra Vesna foi emitida daqui. É de Concordia que partem as ordens que definem quem vive e quem vira Resíduo."
      ],
      meta: { população: "~40.000 limiares", setor: "I", função: "Capital militar e política" }
    },
    "mensura": {
      world: "aethon",
      type: "cidade",
      tag: "Setor II",
      title: "Ménsura",
      sub: "Cidade dos Cartógrafos",
      body: [
        "Única cidade dedicada inteiramente à medição da Faixa do Crepúsculo. Os Cartógrafos registram cada encolhimento — e sabem, antes de todos, quando um setor vai desaparecer.",
        "Vesna carrega o Medidor, bastão de cartografia roubado de Ménsura. Os Cartógrafos a caçam por isso."
      ],
      meta: { população: "~8.000", setor: "II", função: "Cartografia e previsão de colapso" }
    },
    "veu": {
      world: "aethon",
      type: "cidade",
      tag: "Setor III",
      title: "O Véu",
      sub: "Fortaleza da Ordem do Véu Perpétuo",
      body: [
        "Monastério-fortaleza onde habita o Vigia do Véu. Ninguém fora da Ordem conhece seu rosto — nem se ainda existe um rosto sob a máscara.",
        "O ar ao redor da fortaleza se curva em direção ao corpo do Vigia. O silêncio dele pesa mais do que qualquer conjuração já registrada."
      ],
      meta: { população: "~200 ordens", setor: "III", função: "Represa de gradiente acumulado" }
    },
    "porto-gradiente": {
      world: "aethon",
      type: "cidade",
      tag: "Setor IV",
      title: "Porto Gradiente",
      sub: "Entre o crepúsculo e a noite",
      body: [
        "Último grande porto comercial antes dos setores mais instáveis. Mercadores trocam Resíduos, mapas e memórias — tudo tem preço na Faixa.",
        "Último lugar onde Vesna descansou antes de entrar no Setor V. Três léguas separavam o porto do colapso."
      ],
      meta: { população: "~15.000", setor: "IV", função: "Comércio e rotas de fuga" }
    },
    "setor-v": {
      world: "aethon",
      type: "setor",
      tag: "Setor V · Colapsando",
      title: "Setor V",
      sub: "Onde o Capítulo 01 acontece",
      body: [
        "Setor mais instável da Faixa. Resíduos de criança repetem loops de sete passos há ciclos inteiros. A Concordia emitiu ordem de evacuação — poucos obedeceram.",
        "Vesna atravessa o Setor V quando vê o Sol se mover pela primeira vez. Se o setor desaparecer, levará esse segredo consigo."
      ],
      meta: { população: "Em evacuação", setor: "V", status: "Colapsando" }
    },
    "keth-v": {
      world: "aethon",
      type: "cidade",
      tag: "Setor V · Ruínas",
      title: "Ruínas de Keth-V",
      sub: "Cidade fantasma",
      body: [
        "Antiga capital do Setor V, abandonada quando os Cartógrafos previram o colapso. Casas ainda de pé, mas sem habitantes — só Resíduos presos em loop.",
        "Soldados da Concordia patrulham as ruas buscando Vesna. Ela sabe: o setor desaparecerá antes que a captura seja concluída."
      ],
      meta: { população: "0 (Resíduos apenas)", setor: "V", status: "Abandonada" }
    },

    /* ── TERRAS EXTERNAS ── */
    "kriston": {
      world: "externo",
      type: "cidade",
      tag: "Klis-Gany · Clã Callardian's",
      title: "Kriston",
      sub: "Cidade natal de Nazura",
      body: [
        "Cidade do clã Kenny em Klis-Gany. Nazura Eidhame nasceu aqui — registrado como Kenny para esconder a herança Eidhame e a Neo da Obscuridade.",
        "Aos sete anos, Kriston foi invadida na guerra contra o Reino de Lake Crystal. Hiromi, mãe de Nazura, morreu na sala onde ele se escondia debaixo da cama."
      ],
      meta: { região: "Klis-Gany", evento: "Guerra de Lake Crystal", personagem: "Nazura Eidhame" }
    },
    "lake-crystal": {
      world: "externo",
      type: "cidade",
      tag: "Reino",
      title: "Lake Crystal",
      sub: "Reino invasor",
      body: [
        "Reino que invadiu Kriston durante a guerra que marcou a infância de Nazura. Suas tropas deixaram a cidade em ruínas e famílias despedaçadas.",
        "A vingança pela morte de Hiromi é o motor que leva Nazura a fugir do refúgio aos doze anos — e a herdar a katana Ilamia."
      ],
      meta: { relação: "Inimigo de Kriston", evento: "Invasão", impacto: "Origem da vingança de Nazura" }
    },
    "bellum": {
      world: "externo",
      type: "cidade",
      tag: "Reino Bellum",
      title: "Bellum",
      sub: "Clã dos Assassinos das Sombras",
      body: [
        "Reino ancestral do clã Eidhame — os Assassinos das Sombras. Hirashi, pai de Nazura, veio daqui antes de se esconder em Kriston.",
        "O velho conto \"Domador das Trevas, o Bestiário Obscuro\" nasceu em Bellum — e profetiza uma Neo da Obscuridade que Nazura carrega."
      ],
      meta: { clã: "Eidhame", tradição: "Assassinos das Sombras", personagem: "Hirashi Eidhame" }
    },
    "resistencia": {
      world: "externo",
      type: "cidade",
      tag: "Floresta além das muralhas",
      title: "Resistência 01",
      sub: "Refúgio · Pilar 01",
      body: [
        "Esconderijo na floresta além das muralhas de Kriston. Pai e filho escaparam para cá após a invasão. Com o tempo, tornou-se base da Resistência 01.",
        "Nazura lidera o Pilar 01. Kiota e Lion — seus melhores amigos — estão aqui. É de onde ele parte para buscar vingança, e para onde tenta voltar."
      ],
      meta: { líder: "Nazura Eidhame", aliados: "Kiota, Lion", função: "Base da Resistência" }
    },
    "uriel-territorio": {
      world: "externo",
      type: "região",
      tag: "Norte · Terras Viking",
      title: "Terras de Fogo",
      sub: "Origem de Uriel, o Braço de Ferro",
      body: [
        "Região gelada do norte onde clãs viking forjam braços mecânicos e pactuam com chamas antigas. Uriel nasceu aqui — 1,79m de guerreiro com braço de ferro.",
        "A invocação da Fênix é rito destas terras. Quando Uriel encontra Nazura no campo rachado, dois mundos de luto colidem."
      ],
      meta: { personagem: "Uriel, o Braço de Ferro", poder: "Fogo · Fênix", clima: "Gelo e vulcões" }
    }
  };

  var currentWorld = "aethon";
  var activeId = null;

  var tabs = document.querySelectorAll(".tab");
  var maps = document.querySelectorAll(".map-view");
  var infoPanel = document.getElementById("info-panel");
  var cityCards = document.querySelectorAll(".city-card");

  function showLocation(id) {
    var loc = LOCATIONS[id];
    if (!loc) return;

    activeId = id;

    document.querySelectorAll(".region, .city-dot").forEach(function (el) {
      el.classList.toggle("active", el.dataset.id === id);
    });

    cityCards.forEach(function (card) {
      card.classList.toggle("active", card.dataset.id === id);
    });

    infoPanel.classList.remove("empty");
    infoPanel.querySelector(".info-tag").textContent = loc.tag;
    infoPanel.querySelector(".info-title").textContent = loc.title;
    infoPanel.querySelector(".info-sub").textContent = loc.sub;

    var bodyEl = infoPanel.querySelector(".info-body");
    bodyEl.innerHTML = loc.body.map(function (p) {
      return "<p>" + p + "</p>";
    }).join("");

    var metaEl = infoPanel.querySelector(".info-meta");
    metaEl.innerHTML = Object.keys(loc.meta).map(function (key) {
      return "<dt>" + key + "</dt><dd>" + loc.meta[key] + "</dd>";
    }).join("");

    if (window.innerWidth < 900) {
      infoPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function switchWorld(world) {
    currentWorld = world;
    activeId = null;

    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.world === world);
    });

    maps.forEach(function (map) {
      map.hidden = map.dataset.world !== world;
    });

    cityCards.forEach(function (card) {
      card.hidden = card.dataset.world !== world;
      card.classList.remove("active");
    });

    document.querySelectorAll(".region, .city-dot").forEach(function (el) {
      el.classList.remove("active");
    });

    infoPanel.classList.add("empty");
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchWorld(tab.dataset.world);
    });
  });

  document.querySelectorAll("[data-id]").forEach(function (el) {
    if (el.classList.contains("city-card")) return;
    el.addEventListener("click", function () {
      showLocation(el.dataset.id);
    });
  });

  cityCards.forEach(function (card) {
    card.addEventListener("click", function () {
      if (card.dataset.world !== currentWorld) {
        switchWorld(card.dataset.world);
      }
      showLocation(card.dataset.id);
    });
  });

  switchWorld("aethon");
})();
