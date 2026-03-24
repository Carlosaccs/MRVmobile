/* ==========================================================================
   BLOCO 1: CONFIGURAÇÕES, DNA E VARIÁVEIS GLOBAIS
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

const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 135.41086 L 136.44697 124.7898 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

/* ==========================================================================
   BLOCO 2: CARREGAMENTO DA PLANILHA GOOGLE
   ========================================================================== */
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(line => line.trim() !== "");
        window.bancoDados = {};

        for (let i = 1; i < linhas.length; i++) {
            const c = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 5) {
                const idOriginal = c[0].replace(/"/g, '').trim();
                const idLimpo = idOriginal.toLowerCase();
                
                window.bancoDados[idLimpo] = {
                    id: idLimpo,
                    nomeCurto: c[3]?.replace(/"/g, '').trim() || idOriginal,
                    nomeFull: c[4]?.replace(/"/g, '').trim() || idOriginal,
                    estoque: c[5]?.replace(/"/g, '').trim() || "Consulte",
                    statusObra: c[11]?.replace(/"/g, '').trim() || "Em breve"
                };
            }
        }
        console.log("Dados carregados:", Object.keys(window.bancoDados).length);
        
        // APÓS CARREGAR OS DADOS, GERA O MENU
        gerarMenuResidenciais();
        
    } catch (e) { console.error("Erro na planilha:", e); }
    atualizarVisualizacao();
}

/* ==========================================================================
   BLOCO 3: CONSTRUÇÃO DO MENU LATERAL DINÂMICO
   ========================================================================== */
function gerarMenuResidenciais() {
    const container = document.getElementById('container-menu');
    if (!container) return;

    container.innerHTML = ""; // Limpa antes de gerar
    
    // Transforma o objeto bancoDados em uma lista e ordena
    const lista = Object.values(window.bancoDados);

    lista.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'item-menu';
        item.innerText = reg.nomeCurto;
        
        item.onclick = () => {
            // Busca o path no mapa principal e dispara o clique dele
            const pathMapa = document.getElementById(reg.id);
            if (pathMapa) {
                pathMapa.dispatchEvent(new Event('click'));
            }
            toggleMenu(); // Fecha o menu
        };
        container.appendChild(item);
    });
}

function toggleMenu() {
    const menu = document.getElementById('container-menu');
    if (menu) menu.classList.toggle('aberto');
}

/* ==========================================================================
   BLOCO 4: DESENHO E LÓGICA DO MAPA SVG
   ========================================================================== */
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
        const ehMRV = pData.class === "commrv";

        path.setAttribute("d", pData.d);
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
            path.onclick = () => {
                if (!ehMRV) return;

                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                path.style.fill = corLaranjaVivo;
                cidadeSelecionada = nomeCidade;
                document.getElementById('identificador-cidade').innerText = nomeCidade;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p style="margin: 10px 0;"><strong>Estoque:</strong> ${info.estoque}</p>
                        <p style="margin: 10px 0;"><strong>Status:</strong> ${info.statusObra}</p>
                    `;
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

/* ==========================================================================
   BLOCO 5: CONTROLES DE INTERFACE E EVENTOS
   ========================================================================== */
function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    document.getElementById('identificador-cidade').innerText = "";
    atualizarVisualizacao();
}

function atualizarVisualIconeFullscreen() {
    const path = document.getElementById('path-fullscreen');
    if (!path) return;
    path.setAttribute('d', document.fullscreenElement ? DNA_REDUZIR : DNA_AMPLIAR);
}

window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
    // Clique no hambúrguer (ajuste a classe se necessário)
    if (e.target.closest('.icon-bottom')) toggleMenu(); 
});
document.addEventListener('fullscreenchange', atualizarVisualIconeFullscreen);
