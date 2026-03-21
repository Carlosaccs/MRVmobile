/* ==========================================================================
   BLOCO 10: CONFIGURAÇÕES E CONSTANTES
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const svgNS = "http://www.w3.org/2000/svg";

/* ==========================================================================
   BLOCO 20: RENDERIZAÇÃO DO MAPA (SVG)
   ========================================================================== */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) return;
    
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        
        // Definição de cores base (Verde MRV e Cinza para outros)
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.setAttribute('data-original-fill', corBase);
        
        // BLOCO 25: INTERAÇÃO DE CLIQUE NO MAPA
        path.onclick = () => {
            // Reseta cores de todos os paths antes de destacar
            document.querySelectorAll('path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            
            // Destaque em Laranja
            path.style.fill = "#ff8c00";
            
            // Atualiza a Ficha Técnica
            const nomeImovel = document.getElementById('nome-imovel');
            if (nomeImovel) nomeImovel.innerText = pData.id.replace(/-/g, ' ').toUpperCase();
        };

        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

/* ==========================================================================
   BLOCO 30: INICIALIZAÇÃO DO SISTEMA
   ========================================================================== */
window.onload = () => {
    // Verifica se os dados do mapa (MAPA_GSP) foram carregados via HTML
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
        console.log("Mapa v38 carregado com sucesso.");
    } else {
        console.error("Erro Crítico: Dados do mapa não encontrados.");
    }
};
