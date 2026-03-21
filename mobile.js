/* ==========================================================================
   v124 - VERSÃO FINALIZADA E TESTADA
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

async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split('\n').slice(1);
        
        window.bancoDados = {};
        linhas.forEach(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 5) {
                const id = c[0].replace(/"/g, '').trim().toLowerCase();
                window.bancoDados[id] = {
                    nomeCurto: c[3]?.replace(/"/g, '').trim(),
                    nomeFull: c[4]?.replace(/"/g, '').trim(),
                    estoque: c[5]?.replace(/"/g, '').trim(),
                    entrega: c[8]?.replace(/"/g, '').trim(),
                    statusObra: c[11]?.replace(/"/g, '').trim(),
                    dica: c[16]?.replace(/"/g, '').trim()
                };
            }
        });
        atualizarVisualizacao();
    } catch (e) { 
        console.error("Erro ao carregar dados da planilha:", e);
        atualizarVisualizacao(); // Desenha o mapa mesmo sem dados para não ficar branco
    }
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
        const info = window.bancoDados[idLimpo];
        const nomeCidade = pData.name || pData.id;
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corCinzaEscuro = "#888888";
        const corLaranjaVivo = "#FF4500";

        const corOriginal = (info && pData.class !== "semmrv") ? corVerde : corCinzaClaro;
        
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            path.onmouseover = () => {
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = (corOriginal === corVerde) ? corLaranjaVivo : corCinzaEscuro;
            };

            path.onmouseout = () => {
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = corOriginal;
            };

            path.onclick = () => {
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
                        <p><strong>Previsão:</strong> ${info.entrega}</p>
                        <p><strong>Status:</strong> ${info.statusObra}</p>
                        <hr style="border:0; border-top:1px solid #777">
                        <p style="font-style:italic">${info.dica}</p>
                    `;
                } else {
                    document.getElementById('nome-imovel').innerText = nomeCidade;
                    document.getElementById('detalhes-imovel').innerText = "Região sem residenciais MRV.";
                }
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

function atualizarVisualizacao() {
    // Tenta carregar os mapas dos objetos globais vindos do mapa-SP.js
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    } else {
        console.error("ERRO: Objetos MAPA_GSP ou MAPA_INTERIOR não encontrados. Verifique o arquivo mapa-SP.js");
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

window.onload = async () => {
    await carregarPlanilha();
    const mini = document.getElementById('mapa-minimizado');
    if(mini) mini.onclick = trocarMapas;
};
