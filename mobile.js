const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';
let mapaAtivo = "GSP";

// ... (mantenha a função carregarPlanilha igual) ...

function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.8";

        if (!ehMinimizado) {
            path.setAttribute('data-fill-original', corBase);
            path.onclick = () => {
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-fill-original');
                });
                path.style.fill = "#ffb347";
                const info = window.bancoDados ? window.bancoDados[pData.id] : null;
                document.getElementById('nome-imovel').innerText = info ? info.nome : pData.id.toUpperCase();
                document.getElementById('detalhes-imovel').innerText = info ? `Unidades: ${info.estoque}` : "Sem unidades.";
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

function trocarMapas() {
    const container = document.getElementById('mapa-container');
    
    if (mapaAtivo === "GSP") {
        mapaAtivo = "INTERIOR";
        container.className = "modo-interior"; // Define a classe de movimento
        desenharMapa(MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(MAPA_GSP, "mapa-minimizado", true);
    } else {
        mapaAtivo = "GSP";
        container.className = "modo-gsp"; // Volta para a posição original
        desenharMapa(MAPA_GSP, "mapa-container", false);
        desenharMapa(MAPA_INTERIOR, "mapa-minimizado", true);
    }
}

window.onload = async () => {
    await carregarPlanilha();
    const container = document.getElementById('mapa-container');
    if (container) container.className = "modo-gsp"; // Inicia com a classe correta

    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(MAPA_GSP, "mapa-container", false);
        desenharMapa(MAPA_INTERIOR, "mapa-minimizado", true);
        document.getElementById('mapa-minimizado').onclick = trocarMapas;
    }
};
