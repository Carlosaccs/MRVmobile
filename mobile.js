/* ==========================================================================
   BLOCO 10: MOTOR DA PLANILHA (ORDEM DAS COLUNAS REVISADA)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1);
        const lista = document.getElementById('lista-botoes');
        if (!lista) return;
        lista.innerHTML = '';

        linhas.forEach(linha => {
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (col.length < 5) return;

            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),
                zona: col[1]?.replace(/"/g, '').trim().toUpperCase() || "", // Coluna B
                nome: col[3]?.replace(/"/g, '').trim() || "Sem Nome",       // Coluna D
                estoque: col[5]?.replace(/"/g, '').trim() || "0"            // Coluna F
            };

            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            btn.setAttribute('data-zona', registro.zona);
            
            // HTML limpo para evitar textos encavalados
            btn.innerHTML = `
                <div style="font-weight: 800; color: #333; font-size: 0.85rem; margin-bottom: 3px;">
                    ${registro.zona} ${registro.nome}
                </div>
                <div style="color: #888; font-size: 0.65rem; text-transform: uppercase;">
                    Restam ${registro.estoque} unidades
                </div>
            `;
            
            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            lista.appendChild(btn);
        });
    } catch (e) { console.error("Erro na restauração v35:", e); }
}

/* ==========================================================================
   BLOCO 30 & 40: INICIALIZAÇÃO E MAPA
   ========================================================================== */
function renderizarMapa(dados) {
    const container = document.getElementById('mapa-container');
    if (!container || !dados) return;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.setAttribute('data-original-fill', corBase);
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.innerHTML = "";
    container.appendChild(svg);
}

window.onload = () => {
    if (typeof MAPA_GSP !== 'undefined') renderizarMapa(MAPA_GSP);
    carregarDadosPlanilha();
};

// Toggle Menu
document.querySelector('.icon-bottom').onclick = () => {
    document.getElementById('menu-empreendimentos').classList.toggle('aberto');
};
