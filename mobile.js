/* ==========================================================================
   v131 - PROTOCOLO DE CARREGAMENTO SEGURO (ANTI-CONFLITO)
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeSelecionada = ""; 
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// FUNÇÃO DE VERIFICAÇÃO CRÍTICA
function verificarEDesenhar() {
    // Verifica se as variáveis do arquivo mapa-SP.js já existem na memória
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        console.log("Mapas detectados! Iniciando renderização...");
        atualizarVisualizacao();
        carregarPlanilha();
    } else {
        console.warn("Aguardando dados do mapa-SP.js...");
        // Tenta novamente em 500ms se ainda não carregou
        setTimeout(verificarEDesenhar, 500);
    }
}

// Inicia o processo assim que a página base carregar
window.addEventListener('load', verificarEDesenhar);

async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split('\n').slice(1);
        linhas.forEach(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 5) {
                const id = c[0].replace(/"/g, '').trim().toLowerCase();
                window.bancoDados[id] = {
                    nomeCurto: c[3]?.replace(/"/g, '').trim(),
                    nomeFull: c[4]?.replace(/"/g, '').trim(),
                    estoque: c[5]?.replace(/"/g, '').trim(),
                    statusObra: c[11]?.replace(/"/g, '').trim()
                };
            }
        });
    } catch (e) { console.error("Erro na planilha:", e); }
}

function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight;
        svg.style.marginLeft = conf.marginLeft;
        svg.style.transform = `scale(${conf.scale})`;
    }

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const nomeCidade = pData.name || pData.id;
        const ehMRV = pData.class === "commrv";

        path.setAttribute("d", pData.d);
        path.setAttribute("class", pData.class || "semmrv");
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corLaranjaVivo = "#FF4500";
        const corOriginal = ehMRV ? corVerde : corCinzaClaro;

        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            const focar = () => {
                if (!ehMRV) return;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;
                if (path.getAttribute('data-selecionado') !== 'true') path.style.fill = corLaranjaVivo;
            };

            const desfocar = () => {
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                if (path.getAttribute('data-selecionado') !== 'true') path.style.fill = corOriginal;
            };

            path.onmouseover = focar;
            path.onmouseout = desfocar;
            path.ontouchstart = (e) => { focar(); };

            path.onclick = () => {
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

                const info = window.bancoDados[idLimpo];
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

function atualizarVisualizacao() {
    desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
    desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

// Ouvinte para o mini mapa
document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
