/* ==========================================================================
   v126 - TRAVA PARA SEMMRV + POSICIONAMENTO DIREITO
   ========================================================================== */

function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    // ... (Ajustes de escala iguais) ...

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const info = window.bancoDados[idLimpo];
        const nomeCidade = pData.name || pData.id;
        const ehMRV = pData.class === "commrv"; // Verifica se tem MRV

        path.setAttribute("d", pData.d);
        path.setAttribute("class", pData.class);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corCinzaEscuro = "#888888";
        const corLaranjaVivo = "#FF4500";

        const corOriginal = ehMRV ? corVerde : corCinzaClaro;
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            path.onmouseover = () => {
                // Só muda o texto superior se for MRV
                if (ehMRV) {
                    const display = document.getElementById('identificador-cidade');
                    if(display) display.innerText = nomeCidade;
                }
                
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = ehMRV ? corLaranjaVivo : corCinzaEscuro;
            };

            path.onmouseout = () => {
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = corOriginal;
            };

            path.onclick = () => {
                // TRAVA: Se for semmrv, ignora o clique
                if (!ehMRV) return;

                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                path.setAttribute('data-selecionado', 'true');
                path.style.fill = corLaranjaVivo;
                cidadeSelecionada = nomeCidade;
                
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto || info.nomeFull;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p><strong>Estoque:</strong> ${info.estoque}</p>
                        <p><strong>Status:</strong> ${info.statusObra}</p>
                    `;
                }
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}
/* ... (Restante da lógica de troca de mapas igual) ... */

function atualizarVisualizacao() {
    // Verifica se os objetos globais existem antes de tentar desenhar
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        const principal = (mapaAtivo === "GSP") ? MAPA_GSP : MAPA_INTERIOR;
        const mini = (mapaAtivo === "GSP") ? MAPA_INTERIOR : MAPA_GSP;

        desenharMapa(principal, "mapa-container", false);
        desenharMapa(mini, "mapa-minimizado", true);
    } else {
        console.error("Arquivos de mapa não carregados corretamente.");
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

// Inicialização segura
window.addEventListener('load', () => {
    carregarPlanilha();
    const mini = document.getElementById('mapa-minimizado');
    if(mini) mini.onclick = trocarMapas;
});
