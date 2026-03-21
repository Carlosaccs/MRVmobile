/* ==========================================================================
   BLOCO 10: CONFIGURAÇÕES E CONSTANTES
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const svgNS = "http://www.w3.org/2000/svg";

/* ==========================================================================
   BLOCO 20: RENDERIZAÇÃO DO MAPA (SVG)
   ========================================================================== */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) {
        console.error("Erro Bloco 20: Container ou Dados ausentes.");
        return;
    }
    
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        
        // Cores base v27
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.setAttribute('data-original-fill', corBase);
        
        // BLOCO 25: INTERAÇÃO
        path.onclick = () => {
            document.querySelectorAll('path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            path.style.fill = "#ff8c00";
            
            const nomeImovel = document.getElementById('nome-imovel');
            if (nomeImovel) nomeImovel.innerText = pData.id.replace(/-/g, ' ').toUpperCase();
        };

        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
    console.log("Bloco 20: Mapa injetado no DOM.");
}

/* ==========================================================================
   BLOCO 30: INICIALIZAÇÃO (CORRIGIDA)
   ========================================================================== */
function iniciarSistema() {
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        console.error("Bloco 30: MAPA_GSP não definido. Tentando novamente em 500ms...");
        setTimeout(iniciarSistema, 500); // Tenta carregar de novo se o arquivo de dados atrasar
    }
}

// Dispara a inicialização
window.onload = iniciarSistema;
