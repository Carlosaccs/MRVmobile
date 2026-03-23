/* ==========================================================================
   v146 - VERSÃO AUDITORIA (FORÇA CARREGAMENTO DOS 42 REGISTROS)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// DNA DOS ÍCONES (TELA CHEIA)
const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 135.41086 L 136.44697 124.7898 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

// 1. CARREGAMENTO BLINDADO (LIMPEZA TOTAL)
async function carregarPlanilha() {
    console.log("🔍 Iniciando busca de dados...");
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim() !== "");
        
        window.bancoDados = {}; 

        linhas.slice(1).forEach((linha, i) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 4) {
                // Limpeza profunda: Remove aspas, espaços duplos e quebras de linha
                const idOriginal = c[0].replace(/["']/g, '').trim().toLowerCase();
                const nomeCurto = c[3]?.replace(/["']/g, '').trim() || "";

                if (idOriginal && nomeCurto) {
                    window.bancoDados[idOriginal] = {
                        nomeCurto: nomeCurto,
                        nomeFull: c[4]?.replace(/["']/g, '').trim() || nomeCurto,
                        estoque: c[5]?.replace(/["']/g, '').trim() || "0",
                        statusObra: c[11]?.replace(/["']/g, '').trim() || "Consulte"
                    };
                }
            }
        });

        const total = Object.keys(window.bancoDados).length;
        console.log(`✅ Banco de Dados: ${total} registros processados.`);
        
        // Log de Auditoria (Aparece no Inspecionar do navegador)
        console.table(Object.values(window.bancoDados).map(v => v.nomeCurto));

        const contador = document.getElementById('contador-registros');
        if (contador) {
            contador.innerText = total.toString().padStart(2, '0');
            contador.style.color = (total >= 42) ? "#ADFF2F" : "#FFFF00";
        }

        verificarERenderizar();
    } catch (e) {
        console.error("❌ Falha no carregamento:", e);
    }
}

function verificarERenderizar() {
    if (typeof MAPA_GSP !== 'undefined') {
        atualizarVisualizacao();
    } else {
        setTimeout(verificarERenderizar, 100);
    }
}

// 2. FUNÇÕES DO HTML (toggleMenuLateral e toggleFullscreen)
function toggleMenuLateral() {
    const menu = document.getElementById('menu-lateral-container');
    if (menu) {
        menu.classList.toggle('aberto');
        if (menu.classList.contains('aberto')) popularMenuResidenciais();
    }
}

function popularMenuResidenciais() {
    const trilho = document.getElementById('trilho-infinito');
    if (!trilho) return;
    trilho.innerHTML = "";

    const nomesOrdenados = Object.keys(window.bancoDados).sort((a, b) => 
        window.bancoDados[a].nomeCurto.localeCompare(window.bancoDados[b].nomeCurto)
    );

    nomesOrdenados.forEach(id => {
        const info = window.bancoDados[id];
        const card = document.createElement('div');
        card.className = 'card-residencial';
        card.innerText = info.nomeCurto.toUpperCase();
        
        card.onclick = (e) => {
            e.stopPropagation();
            const pathOriginal = document.getElementById(id);
            if (pathOriginal) {
                pathOriginal.dispatchEvent(new Event('click'));
                toggleMenuLateral();
            } else {
                console.warn(`ID [${id}] não encontrado no seu SVG.`);
            }
        };
        trilho.appendChild(card);
    });
}

// 3. DESENHO E MAPAS
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
        const ehMRV = pData.class === "commrv";

        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.setAttribute("class", pData.class || "semmrv");

        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado && ehMRV) {
            path.onclick = () => {
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-cor-base');
                });
                path.style.fill = "#FF4500"; // Laranja ao clicar
                document.getElementById('identificador-cidade').innerText = pData.name || pData.id;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p><strong>Estoque:</strong> ${info.estoque}</p>
                        <p><strong>Status:</strong> ${info.statusObra}</p>
                    `;
                } else {
                    document.getElementById('nome-imovel').innerText = "Dados não encontrados";
                    document.getElementById('detalhes-imovel').innerText = `O ID [${idLimpo}] está no mapa mas não na planilha.`;
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    document.getElementById('identificador-cidade').innerText = "";
    atualizarVisualizacao();
}

// 4. FULLSCREEN
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function atualizarVisualIconeFullscreen() {
    const path = document.getElementById('path-fullscreen');
    const svg = path?.closest('svg');
    if (!path || !svg) return;

    if (document.fullscreenElement) {
        path.setAttribute('d', DNA_REDUZIR);
        svg.setAttribute('viewBox', '55 120 80 80');
    } else {
        path.setAttribute('d', DNA_AMPLIAR);
        svg.setAttribute('viewBox', '60 110 90 90');
    }
}

// 5. BOOT
window.onload = () => carregarPlanilha();
document.addEventListener('fullscreenchange', atualizarVisualIconeFullscreen);
