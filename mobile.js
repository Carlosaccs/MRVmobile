const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';
let mapaAtivo = "GSP";

async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split('\n').slice(1);
        window.bancoDados = {};
        linhas.forEach(l => {
            const c = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length < 5) return;
            const id = c[0].replace(/"/g, '').trim();
            window.bancoDados[id] = {
                nome: c[3]?.replace(/"/g, '').trim() || "Residencial",
                estoque: c[5]?.replace(/"/g, '').trim() || "0"
            };
        });
    } catch (e) { console.warn("Planilha carregando..."); }
}

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
        path.style.strokeWidth = ehMinimizado ? "6" : "1.5";

        if (!ehMinimizado) {
            path.setAttribute('data-fill-original', corBase);
            path.onclick = () => {
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-fill-original');
                });
                path.style.fill = "#ff8c00";
                const info = window.bancoDados ? window.bancoDados[pData.id] : null;
                document.getElementById('nome-imovel').innerText = info ? info.nome : pData.id.toUpperCase();
                document.getElementById('detalhes-imovel').innerText = info ? `Restam ${info.estoque} unidades disponíveis.` : "Toque em uma unidade para detalhes.";
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

function trocarMapas() {
    if (mapaAtivo === "GSP") {
        mapaAtivo = "INTERIOR";
        desenharMapa(MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(MAPA_GSP, "mapa-minimizado", true);
    } else {
        mapaAtivo = "GSP";
        desenharMapa(MAPA_GSP, "mapa-container", false);
        desenharMapa(MAPA_INTERIOR, "mapa-minimizado", true);
    }
}

window.onload = async () => {
    await carregarPlanilha();
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(MAPA_GSP, "mapa-container", false);
        desenharMapa(MAPA_INTERIOR, "mapa-minimizado", true);
        document.getElementById('mapa-minimizado').onclick = trocarMapas;
    }
};
