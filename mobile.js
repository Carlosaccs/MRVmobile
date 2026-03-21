/* ==========================================================================
   BLOCO 10: RENDERIZAÇÃO DO MAPA (PURO)
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
        
        // Cores base do projeto
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        
        // Evento de clique apenas para teste visual de seleção no mapa
        path.onclick = () => {
            document.querySelectorAll('path').forEach(p => {
                const c = p.id.includes('semmrv') ? "#cccccc" : "#00713a";
                p.style.fill = c;
            });
            path.style.fill = "#ff8c00"; // Destaque laranja ao clicar
        };

        g.appendChild(path);
    });

    svg.appendChild(g);
    container.innerHTML = "";
    container.appendChild(svg);
}

/* ==========================================================================
   BLOCO 20: INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
    // Carrega o mapa GSP se o arquivo de dados estiver presente
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    }
};
