(function () {
  "use strict";

  var STORAGE_KEY = "radarTributarioEmpresas";
  var ALERTS_KEY = "radarTributarioAlertas";

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

  var lastResult = null;
  var activeCompanyId = null;

  var OBRIGACOES = [
    { id: "das", nome: "DAS (Simples Nacional)", dia: 20, tipo: "Federal" },
    { id: "fgts", nome: "FGTS — recolhimento", dia: 7, tipo: "Trabalhista" },
    { id: "iss", nome: "ISS municipal", dia: 10, tipo: "Municipal" },
    { id: "irpj", nome: "IRPJ trimestral", dia: 30, tipo: "Federal", meses: [3, 6, 9, 12] },
    { id: "defis", nome: "DEFIS anual", dia: 31, tipo: "Federal", meses: [3] }
  ];

  function brl(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function loadCompanies() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
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
      porte: document.getElementById("porte").value,
      faturamento: Number(document.getElementById("faturamento").value || 0),
      folha: Number(document.getElementById("folha").value || 0),
      custos: Number(document.getElementById("custos").value || 0),
      setor: document.getElementById("setor").value
    };
  }

  function setFormData(data) {
    document.getElementById("nomeEmpresa").value = data.nome || "";
    document.getElementById("porte").value = data.porte || "pequeno";
    document.getElementById("faturamento").value = data.faturamento || "";
    document.getElementById("folha").value = data.folha || "";
    document.getElementById("custos").value = data.custos || "";
    document.getElementById("setor").value = data.setor || "servicos";
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
    var faturamento = data.faturamento;
    if (faturamento <= 0) return null;

    var folhaRatio = data.folha / faturamento;
    var regimes = ["simples", "presumido", "real"].map(function (regime) {
      var aliquota = rateByRegime(regime, data.setor, faturamento, folhaRatio);
      return { regime: regime, aliquota: aliquota, imposto: faturamento * aliquota };
    });

    regimes.sort(function (a, b) { return a.imposto - b.imposto; });
    var best = regimes[0];
    var second = regimes[1];
    var economiaAno = Math.max(0, second.imposto - best.imposto);
    var margemLiquida = ((faturamento - data.custos - best.imposto) / faturamento) * 100;
    var reservaMensal = best.imposto / 12;

    return {
      input: data,
      regimes: regimes,
      best: best,
      economiaAno: economiaAno,
      margemLiquida: margemLiquida,
      reservaMensal: reservaMensal
    };
  }

  function buildPlan(porte, bestRegime, economiaAno) {
    var common = [
      "Feche DRE e fluxo de caixa dos últimos 12 meses para validar os números usados na simulação.",
      "Configure alertas de vencimento tributário com 7 dias de antecedência para evitar multa e juros.",
      "Revise CNAE, enquadramento e créditos possíveis com seu contador antes da próxima competência."
    ];

    var byPorte = {
      pequeno: [
        "Criar conta-reserva separada para tributos e depositar valor fixo semanal.",
        "Acompanhar limite de faturamento mensal para evitar desenquadramento inesperado.",
        "Padronizar emissão de nota e conferência de retenções na fonte."
      ],
      medio: [
        "Comparar impacto de pró-labore e folha no anexo/regime atual mês a mês.",
        "Mapear produtos/serviços com margem baixa para reprecificação com carga fiscal embutida.",
        "Consolidar obrigações federais, estaduais e municipais em calendário único."
      ],
      grande: [
        "Consolidar apuração por unidade/filial e classificar riscos tributários por criticidade.",
        "Montar rotina de auditoria mensal de créditos, retenções e obrigações acessórias.",
        "Simular cenário de expansão (receita + folha) antes de novas contratações ou abertura de unidade."
      ]
    };

    var intro = "Regime com melhor custo estimado: " + bestRegime.toUpperCase() +
      " (economia potencial aproximada de " + brl(economiaAno) + " por ano).";

    return [intro].concat(common, byPorte[porte]);
  }

  function renderTable(items, best) {
    tabela.innerHTML = items.map(function (item) {
      var cls = item.regime === best.regime ? "best" : "";
      return "<tr>" +
        "<td class='" + cls + "'>" + item.regime.toUpperCase() + "</td>" +
        "<td>" + brl(item.imposto) + "</td>" +
        "<td>" + (item.aliquota * 100).toFixed(2) + "%</td>" +
      "</tr>";
    }).join("");
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

    resumo.classList.remove("empty");
    resumo.innerHTML =
      "<strong>" + (d.nome || "Empresa") + "</strong><br>" +
      "<strong>Recomendação inicial:</strong> " + best.regime.toUpperCase() + "<br>" +
      "<strong>Imposto estimado:</strong> " + brl(best.imposto) + "/ano" +
      " · <strong>Economia potencial:</strong> " + brl(result.economiaAno) + "/ano" +
      " · <strong>Margem líquida pós-imposto:</strong> " + result.margemLiquida.toFixed(1) + "%" +
      "<br><strong>Reserva mensal sugerida:</strong> " + brl(result.reservaMensal);

    renderTable(result.regimes, best);
    setTierActive(d.porte);

    var plano = buildPlan(d.porte, best.regime, result.economiaAno);
    planoAcao.innerHTML = plano.map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");

    renderAlerts(d.porte, result.reservaMensal);
  }

  function nextDueDate(obrigacao) {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();

    if (obrigacao.meses) {
      for (var i = 0; i < obrigacao.meses.length; i++) {
        var m = obrigacao.meses[i] - 1;
        var candidate = new Date(year, m, obrigacao.dia);
        if (candidate >= now) return candidate;
      }
      return new Date(year + 1, obrigacao.meses[0] - 1, obrigacao.dia);
    }

    var due = new Date(year, month, obrigacao.dia);
    if (due < now) due = new Date(year, month + 1, obrigacao.dia);
    return due;
  }

  function daysUntil(date) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  function formatDate(date) {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function renderAlerts(porte, reservaMensal) {
    var filtered = OBRIGACOES.filter(function (o) {
      if (porte === "pequeno") return ["das", "fgts", "iss"].indexOf(o.id) >= 0;
      if (porte === "medio") return o.id !== "defis" || true;
      return true;
    });

    var pendentes = 0;

    listaAlertas.innerHTML = filtered.map(function (o) {
      var due = nextDueDate(o);
      var dias = daysUntil(due);
      var cls = "ok";
      var diasLabel = "Em " + dias + " dias";

      if (dias <= 3) {
        cls = "urgente";
        diasLabel = dias === 0 ? "Hoje!" : dias + " dia(s)";
        pendentes++;
      } else if (dias <= 7) {
        cls = "proximo";
        pendentes++;
      }

      var valorHint = o.id === "das" && reservaMensal
        ? " · Reserve " + brl(reservaMensal)
        : "";

      return "<div class='alert-item " + cls + "'>" +
        "<div class='info'>" +
          "<strong>" + o.nome + "</strong>" +
          "<span>" + o.tipo + " · Vence " + formatDate(due) + valorHint + "</span>" +
        "</div>" +
        "<div class='dias " + cls + "'>" + diasLabel + "</div>" +
      "</div>";
    }).join("");

    if (pendentes > 0) {
      alertasResumo.textContent = pendentes + " alerta(s) ativo(s)";
      alertasResumo.classList.remove("ok");
    } else {
      alertasResumo.textContent = "Tudo em dia";
      alertasResumo.classList.add("ok");
    }
  }

  function renderCompanies() {
    var list = loadCompanies();
    listaEmpresas.classList.toggle("empty", list.length === 0);

    if (list.length === 0) {
      listaEmpresas.innerHTML = "";
      return;
    }

    listaEmpresas.innerHTML = list.map(function (emp) {
      var active = emp.id === activeCompanyId ? " active" : "";
      return "<div class='company-chip" + active + "' data-id='" + emp.id + "'>" +
        "<span>" + emp.nome + "</span>" +
        "<button type='button' class='del' data-del='" + emp.id + "' title='Remover'>&times;</button>" +
      "</div>";
    }).join("");

    listaEmpresas.querySelectorAll(".company-chip").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        if (e.target.classList.contains("del")) return;
        var id = chip.dataset.id;
        var emp = loadCompanies().find(function (c) { return c.id === id; });
        if (emp) {
          activeCompanyId = id;
          setFormData(emp);
          renderCompanies();
          if (emp.lastResult) renderResult(emp.lastResult);
          else form.dispatchEvent(new Event("submit"));
        }
      });
    });

    listaEmpresas.querySelectorAll(".del").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.dataset.del;
        var updated = loadCompanies().filter(function (c) { return c.id !== id; });
        saveCompanies(updated);
        if (activeCompanyId === id) activeCompanyId = null;
        renderCompanies();
      });
    });
  }

  function saveCurrentCompany(result) {
    var data = getFormData();
    if (!data.nome) {
      alert("Informe o nome da empresa antes de salvar.");
      return;
    }

    var list = loadCompanies();
    var existing = list.find(function (c) { return c.id === activeCompanyId; });

    if (existing) {
      Object.assign(existing, data, { lastResult: result, updatedAt: Date.now() });
    } else {
      var emp = Object.assign({ id: uid(), createdAt: Date.now() }, data, { lastResult: result });
      list.push(emp);
      activeCompanyId = emp.id;
    }

    saveCompanies(list);
    renderCompanies();
  }

  function exportPdf() {
    if (!lastResult) return;

    var d = lastResult.input;
    var best = lastResult.best;
    var plano = buildPlan(d.porte, best.regime, lastResult.economiaAno);

    var win = window.open("", "_blank");
    if (!win) {
      alert("Permita pop-ups para exportar o PDF.");
      return;
    }

    var regimesRows = lastResult.regimes.map(function (r) {
      var mark = r.regime === best.regime ? " ★" : "";
      return "<tr><td>" + r.regime.toUpperCase() + mark + "</td><td>" + brl(r.imposto) + "</td><td>" + (r.aliquota * 100).toFixed(2) + "%</td></tr>";
    }).join("");

    var planoItems = plano.map(function (p) { return "<li>" + p + "</li>"; }).join("");

    win.document.write(
      "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'>" +
      "<title>Relatório Fiscal — " + d.nome + "</title>" +
      "<style>" +
      "body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}" +
      "h1{font-size:1.4rem;border-bottom:2px solid #333;padding-bottom:8px}" +
      "h2{font-size:1rem;margin-top:24px;color:#444}" +
      "table{width:100%;border-collapse:collapse;margin:12px 0}" +
      "th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:0.9rem}" +
      "th{background:#f5f5f5}" +
      ".meta{background:#f9f9f9;padding:12px;border-radius:6px;margin:12px 0;line-height:1.7}" +
      ".footer{margin-top:40px;font-size:0.75rem;color:#888;border-top:1px solid #ddd;padding-top:12px}" +
      "@media print{body{padding:20px}}" +
      "</style></head><body>" +
      "<h1>Radar Tributário — Relatório Fiscal</h1>" +
      "<p>Gerado em " + new Date().toLocaleString("pt-BR") + "</p>" +
      "<div class='meta'>" +
        "<strong>Empresa:</strong> " + d.nome + "<br>" +
        "<strong>Porte:</strong> " + d.porte + " · <strong>Setor:</strong> " + d.setor + "<br>" +
        "<strong>Faturamento anual:</strong> " + brl(d.faturamento) + "<br>" +
        "<strong>Folha anual:</strong> " + brl(d.folha) + " · <strong>Custos:</strong> " + brl(d.custos) +
      "</div>" +
      "<h2>Recomendação</h2>" +
      "<div class='meta'>" +
        "<strong>Regime sugerido:</strong> " + best.regime.toUpperCase() + "<br>" +
        "<strong>Imposto estimado/ano:</strong> " + brl(best.imposto) + "<br>" +
        "<strong>Economia potencial:</strong> " + brl(lastResult.economiaAno) + "/ano<br>" +
        "<strong>Margem líquida pós-imposto:</strong> " + lastResult.margemLiquida.toFixed(1) + "%<br>" +
        "<strong>Reserva mensal sugerida:</strong> " + brl(lastResult.reservaMensal) +
      "</div>" +
      "<h2>Comparativo de regimes</h2>" +
      "<table><thead><tr><th>Regime</th><th>Imposto/ano</th><th>Alíquota</th></tr></thead><tbody>" +
      regimesRows + "</tbody></table>" +
      "<h2>Plano de ação (30 dias)</h2><ol>" + planoItems + "</ol>" +
      "<div class='footer'>Simulação educacional. Planejamento dentro da legislação vigente. " +
      "Consulte seu contador para decisões finais. Radar Tributário MVP.</div>" +
      "</body></html>"
    );

    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 400);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = getFormData();
    var result = simulate(data);
    if (!result) return;
    renderResult(result);
  });

  btnSalvarEmpresa.addEventListener("click", function () {
    var data = getFormData();
    var result = simulate(data);
    if (!result) {
      alert("Preencha faturamento antes de salvar.");
      return;
    }
    renderResult(result);
    saveCurrentCompany(result);
  });

  btnNovaEmpresa.addEventListener("click", function () {
    activeCompanyId = null;
    setFormData({ nome: "", porte: "pequeno", faturamento: 0, folha: 0, custos: 0, setor: "servicos" });
    resumo.classList.add("empty");
    resumo.textContent = "Preencha o formulário para calcular.";
    tabela.innerHTML = "";
    btnExportarPdf.disabled = true;
    lastResult = null;
    renderCompanies();
    renderAlerts("pequeno", 0);
    document.getElementById("nomeEmpresa").focus();
  });

  btnExportarPdf.addEventListener("click", exportPdf);

  renderCompanies();
  renderAlerts("pequeno", 0);
})();
