(function () {
  "use strict";

  var STORAGE_KEY = "radarTributarioEmpresas";

  var form = document.getElementById("simulador");
  var tabela = document.getElementById("tabelaRegimes");
  var resumo = document.getElementById("resumo");
  var planoAcao = document.getElementById("planoAcao");
  var listaEmpresas = document.getElementById("listaEmpresas");
  var listaAlertas = document.getElementById("listaAlertas");
  var alertasResumo = document.getElementById("alertasResumo");
  var btnExportarPdf = document.getElementById("btnExportarPdf");
  var btnSalvarEmpresa = document.getElementById("btnSalvarEmpresa");
  var btnNovaEmpresa = document.getElementById("btnNovaEmpresa");
  var kpiGrid = document.getElementById("kpiGrid");
  var chartArea = document.getElementById("chartArea");
  var tableWrap = document.getElementById("tableWrap");
  var resultSubtitle = document.getElementById("resultSubtitle");
  var porteSelect = document.getElementById("porte");
  var portePills = document.getElementById("portePills");
  var toast = document.getElementById("toast");
  var menuBtn = document.getElementById("menuBtn");
  var sidebar = document.getElementById("sidebar");

  var REGIME_LABELS = {
    simples: "Simples Nacional",
    presumido: "Lucro Presumido",
    real: "Lucro Real"
  };

  var OBRIGACOES = [
    { id: "das", nome: "DAS", desc: "Simples Nacional", dia: 20, tipo: "Federal", icon: "📋" },
    { id: "fgts", nome: "FGTS", desc: "Recolhimento mensal", dia: 7, tipo: "Trabalhista", icon: "👥" },
    { id: "iss", nome: "ISS", desc: "Imposto municipal", dia: 10, tipo: "Municipal", icon: "🏛" },
    { id: "irpj", nome: "IRPJ", desc: "Trimestral", dia: 30, tipo: "Federal", meses: [3, 6, 9, 12], icon: "📊" },
    { id: "defis", nome: "DEFIS", desc: "Declaração anual", dia: 31, tipo: "Federal", meses: [3], icon: "📁" }
  ];

  var lastResult = null;
  var activeCompanyId = null;

  function brl(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = "toast" + (type ? " " + type : "");
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.add("hidden"); }, 3200);
  }

  function loadCompanies() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function saveCompanies(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function uid() {
    return "emp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getFormData() {
    return {
      nome: document.getElementById("nomeEmpresa").value.trim(),
      porte: porteSelect.value,
      faturamento: Number(document.getElementById("faturamento").value || 0),
      folha: Number(document.getElementById("folha").value || 0),
      custos: Number(document.getElementById("custos").value || 0),
      setor: document.getElementById("setor").value
    };
  }

  function setFormData(data) {
    document.getElementById("nomeEmpresa").value = data.nome || "";
    setPorte(data.porte || "pequeno");
    document.getElementById("faturamento").value = data.faturamento || "";
    document.getElementById("folha").value = data.folha || "";
    document.getElementById("custos").value = data.custos || "";
    document.getElementById("setor").value = data.setor || "servicos";
  }

  function setPorte(porte) {
    porteSelect.value = porte;
    portePills.querySelectorAll(".pill").forEach(function (p) {
      p.classList.toggle("active", p.dataset.porte === porte);
    });
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
    if (regime === "real" && folhaRatio > 0.35) rate -= 0.008;
    return Math.max(0.04, rate);
  }

  function simulate(data) {
    if (data.faturamento <= 0) return null;
    var folhaRatio = data.folha / data.faturamento;
    var regimes = ["simples", "presumido", "real"].map(function (regime) {
      var aliquota = rateByRegime(regime, data.setor, data.faturamento, folhaRatio);
      return { regime: regime, aliquota: aliquota, imposto: data.faturamento * aliquota };
    });
    regimes.sort(function (a, b) { return a.imposto - b.imposto; });
    var best = regimes[0];
    var second = regimes[1];
    return {
      input: data,
      regimes: regimes,
      best: best,
      economiaAno: Math.max(0, second.imposto - best.imposto),
      margemLiquida: ((data.faturamento - data.custos - best.imposto) / data.faturamento) * 100,
      reservaMensal: best.imposto / 12
    };
  }

  function buildPlan(porte, bestRegime, economiaAno) {
    var common = [
      "Feche DRE e fluxo de caixa dos últimos 12 meses para validar os números.",
      "Configure alertas de vencimento com 7 dias de antecedência.",
      "Revise CNAE, enquadramento e créditos com seu contador."
    ];
    var byPorte = {
      pequeno: [
        "Crie conta-reserva separada para tributos.",
        "Acompanhe limite de faturamento mensal.",
        "Padronize emissão de nota e retenções."
      ],
      medio: [
        "Compare impacto de pró-labore mês a mês.",
        "Reprecifique serviços com margem baixa.",
        "Consolide obrigações em calendário único."
      ],
      grande: [
        "Consolide apuração por unidade/filial.",
        "Audite créditos e retenções mensalmente.",
        "Simule expansão antes de contratar."
      ]
    };
    return ["Regime ideal: " + REGIME_LABELS[bestRegime] + " — economia de " + brl(economiaAno) + "/ano"]
      .concat(common, byPorte[porte]);
  }

  function renderChart(items, best) {
    var max = items[0].imposto;
    chartArea.innerHTML = items.map(function (item) {
      var pct = Math.round((item.imposto / max) * 100);
      var isBest = item.regime === best.regime;
      return "<div class='chart-row'>" +
        "<span class='chart-label" + (isBest ? " best" : "") + "'>" + REGIME_LABELS[item.regime] + "</span>" +
        "<div class='chart-bar-wrap'><div class='chart-bar" + (isBest ? " best" : "") + "' style='width:0%' data-w='" + pct + "'></div></div>" +
        "<span class='chart-value'>" + brl(item.imposto) + "</span>" +
      "</div>";
    }).join("");
    requestAnimationFrame(function () {
      chartArea.querySelectorAll(".chart-bar").forEach(function (bar) {
        bar.style.width = bar.dataset.w + "%";
      });
    });
  }

  function renderTable(items, best) {
    tabela.innerHTML = items.map(function (item) {
      var cls = item.regime === best.regime ? "best-row" : "";
      return "<tr class='" + cls + "'>" +
        "<td>" + REGIME_LABELS[item.regime] + (cls ? " ★" : "") + "</td>" +
        "<td>" + brl(item.imposto) + "</td>" +
        "<td>" + (item.aliquota * 100).toFixed(2) + "%</td>" +
      "</tr>";
    }).join("");
  }

  function renderKPIs(result) {
    document.getElementById("kpiRegime").textContent = REGIME_LABELS[result.best.regime];
    document.getElementById("kpiImposto").textContent = brl(result.best.imposto);
    document.getElementById("kpiEconomia").textContent = brl(result.economiaAno);
    document.getElementById("kpiReserva").textContent = brl(result.reservaMensal);
    kpiGrid.classList.remove("hidden");
  }

  function setTierActive(porte) {
    ["pequeno", "medio", "grande"].forEach(function (p) {
      var el = document.getElementById("tier-" + p);
      if (el) el.classList.toggle("active", p === porte);
    });
  }

  function renderResult(result) {
    if (!result) return;
    lastResult = result;
    btnExportarPdf.disabled = false;

    var d = result.input;
    var best = result.best;

    resumo.className = "result-summary";
    resumo.innerHTML =
      "<div class='company-name'>" + (d.nome || "Sua empresa") + "</div>" +
      "<p>Recomendamos <span class='highlight'>" + REGIME_LABELS[best.regime] + "</span> — " +
      "imposto estimado de <strong>" + brl(best.imposto) + "/ano</strong>, " +
      "margem líquida de <strong>" + result.margemLiquida.toFixed(1) + "%</strong>.</p>";

    resultSubtitle.textContent = "Comparativo para " + d.nome;
    chartArea.classList.remove("hidden");
    tableWrap.classList.remove("hidden");

    renderKPIs(result);
    renderChart(result.regimes, best);
    renderTable(result.regimes, best);
    setTierActive(d.porte);

    planoAcao.innerHTML = buildPlan(d.porte, best.regime, result.economiaAno).map(function (item, i) {
      return "<li><span class='step-num'>" + (i + 1) + "</span><span>" + item + "</span></li>";
    }).join("");

    renderAlerts(d.porte, result.reservaMensal);
  }

  function nextDueDate(o) {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
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
      if (porte === "pequeno") return ["das", "fgts", "iss"].indexOf(o.id) >= 0;
      return true;
    });
    var pendentes = 0;

    listaAlertas.innerHTML = filtered.map(function (o) {
      var due = nextDueDate(o);
      var dias = daysUntil(due);
      var cls = "ok";
      var badge = dias + "d";
      if (dias <= 3) { cls = "urgente"; badge = dias === 0 ? "Hoje" : dias + "d"; pendentes++; }
      else if (dias <= 7) { cls = "proximo"; pendentes++; }
      var hint = o.tipo + " · " + formatDate(due);
      if (o.id === "das" && reservaMensal) hint += " · Reserve " + brl(reservaMensal);
      return "<article class='alert-card " + cls + "'>" +
        "<div class='alert-icon'>" + o.icon + "</div>" +
        "<div class='alert-body'><strong>" + o.nome + "</strong><span>" + o.desc + " · " + hint + "</span></div>" +
        "<span class='alert-badge " + cls + "'>" + badge + "</span>" +
      "</article>";
    }).join("");

    alertasResumo.textContent = pendentes ? pendentes + " alerta(s)" : "Em dia";
    alertasResumo.className = "status-pill " + (pendentes ? "warn" : "ok");
  }

  function renderCompanies() {
    var list = loadCompanies();
    listaEmpresas.classList.toggle("empty", !list.length);
    if (!list.length) { listaEmpresas.innerHTML = ""; return; }

    listaEmpresas.innerHTML = list.map(function (emp) {
      return "<div class='company-chip" + (emp.id === activeCompanyId ? " active" : "") + "' data-id='" + emp.id + "'>" +
        "<span>" + emp.nome + "</span>" +
        "<button type='button' class='del' data-del='" + emp.id + "'>&times;</button></div>";
    }).join("");

    listaEmpresas.querySelectorAll(".company-chip").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        if (e.target.classList.contains("del")) return;
        var emp = loadCompanies().find(function (c) { return c.id === chip.dataset.id; });
        if (emp) {
          activeCompanyId = emp.id;
          setFormData(emp);
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
        showToast("Empresa removida");
      });
    });
  }

  function saveCurrentCompany(result) {
    var data = getFormData();
    if (!data.nome) { showToast("Informe o nome da empresa"); return; }
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
    showToast("Empresa salva!", "success");
  }

  function resetResults() {
    lastResult = null;
    btnExportarPdf.disabled = true;
    kpiGrid.classList.add("hidden");
    chartArea.classList.add("hidden");
    tableWrap.classList.add("hidden");
    resumo.className = "result-empty";
    resumo.innerHTML = "<div class='empty-icon'>📊</div><p>Preencha o formulário e clique em <strong>Simular estratégia</strong>.</p>";
    resultSubtitle.textContent = "Aguardando simulação…";
    tabela.innerHTML = "";
  }

  function exportPdf() {
    if (!lastResult) return;
    var d = lastResult.input;
    var best = lastResult.best;
    var plano = buildPlan(d.porte, best.regime, lastResult.economiaAno);
    var win = window.open("", "_blank");
    if (!win) { showToast("Permita pop-ups para exportar"); return; }
    var rows = lastResult.regimes.map(function (r) {
      return "<tr><td>" + REGIME_LABELS[r.regime] + "</td><td>" + brl(r.imposto) + "</td><td>" + (r.aliquota * 100).toFixed(2) + "%</td></tr>";
    }).join("");
    win.document.write("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Relatório — " + d.nome + "</title>" +
      "<style>body{font-family:system-ui,sans-serif;padding:40px;max-width:720px;margin:0 auto;color:#111}" +
      "h1{font-size:1.3rem;border-bottom:2px solid #22c55e;padding-bottom:8px}" +
      "table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}" +
      ".box{background:#f9fafb;padding:16px;border-radius:8px;margin:12px 0;line-height:1.7}</style></head><body>" +
      "<h1>Radar Tributário — Relatório</h1><p>" + new Date().toLocaleString("pt-BR") + "</p>" +
      "<div class='box'><strong>" + d.nome + "</strong><br>Faturamento: " + brl(d.faturamento) + "<br>Regime: " + REGIME_LABELS[best.regime] + "<br>Imposto: " + brl(best.imposto) + "/ano</div>" +
      "<table><tr><th>Regime</th><th>Imposto</th><th>Alíquota</th></tr>" + rows + "</table>" +
      "<h2>Plano 30 dias</h2><ol>" + plano.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol>" +
      "<p style='color:#888;font-size:0.8rem;margin-top:32px'>Simulação educacional. Consulte seu contador.</p></body></html>");
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 400);
  }

  portePills.querySelectorAll(".pill").forEach(function (pill) {
    pill.addEventListener("click", function () { setPorte(pill.dataset.porte); });
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
    setFormData({ nome: "", porte: "pequeno", faturamento: 0, folha: 0, custos: 0, setor: "servicos" });
    resetResults();
    renderCompanies();
    renderAlerts("pequeno", 0);
    document.getElementById("nomeEmpresa").focus();
    showToast("Nova empresa");
  });

  btnExportarPdf.addEventListener("click", exportPdf);

  renderCompanies();
  renderAlerts("pequeno", 0);
})();
