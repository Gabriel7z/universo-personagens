(function () {
  "use strict";

  var form = document.getElementById("simulador");
  var tabela = document.getElementById("tabelaRegimes");
  var resumo = document.getElementById("resumo");
  var planoAcao = document.getElementById("planoAcao");

  function brl(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var porte = document.getElementById("porte").value;
    var faturamento = Number(document.getElementById("faturamento").value || 0);
    var folha = Number(document.getElementById("folha").value || 0);
    var custos = Number(document.getElementById("custos").value || 0);
    var setor = document.getElementById("setor").value;

    if (faturamento <= 0) return;

    var folhaRatio = folha / faturamento;
    var regimes = ["simples", "presumido", "real"].map(function (regime) {
      var aliquota = rateByRegime(regime, setor, faturamento, folhaRatio);
      var imposto = faturamento * aliquota;
      return { regime: regime, aliquota: aliquota, imposto: imposto };
    });

    regimes.sort(function (a, b) { return a.imposto - b.imposto; });
    var best = regimes[0];
    var second = regimes[1];
    var economiaAno = Math.max(0, second.imposto - best.imposto);
    var margemLiquida = ((faturamento - custos - best.imposto) / faturamento) * 100;

    resumo.classList.remove("empty");
    resumo.innerHTML =
      "<strong>Recomendação inicial:</strong> " + best.regime.toUpperCase() + "<br>" +
      "<strong>Imposto estimado:</strong> " + brl(best.imposto) + "/ano" +
      " · <strong>Economia potencial:</strong> " + brl(economiaAno) + "/ano" +
      " · <strong>Margem líquida pós-imposto:</strong> " + margemLiquida.toFixed(1) + "%";

    renderTable(regimes, best);
    setTierActive(porte);

    var plano = buildPlan(porte, best.regime, economiaAno);
    planoAcao.innerHTML = plano.map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");
  });
})();
