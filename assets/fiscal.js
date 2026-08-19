(function () {
  "use strict";

  var STORAGE_KEY = "radarReciclagemOperacoes";
  var HISTORY_KEY = "radarReciclagemHistorico";
  var CHECKLIST_KEY = "radarReciclagemChecklist";
  var PRICES_KEY = "radarReciclagemPrecos";
  var LOTES_KEY = "radarReciclagemLotes";

  var LIMIT_MEI = 81000;
  var LIMIT_SIMPLES = 4800000;
  var MEI_TAX = 0.06;

  var MATERIAIS = [
    { id: "papelao", nome: "Papelão", icon: "📦", precoRef: 0.45, precoCompra: 0.30 },
    { id: "papel", nome: "Papel branco", icon: "📄", precoRef: 0.55, precoCompra: 0.35 },
    { id: "pet", nome: "PET", icon: "🧴", precoRef: 1.20, precoCompra: 0.85 },
    { id: "pead", nome: "PEAD", icon: "🪣", precoRef: 1.80, precoCompra: 1.20 },
    { id: "pvc", nome: "PVC", icon: "🔧", precoRef: 1.00, precoCompra: 0.65 },
    { id: "aluminio", nome: "Alumínio", icon: "🥫", precoRef: 6.50, precoCompra: 4.80 },
    { id: "ferro", nome: "Ferro / Aço", icon: "🔩", precoRef: 0.45, precoCompra: 0.28 },
    { id: "cobre", nome: "Cobre", icon: "🔌", precoRef: 28.00, precoCompra: 22.00 },
    { id: "vidro", nome: "Vidro", icon: "🫙", precoRef: 0.08, precoCompra: 0.04 },
    { id: "eletronicos", nome: "Eletrônicos", icon: "💻", precoRef: 2.50, precoCompra: 1.50 }
  ];

  var SEGMENTOS = {
    catador: { label: "Catador / Autônomo", porte: "pequeno", cnae: "3811-4/00", dica: "MEI ou Simples — emita recibo/nota na venda" },
    cooperativa: { label: "Cooperativa", porte: "pequeno", cnae: "3811-4/00", dica: "Rateio entre associados + DAS mensal" },
    galpao: { label: "Galpão / Triagem", porte: "medio", cnae: "3832-7/00", dica: "Compra em volume, separa e revende beneficiado" },
    beneficiador: { label: "Beneficiador", porte: "medio", cnae: "3832-7/00", dica: "Fardos padronizados para indústria" },
    industria: { label: "Indústria recicladora", porte: "grande", cnae: "3839-4/01", dica: "Contratos B2B, ICMS e logística reversa" }
  };

  var COMPLIANCE = {
    catador: [
      { req: "Cadastro MEI ou CNPJ", nivel: "obrigatorio", desc: "Formalize para vender com nota/recibo" },
      { req: "Nota fiscal ou recibo na venda", nivel: "obrigatorio", desc: "Comprador pode exigir documento" },
      { req: "MTR", nivel: "recomendado", desc: "Manifesto de Transporte quando transportar resíduos" },
      { req: "Licença ambiental", nivel: "condicional", desc: "Galpão fixo pode exigir alvará municipal" }
    ],
    cooperativa: [
      { req: "CNPJ e estatuto social", nivel: "obrigatorio", desc: "Cooperativa registrada na OCB" },
      { req: "Cadastro de associados", nivel: "obrigatorio", desc: "Controle de rateio e produção" },
      { req: "Licença ambiental (LP/LA)", nivel: "obrigatorio", desc: "Galpão de triagem e armazenamento" },
      { req: "MTR em transportes", nivel: "obrigatorio", desc: "Sistema estadual (FEPAM, CETESB, etc.)" },
      { req: "PGRS / plano de resíduos", nivel: "recomendado", desc: "Exigido por municípios e grandes geradores" }
    ],
    galpao: [
      { req: "Licença ambiental", nivel: "obrigatorio", desc: "Operação de resíduos sólidos" },
      { req: "MTR — Manifesto de Transporte", nivel: "obrigatorio", desc: "Toda carga entrada/saída" },
      { req: "Cadastro no órgão estadual", nivel: "obrigatorio", desc: "Inventário de resíduos" },
      { req: "Alvará de funcionamento", nivel: "obrigatorio", desc: "Prefeitura + bombeiros" },
      { req: "Controle de balança / pesagem", nivel: "obrigatorio", desc: "Rastreabilidade comercial" }
    ],
    beneficiador: [
      { req: "Licença de operação (LO)", nivel: "obrigatorio", desc: "Processamento e beneficiamento" },
      { req: "MTR e rastreabilidade", nivel: "obrigatorio", desc: "Origem e destino documentados" },
      { req: "Certificação de qualidade", nivel: "recomendado", desc: "Umidade, impureza, tipo de fardo" },
      { req: "Contratos B2B", nivel: "recomendado", desc: "Indústria exige padrão e volume" }
    ],
    industria: [
      { req: "Licenciamento ambiental completo", nivel: "obrigatorio", desc: "LP, LI e LO conforme porte" },
      { req: "Logística reversa / PNRS", nivel: "obrigatorio", desc: "Acordos setoriais quando aplicável" },
      { req: "Controle de ICMS interestadual", nivel: "obrigatorio", desc: "Operações entre estados" },
      { req: "Rastreabilidade ESG", nivel: "recomendado", desc: "Relatórios para clientes e investidores" }
    ]
  };

  var MERCADO = {
    catador: [
      { canal: "Galpão local", desc: "Venda rápida, preço médio, exige pesagem", icon: "🏭" },
      { canal: "Atravessador", desc: "Compra na rua, menor burocracia", icon: "🚛" },
      { canal: "Cooperativa", desc: "Melhor preço se associado", icon: "🤝" },
      { canal: "Feira de recicláveis", desc: "Eventos municipais e campanhas", icon: "📅" }
    ],
    cooperativa: [
      { canal: "Indústria recicladora", desc: "Contrato em volume, exige qualidade", icon: "🏢" },
      { canal: "Beneficiador regional", desc: "Intermediário que padroniza fardos", icon: "⚙" },
      { canal: "Exportador / trading", desc: "PET e papel em container", icon: "🚢" },
      { canal: "Prefeitura / licitação", desc: "Coleta seletiva terceirizada", icon: "🏛" }
    ],
    galpao: [
      { canal: "Indústria (B2B)", desc: "Fardos separados por tipo", icon: "🏢" },
      { canal: "Beneficiador", desc: "Material semi-processado", icon: "⚙" },
      { canal: "Outro galpão / rede", desc: "Redistribuição regional", icon: "🔗" },
      { canal: "Marketplace sucata", desc: "Plataformas digitais de recicláveis", icon: "💻" }
    ],
    beneficiador: [
      { canal: "Indústria transformadora", desc: "Contrato longo prazo", icon: "🏭" },
      { canal: "Exportação", desc: "Commodities (PET flake, papel)", icon: "🌎" },
      { canal: "Trading internacional", desc: "Preço indexado em dólar", icon: "💱" }
    ],
    industria: [
      { canal: "Fabricantes finais", desc: "Matéria-prima secundária certificada", icon: "📦" },
      { canal: "Grandes marcas (log. reversa)", desc: "Acordos PNRS setoriais", icon: "♻" },
      { canal: "Governo / licitações", desc: "Embalagens recicladas em compras públicas", icon: "🏛" }
    ]
  };

  var CHECKLIST_BASE = [
    { id: "pesagem", label: "Registrar pesagem de entrada e saída" },
    { id: "nf", label: "Emitir NF-e ou recibo de venda" },
    { id: "mtr", label: "Gerar MTR para transportes (se aplicável)" },
    { id: "das", label: "Pagar DAS / guias fiscais" },
    { id: "qualidade", label: "Separar materiais por tipo e umidade" },
    { id: "estoque", label: "Atualizar estoque de fardos/lotes" },
    { id: "cotacao", label: "Consultar cotação antes de vender" },
    { id: "contador", label: "Enviar movimento ao contador" }
  ];

  var OBRIGACOES = [
    { id: "das", nome: "DAS", desc: "Simples Nacional", dia: 20, tipo: "Federal", icon: "📋" },
    { id: "fgts", nome: "FGTS", desc: "Recolhimento mensal", dia: 7, tipo: "Trabalhista", icon: "👥" },
    { id: "mtr", nome: "MTR", desc: "Manifesto resíduos", dia: 15, tipo: "Ambiental", icon: "♻" },
    { id: "defis", nome: "DEFIS", desc: "Declaração anual", dia: 31, tipo: "Federal", meses: [3], icon: "📁" }
  ];

  var REGIME_LABELS = { mei: "MEI", simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };

  var form, tabela, resumo, planoAcao, listaEmpresas, listaAlertas, alertasResumo;
  var btnExportarPdf, btnWhatsApp, btnSalvarEmpresa, btnNovaEmpresa, btnAddLote, btnAplicarVendas, btnResetPrecos;
  var kpiGrid, chartArea, tableWrap, resultSubtitle, segmentSelect, segmentPills, toast, menuBtn, sidebar;
  var lastResult = null, activeCompanyId = null, currentSegment = "catador", precos = {}, lotes = [];

  function $(id) { return document.getElementById(id); }

  function brl(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v < 10 ? 2 : 0 });
  }

  function brlKg(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "/kg";
  }

  function kg(v) {
    return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " kg";
  }

  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = "toast" + (type ? " " + type : "");
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.add("hidden"); }, 3200);
  }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (e) { return fallback; }
  }

  function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function loadCompanies() { return loadJSON(STORAGE_KEY, []); }
  function saveCompanies(list) { saveJSON(STORAGE_KEY, list); }
  function uid() { return "op_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function initPrecos() {
    var saved = loadJSON(PRICES_KEY, null);
    if (saved) { precos = saved; return; }
    MATERIAIS.forEach(function (m) {
      precos[m.id] = { venda: m.precoRef, compra: m.precoCompra };
    });
    saveJSON(PRICES_KEY, precos);
  }

  function loadLotes() {
    lotes = loadJSON(LOTES_KEY, [{ material: "pet", peso: 500, precoVenda: null, precoCompra: null }]);
  }

  function saveLotes() { saveJSON(LOTES_KEY, lotes); saveJSON(PRICES_KEY, precos); }

  function getFormData() {
    return {
      nome: $("nomeEmpresa").value.trim(),
      segmento: segmentSelect.value,
      faturamento: Number($("faturamento").value || 0),
      folha: Number($("folha").value || 0),
      custos: Number($("custos").value || 0),
      tipoOperacao: $("tipoOperacao").value,
      volumeAnual: Number($("volumeAnual").value || 0)
    };
  }

  function setFormData(data) {
    $("nomeEmpresa").value = data.nome || "";
    setSegment(data.segmento || "catador");
    $("faturamento").value = data.faturamento || "";
    $("folha").value = data.folha || "";
    $("custos").value = data.custos || "";
    $("tipoOperacao").value = data.tipoOperacao || "comercio";
    $("volumeAnual").value = data.volumeAnual || "";
  }

  function setSegment(seg) {
    currentSegment = seg;
    segmentSelect.value = seg;
    segmentPills.querySelectorAll(".pill").forEach(function (p) {
      p.classList.toggle("active", p.dataset.segment === seg);
    });
    document.querySelectorAll(".segment-card").forEach(function (c) {
      c.classList.toggle("active", c.dataset.segment === seg);
    });
    renderCompliance(seg);
    renderMercado(seg);
    renderChecklist();
    renderAlerts(SEGMENTOS[seg].porte, 0);
  }

  function mapOperacaoToSetor(tipo) {
    if (tipo === "industria") return "industria";
    if (tipo === "beneficiamento") return "servicos";
    return "comercio";
  }

  function rateByRegime(regime, setor, faturamento, folhaRatio) {
    var base = {
      simples: { servicos: 0.13, comercio: 0.085, industria: 0.095 },
      presumido: { servicos: 0.155, comercio: 0.135, industria: 0.145 },
      real: { servicos: 0.175, comercio: 0.165, industria: 0.17 }
    };
    var rate = base[regime][setor];
    if (regime === "simples" && folhaRatio > 0.28) rate -= 0.012;
    if (regime === "presumido" && faturamento > 4800000) rate += 0.01;
    return Math.max(0.04, rate);
  }

  function simulate(data) {
    if (data.faturamento <= 0) return null;
    var setor = mapOperacaoToSetor(data.tipoOperacao);
    var folhaRatio = data.folha / data.faturamento;
    var regimes = ["simples", "presumido", "real"].map(function (regime) {
      var aliquota = rateByRegime(regime, setor, data.faturamento, folhaRatio);
      return { regime: regime, aliquota: aliquota, imposto: data.faturamento * aliquota };
    });
    regimes.sort(function (a, b) { return a.imposto - b.imposto; });
    var best = regimes[0];
    var second = regimes[1];

    var receitaMensal = data.faturamento / 12;
    var impostoMensal = best.imposto / 12;
    var margemOp = data.faturamento - data.custos - best.imposto;
    var margemPct = (margemOp / data.faturamento) * 100;

    return {
      input: data,
      regimes: regimes,
      best: best,
      economiaAno: Math.max(0, second.imposto - best.imposto),
      margemLiquida: margemPct,
      reservaMensal: impostoMensal,
      receitaMensal: receitaMensal,
      margemOperacional: margemOp
    };
  }

  function renderMateriais() {
    $("materiaisGrid").innerHTML = MATERIAIS.map(function (m) {
      var p = precos[m.id] || { venda: m.precoRef, compra: m.precoCompra };
      return "<article class='material-card'>" +
        "<div class='material-head'><span class='material-icon'>" + m.icon + "</span><strong>" + m.nome + "</strong></div>" +
        "<div class='material-prices'>" +
          "<label>Compra<input type='number' step='0.01' min='0' data-mat='" + m.id + "' data-tipo='compra' value='" + p.compra + "' /></label>" +
          "<label>Venda<input type='number' step='0.01' min='0' data-mat='" + m.id + "' data-tipo='venda' value='" + p.venda + "' /></label>" +
        "</div>" +
        "<span class='material-spread'>Spread: " + brlKg(p.venda - p.compra) + "</span>" +
      "</article>";
    }).join("");

    $("materiaisGrid").querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        if (!precos[inp.dataset.mat]) precos[inp.dataset.mat] = {};
        precos[inp.dataset.mat][inp.dataset.tipo] = Number(inp.value);
        saveJSON(PRICES_KEY, precos);
        renderMateriais();
        renderLotes();
      });
    });
  }

  function materialOptions(selected) {
    return MATERIAIS.map(function (m) {
      return "<option value='" + m.id + "'" + (m.id === selected ? " selected" : "") + ">" + m.nome + "</option>";
    }).join("");
  }

  function calcLotes() {
    var receita = 0, custo = 0, peso = 0;
    lotes.forEach(function (l) {
      var p = precos[l.material] || {};
      var pv = l.precoVenda != null ? l.precoVenda : (p.venda || 0);
      var pc = l.precoCompra != null ? l.precoCompra : (p.compra || 0);
      receita += l.peso * pv;
      custo += l.peso * pc;
      peso += l.peso;
    });
    return { receita: receita, custo: custo, margem: receita - custo, peso: peso };
  }

  function renderLotes() {
    var container = $("lotesContainer");
    container.innerHTML = lotes.map(function (l, i) {
      var mat = MATERIAIS.find(function (m) { return m.id === l.material; }) || MATERIAIS[0];
      var p = precos[l.material] || { venda: mat.precoRef, compra: mat.precoCompra };
      return "<div class='lote-row' data-idx='" + i + "'>" +
        "<select class='select-modern lote-mat'>" + materialOptions(l.material) + "</select>" +
        "<div class='input-suffix'><input type='number' class='lote-peso' min='0' step='10' value='" + l.peso + "' /><span>kg</span></div>" +
        "<div class='input-prefix compact'><span>R$</span><input type='number' class='lote-venda' step='0.01' value='" + (l.precoVenda != null ? l.precoVenda : p.venda) + "' /></div>" +
        "<div class='input-prefix compact'><span>R$</span><input type='number' class='lote-compra' step='0.01' value='" + (l.precoCompra != null ? l.precoCompra : p.compra) + "' /></div>" +
        "<strong class='lote-total'>" + brl(l.peso * (l.precoVenda != null ? l.precoVenda : p.venda)) + "</strong>" +
        "<button type='button' class='btn-del-lote' data-idx='" + i + "'>&times;</button>" +
      "</div>";
    }).join("");

    if (!lotes.length) {
      container.innerHTML = "<p class='cenario-hint'>Adicione lotes para simular vendas ao mercado.</p>";
    }

    container.querySelectorAll(".lote-row").forEach(function (row) {
      var idx = Number(row.dataset.idx);
      function sync() {
        lotes[idx].material = row.querySelector(".lote-mat").value;
        lotes[idx].peso = Number(row.querySelector(".lote-peso").value || 0);
        lotes[idx].precoVenda = Number(row.querySelector(".lote-venda").value || 0);
        lotes[idx].precoCompra = Number(row.querySelector(".lote-compra").value || 0);
        saveLotes();
        updateVendasResumo();
        row.querySelector(".lote-total").textContent = brl(lotes[idx].peso * lotes[idx].precoVenda);
      }
      row.querySelectorAll("select, input").forEach(function (el) { el.addEventListener("input", sync); el.addEventListener("change", sync); });
    });

    container.querySelectorAll(".btn-del-lote").forEach(function (btn) {
      btn.addEventListener("click", function () {
        lotes.splice(Number(btn.dataset.idx), 1);
        saveLotes();
        renderLotes();
        updateVendasResumo();
      });
    });

    updateVendasResumo();
  }

  function updateVendasResumo() {
    var c = calcLotes();
    $("vrReceita").textContent = brl(c.receita);
    $("vrCusto").textContent = brl(c.custo);
    $("vrMargem").textContent = brl(c.margem);
    $("vrPeso").textContent = kg(c.peso);
  }

  function aplicarVendasAoFiscal() {
    var c = calcLotes();
    if (c.receita <= 0) { showToast("Adicione lotes com peso e preço"); return; }
    var anual = c.receita * 12;
    $("faturamento").value = Math.round(anual);
    $("custos").value = Math.round(c.custo * 12);
    $("volumeAnual").value = Math.round(c.peso * 12);
    showToast("Valores aplicados ao diagnóstico fiscal", "success");
  }

  function renderCompliance(seg) {
    var items = COMPLIANCE[seg] || [];
    var obrig = items.filter(function (i) { return i.nivel === "obrigatorio"; }).length;
    $("complianceStatus").textContent = obrig + " obrigatório(s)";
    $("complianceStatus").className = "status-pill " + (obrig > 2 ? "warn" : "ok");

    $("complianceList").innerHTML = items.map(function (item) {
      var cls = item.nivel === "obrigatorio" ? "obrig" : item.nivel === "recomendado" ? "rec" : "cond";
      return "<article class='compliance-item " + cls + "'>" +
        "<div class='compliance-badge'>" + item.nivel + "</div>" +
        "<div><strong>" + item.req + "</strong><span>" + item.desc + "</span></div>" +
      "</article>";
    }).join("");
  }

  function renderMercado(seg) {
    var canais = MERCADO[seg] || [];
    $("mercadoContent").innerHTML = canais.map(function (c) {
      return "<article class='mercado-card'>" +
        "<span class='mercado-icon'>" + c.icon + "</span>" +
        "<strong>" + c.canal + "</strong>" +
        "<p>" + c.desc + "</p>" +
      "</article>";
    }).join("");
  }

  function renderLimitsInline(result) {
    var el = $("limitesInline");
    if (!result) { el.classList.add("hidden"); return; }
    var fat = result.input.faturamento;
    var meiPct = Math.min(100, (fat / LIMIT_MEI) * 100);
    var simplesPct = Math.min(100, (fat / LIMIT_SIMPLES) * 100);
    el.classList.remove("hidden");
    el.innerHTML =
      "<article class='limit-card'><div class='limit-head'><strong>MEI</strong><span>R$ 81k/ano</span></div>" +
      "<div class='limit-bar-wrap'><div class='limit-bar' style='width:" + meiPct + "%'></div></div>" +
      "<p class='limit-meta'>" + (fat > LIMIT_MEI ? "Acima do MEI — migre para Simples" : pct(meiPct) + " do teto") + "</p></article>" +
      "<article class='limit-card'><div class='limit-head'><strong>Simples</strong><span>R$ 4,8 mi</span></div>" +
      "<div class='limit-bar-wrap'><div class='limit-bar blue' style='width:" + simplesPct + "%'></div></div>" +
      "<p class='limit-meta'>" + pct(simplesPct) + " do teto nacional</p></article>";
  }

  function pct(v) { return v.toFixed(1) + "%"; }

  function buildPlan(seg, bestRegime, economiaAno) {
    var segInfo = SEGMENTOS[seg];
    var base = [
      "Perfil: " + segInfo.label + " — CNAE ref.: " + segInfo.cnae,
      "Regime sugerido: " + REGIME_LABELS[bestRegime] + " (economia est. " + brl(economiaAno) + "/ano)",
      segInfo.dica,
      "Atualize cotações semanalmente com compradores locais",
      "Padronize separação por material para aumentar preço de venda",
      "Emita documento fiscal em toda venda B2B"
    ];
    var extra = {
      catador: ["Cadastre-se como MEI se faturamento ≤ R$ 81k", "Identifique 2–3 galpões com melhor preço/kg"],
      cooperativa: ["Formalize rateio mensal entre associados", "Busque contrato com indústria da região"],
      galpao: ["Instale balança calibrada e registro de lotes", "Negocie frete e MTR com transportadora"],
      beneficiador: ["Invista em prensa/enfardadeira por material", "Certifique umidade e impureza do lote"],
      industria: ["Estruture contrato de fornecimento anual", "Mapeie créditos de ICMS e logística reversa"]
    };
    return base.concat(extra[seg] || []);
  }

  function renderChart(items, best) {
    var max = items[0].imposto;
    chartArea.innerHTML = items.map(function (item) {
      var w = Math.round((item.imposto / max) * 100);
      var isBest = item.regime === best.regime;
      return "<div class='chart-row'><span class='chart-label" + (isBest ? " best" : "") + "'>" + REGIME_LABELS[item.regime] + "</span>" +
        "<div class='chart-bar-wrap'><div class='chart-bar" + (isBest ? " best" : "") + "' style='width:0%' data-w='" + w + "'></div></div>" +
        "<span class='chart-value'>" + brl(item.imposto) + "</span></div>";
    }).join("");
    requestAnimationFrame(function () {
      chartArea.querySelectorAll(".chart-bar").forEach(function (b) { b.style.width = b.dataset.w + "%"; });
    });
  }

  function renderTable(items, best) {
    tabela.innerHTML = items.map(function (item) {
      var cls = item.regime === best.regime ? "best-row" : "";
      return "<tr class='" + cls + "'><td>" + REGIME_LABELS[item.regime] + (cls ? " ★" : "") + "</td>" +
        "<td>" + brl(item.imposto) + "</td><td>" + (item.aliquota * 100).toFixed(2) + "%</td></tr>";
    }).join("");
  }

  function renderKPIs(result, vendasCalc) {
    $("kpiReceita").textContent = brl(vendasCalc ? vendasCalc.receita : result.receitaMensal);
    $("kpiMargem").textContent = result.margemLiquida.toFixed(1) + "%";
    $("kpiRegime").textContent = REGIME_LABELS[result.best.regime];
    $("kpiVolume").textContent = result.input.volumeAnual ? kg(result.input.volumeAnual / 12) : "—";
    kpiGrid.classList.remove("hidden");
  }

  function renderResult(result) {
    if (!result) return;
    lastResult = result;
    btnExportarPdf.disabled = false;
    btnWhatsApp.disabled = false;

    var d = result.input;
    var best = result.best;
    var vendasCalc = calcLotes();

    resumo.className = "result-summary";
    resumo.innerHTML =
      "<div class='company-name'>" + (d.nome || "Sua operação") + " · " + SEGMENTOS[d.segmento].label + "</div>" +
      "<p>Regime <span class='highlight'>" + REGIME_LABELS[best.regime] + "</span> — imposto " +
      "<strong>" + brl(best.imposto) + "/ano</strong>, margem líquida <strong>" + result.margemLiquida.toFixed(1) + "%</strong>. " +
      (d.volumeAnual ? "Volume: <strong>" + kg(d.volumeAnual) + "/ano</strong>." : "") + "</p>";

    resultSubtitle.textContent = "Diagnóstico — " + (d.nome || "operação");
    chartArea.classList.remove("hidden");
    tableWrap.classList.remove("hidden");

    renderKPIs(result, vendasCalc.peso > 0 ? vendasCalc : null);
    renderChart(result.regimes, best);
    renderTable(result.regimes, best);
    renderLimitsInline(result);

    planoAcao.innerHTML = buildPlan(d.segmento, best.regime, result.economiaAno).map(function (item, i) {
      return "<li><span class='step-num'>" + (i + 1) + "</span><span>" + item + "</span></li>";
    }).join("");

    renderAlerts(SEGMENTOS[d.segmento].porte, result.reservaMensal);
    addToHistory(result);
  }

  function nextDueDate(o) {
    var now = new Date(), year = now.getFullYear(), month = now.getMonth();
    if (o.meses) {
      for (var i = 0; i < o.meses.length; i++) {
        var c = new Date(year, o.meses[i] - 1, o.dia);
        if (c >= now) return c;
      }
      return new Date(year + 1, o.meses[0] - 1, o.dia);
    }
    var due = new Date(year, month, o.dia);
    if (due < now) due = new Date(year, month + 1, o.dia);
    return due;
  }

  function daysUntil(date) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var t = new Date(date); t.setHours(0, 0, 0, 0);
    return Math.ceil((t - now) / 86400000);
  }

  function formatDate(date) {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  function renderAlerts(porte, reservaMensal) {
    var filtered = OBRIGACOES.filter(function (o) {
      if (currentSegment === "catador") return ["das", "defis"].indexOf(o.id) >= 0;
      return true;
    });
    var pendentes = 0;
    listaAlertas.innerHTML = filtered.map(function (o) {
      var due = nextDueDate(o);
      var dias = daysUntil(due);
      var cls = "ok", badge = dias + "d";
      if (dias <= 3) { cls = "urgente"; badge = dias === 0 ? "Hoje" : dias + "d"; pendentes++; }
      else if (dias <= 7) { cls = "proximo"; pendentes++; }
      var hint = o.tipo + " · " + formatDate(due);
      if (o.id === "das" && reservaMensal) hint += " · Reserve " + brl(reservaMensal);
      return "<article class='alert-card " + cls + "'><div class='alert-icon'>" + o.icon + "</div>" +
        "<div class='alert-body'><strong>" + o.nome + "</strong><span>" + o.desc + " · " + hint + "</span></div>" +
        "<span class='alert-badge " + cls + "'>" + badge + "</span></article>";
    }).join("");
    alertasResumo.textContent = pendentes ? pendentes + " alerta(s)" : "Em dia";
    alertasResumo.className = "status-pill " + (pendentes ? "warn" : "ok");
  }

  function renderChecklist() {
    var state = loadJSON(CHECKLIST_KEY, {});
    var monthKey = new Date().getFullYear() + "-" + (new Date().getMonth() + 1);
    var monthState = state[monthKey] || {};
    var done = 0;
    $("checklistItems").innerHTML = CHECKLIST_BASE.map(function (item) {
      var checked = !!monthState[item.id];
      if (checked) done++;
      return "<li class='check-item" + (checked ? " done" : "") + "'><label>" +
        "<input type='checkbox' data-id='" + item.id + "' " + (checked ? "checked" : "") + " />" +
        "<span>" + item.label + "</span></label></li>";
    }).join("");
    $("checklistProgress").textContent = done + "/" + CHECKLIST_BASE.length;
    $("checklistProgress").className = "status-pill " + (done === CHECKLIST_BASE.length ? "ok" : "warn");
    $("checklistItems").querySelectorAll("input").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var st = loadJSON(CHECKLIST_KEY, {});
        if (!st[monthKey]) st[monthKey] = {};
        st[monthKey][cb.dataset.id] = cb.checked;
        saveJSON(CHECKLIST_KEY, st);
        renderChecklist();
      });
    });
  }

  function addToHistory(result) {
    var list = loadJSON(HISTORY_KEY, []);
    list.unshift({
      id: "h_" + Date.now(), ts: Date.now(), nome: result.input.nome || "—",
      segmento: result.input.segmento, faturamento: result.input.faturamento,
      regime: result.best.regime, imposto: result.best.imposto
    });
    saveJSON(HISTORY_KEY, list.slice(0, 20));
  }

  function renderCompanies() {
    var list = loadCompanies();
    listaEmpresas.classList.toggle("empty", !list.length);
    if (!list.length) { listaEmpresas.innerHTML = ""; return; }
    listaEmpresas.innerHTML = list.map(function (emp) {
      return "<div class='company-chip" + (emp.id === activeCompanyId ? " active" : "") + "' data-id='" + emp.id + "'>" +
        "<span>" + emp.nome + "</span><button type='button' class='del' data-del='" + emp.id + "'>&times;</button></div>";
    }).join("");
    listaEmpresas.querySelectorAll(".company-chip").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        if (e.target.classList.contains("del")) return;
        var emp = loadCompanies().find(function (c) { return c.id === chip.dataset.id; });
        if (emp) {
          activeCompanyId = emp.id;
          setFormData(emp);
          setSegment(emp.segmento || "catador");
          renderCompanies();
          emp.lastResult ? renderResult(emp.lastResult) : form.dispatchEvent(new Event("submit"));
        }
      });
    });
    listaEmpresas.querySelectorAll(".del").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        saveCompanies(loadCompanies().filter(function (c) { return c.id !== btn.dataset.del; }));
        if (activeCompanyId === btn.dataset.del) activeCompanyId = null;
        renderCompanies();
        showToast("Operação removida");
      });
    });
  }

  function saveCurrentCompany(result) {
    var data = getFormData();
    if (!data.nome) { showToast("Informe o nome da operação"); return; }
    var list = loadCompanies();
    var existing = list.find(function (c) { return c.id === activeCompanyId; });
    if (existing) Object.assign(existing, data, { lastResult: result, updatedAt: Date.now() });
    else {
      var emp = Object.assign({ id: uid(), createdAt: Date.now() }, data, { lastResult: result });
      list.push(emp);
      activeCompanyId = emp.id;
    }
    saveCompanies(list);
    renderCompanies();
    showToast("Operação salva!", "success");
  }

  function resetResults() {
    lastResult = null;
    btnExportarPdf.disabled = true;
    btnWhatsApp.disabled = true;
    kpiGrid.classList.add("hidden");
    chartArea.classList.add("hidden");
    tableWrap.classList.add("hidden");
    $("limitesInline").classList.add("hidden");
    resumo.className = "result-empty";
    resumo.innerHTML = "<div class='empty-icon'>♻</div><p>Use a calculadora ou preencha o diagnóstico fiscal.</p>";
    resultSubtitle.textContent = "Aguardando simulação…";
    tabela.innerHTML = "";
  }

  function shareWhatsApp() {
    if (!lastResult) return;
    var d = lastResult.input;
    var c = calcLotes();
    var text = "♻ *Radar Reciclagem*\n\n" +
      "Operação: " + (d.nome || "—") + "\n" +
      "Perfil: " + SEGMENTOS[d.segmento].label + "\n" +
      "Faturamento anual: " + brl(d.faturamento) + "\n" +
      "Regime: " + REGIME_LABELS[lastResult.best.regime] + "\n" +
      "Imposto est.: " + brl(lastResult.best.imposto) + "/ano\n" +
      (c.peso > 0 ? "Lote simulado: " + kg(c.peso) + " · Receita " + brl(c.receita) + "\n" : "") +
      "\n_Simulação educacional — valide com contador._";
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  function exportPdf() {
    if (!lastResult) return;
    var d = lastResult.input, best = lastResult.best;
    var plano = buildPlan(d.segmento, best.regime, lastResult.economiaAno);
    var win = window.open("", "_blank");
    if (!win) { showToast("Permita pop-ups"); return; }
    var rows = lastResult.regimes.map(function (r) {
      return "<tr><td>" + REGIME_LABELS[r.regime] + "</td><td>" + brl(r.imposto) + "</td><td>" + (r.aliquota * 100).toFixed(2) + "%</td></tr>";
    }).join("");
    win.document.write("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Radar Reciclagem — " + d.nome + "</title>" +
      "<style>body{font-family:system-ui,sans-serif;padding:40px;max-width:720px;margin:0 auto}" +
      "h1{border-bottom:2px solid #22c55e;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px}</style></head><body>" +
      "<h1>Radar Reciclagem</h1><p>" + SEGMENTOS[d.segmento].label + " · " + new Date().toLocaleString("pt-BR") + "</p>" +
      "<p><strong>" + d.nome + "</strong><br>Faturamento: " + brl(d.faturamento) + "<br>Regime: " + REGIME_LABELS[best.regime] + "</p>" +
      "<table><tr><th>Regime</th><th>Imposto</th><th>Alíquota</th></tr>" + rows + "</table>" +
      "<h2>Plano 30 dias</h2><ol>" + plano.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol></body></html>");
    win.document.close();
    setTimeout(function () { win.print(); }, 400);
  }

  function resetPrecos() {
    MATERIAIS.forEach(function (m) { precos[m.id] = { venda: m.precoRef, compra: m.precoCompra }; });
    saveJSON(PRICES_KEY, precos);
    renderMateriais();
    renderLotes();
    showToast("Cotações restauradas");
  }

  function initDOM() {
    form = $("simulador");
    tabela = $("tabelaRegimes");
    resumo = $("resumo");
    planoAcao = $("planoAcao");
    listaEmpresas = $("listaEmpresas");
    listaAlertas = $("listaAlertas");
    alertasResumo = $("alertasResumo");
    btnExportarPdf = $("btnExportarPdf");
    btnWhatsApp = $("btnWhatsApp");
    btnSalvarEmpresa = $("btnSalvarEmpresa");
    btnNovaEmpresa = $("btnNovaEmpresa");
    btnAddLote = $("btnAddLote");
    btnAplicarVendas = $("btnAplicarVendas");
    btnResetPrecos = $("btnResetPrecos");
    kpiGrid = $("kpiGrid");
    chartArea = $("chartArea");
    tableWrap = $("tableWrap");
    resultSubtitle = $("resultSubtitle");
    segmentSelect = $("segmento");
    segmentPills = $("segmentPills");
    toast = $("toast");
    menuBtn = $("menuBtn");
    sidebar = $("sidebar");
  }

  function bindEvents() {
    segmentPills.querySelectorAll(".pill").forEach(function (pill) {
      pill.addEventListener("click", function () { setSegment(pill.dataset.segment); });
    });

    document.querySelectorAll(".segment-card").forEach(function (card) {
      card.addEventListener("click", function () {
        setSegment(card.dataset.segment);
        $("segmentPills").querySelector("[data-segment='" + card.dataset.segment + "']").click();
      });
    });

    document.querySelectorAll(".nav-item").forEach(function (link) {
      link.addEventListener("click", function () {
        document.querySelectorAll(".nav-item").forEach(function (l) { l.classList.remove("active"); });
        link.classList.add("active");
        sidebar.classList.remove("open");
      });
    });

    if (menuBtn) menuBtn.addEventListener("click", function () { sidebar.classList.toggle("open"); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var result = simulate(getFormData());
      if (!result) { showToast("Informe o faturamento"); return; }
      renderResult(result);
      showToast("Simulação concluída!", "success");
    });

    btnSalvarEmpresa.addEventListener("click", function () {
      var result = simulate(getFormData());
      if (!result) { showToast("Simule antes de salvar"); return; }
      renderResult(result);
      saveCurrentCompany(result);
    });

    btnNovaEmpresa.addEventListener("click", function () {
      activeCompanyId = null;
      setFormData({ nome: "", segmento: "catador", faturamento: 0, folha: 0, custos: 0, tipoOperacao: "comercio", volumeAnual: 0 });
      setSegment("catador");
      resetResults();
      renderCompanies();
      showToast("Nova operação");
    });

    btnExportarPdf.addEventListener("click", exportPdf);
    btnWhatsApp.addEventListener("click", shareWhatsApp);
    btnAddLote.addEventListener("click", function () {
      lotes.push({ material: "pet", peso: 100, precoVenda: null, precoCompra: null });
      saveLotes();
      renderLotes();
    });
    btnAplicarVendas.addEventListener("click", aplicarVendasAoFiscal);
    btnResetPrecos.addEventListener("click", resetPrecos);
  }

  function init() {
    initDOM();
    initPrecos();
    loadLotes();
    bindEvents();
    renderMateriais();
    renderLotes();
    setSegment("catador");
    renderCompanies();
    renderChecklist();
    planoAcao.innerHTML = buildPlan("catador", "simples", 0).map(function (item, i) {
      return "<li><span class='step-num'>" + (i + 1) + "</span><span>" + item + "</span></li>";
    }).join("");
  }

  init();
})();
