/* ==========================================================================
   BLOCO 10: CONFIGURAÇÕES E SELEÇÃO DE ELEMENTOS
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";

/* ==========================================================================
   BLOCO 20: FUNÇÃO DE RENDERIZAÇÃO
   ========================================================================== */
function renderizarMapa(dados) {
    const container = document.getElementById('mapa-container');
    if (!container) return;

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
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.setAttribute('data-original-fill', corBase);
        
        path.onclick = () => {
            document.querySelectorAll('path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            path.style.fill = "#ff8c00";
            document.getElementById('nome-imovel').innerText = pData.id.toUpperCase();
        };

        g.appendChild(path);
    });

    svg.appendChild(g);
    container.innerHTML = "";
    container.appendChild(svg);
    console.log("Mapa renderizado com sucesso!");
}

/* ==========================================================================
   BLOCO 30: INICIALIZAÇÃO COM VERIFICAÇÃO CONTÍNUA
   ========================================================================== */
function inicializar() {
    console.log("Tentando inicializar v38...");
    
    // Verifica se os dados do mapa existem na memória
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        console.warn("Aguardando mapa-dados.js...");
        // Se não encontrar, tenta de novo em 300 milisegundos
        setTimeout(inicializar, 300);
    }
}

// Garante que o navegador carregou a estrutura básica antes de começar
document.addEventListener("DOMContentLoaded", inicializar);
