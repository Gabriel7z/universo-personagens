# Radar Tributário (CONTABIL)

Simulador fiscal web para **planejamento tributário legal** — pequeno (acima do MEI), médio e grande porte.

**Repositório:** https://github.com/Gabriel7z/CONTABIL

## Funcionalidades

- Comparativo de regimes: **Simples Nacional**, **Lucro Presumido**, **Lucro Real**
- Diagnóstico por porte empresarial
- Recomendação de regime com economia estimada
- Reserva mensal sugerida para impostos
- Alertas de vencimento (DAS, FGTS, ISS, IRPJ, DEFIS)
- Cadastro de múltiplas empresas (localStorage)
- Exportação de relatório em PDF
- Plano de ação fiscal em 30 dias

## Como usar

Abra `index.html` no navegador ou publique como site estático.

```bash
python3 -m http.server 8080
# Acesse http://localhost:8080
```

## Site online (GitHub Pages)

Ative em [Settings → Pages](https://github.com/Gabriel7z/CONTABIL/settings/pages) → **Deploy from a branch** → `main` → `/ (root)`.

**URL:** https://gabriel7z.github.io/CONTABIL/

## Estrutura

```
index.html          # App principal
assets/styles.css   # Estilos
assets/app.js       # Lógica de simulação
```

## Aviso legal

Este é um **MVP educacional**. Os cálculos são estimativas simplificadas.
Consulte sempre um contador para decisões fiscais definitivas.

## Licença

MIT
