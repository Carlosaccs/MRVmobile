/* ==========================================================================
   v139 - INTEGRAL: MAPA + TELA CHEIA + ÍCONES INKSCAPE
   ========================================================================== */

// 1. Configurações Iniciais e Dados
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeSelecionada = ""; 
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// DNA DOS ÍCONES (Caminhos extraídos do seu Inkscape)
const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 135.41086 L 136.44697 124.7898 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

// 2. Carregamento de Dados da Planilha
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
                    statusObra: c[11]?.replace(/"/g, '').trim()
                };
            }
        });
    } catch (e) { console.warn("Planilha Offline"); }
    atualizarVisualizacao();
}

// 3. Função de Desenho do Mapa
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
        path.setAttribute("class", pData.class || "semmrv");
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corLaranjaVivo = "#FF4500";
        const corCinzaEscuro = "#777777";

        const corOriginal = ehMRV ? corVerde : corCinzaClaro;
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            const ativarFoco = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;
                path.style.fill = ehMRV ? corLaranjaVivo : corCinzaEscuro;
            };

            const desativarFoco = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                path.style.fill = corOriginal;
            };

            path.onmouseover = ativarFoco;
            path.onmouseout = desativarFoco;
            path.ontouchstart = ativarFoco;
            path.ontouchend = () => setTimeout(desativarFoco, 1200);

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

// 4. Controles de Visualização e Troca de Mapa
function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

// 5. Funções de Tela Cheia e Ícones
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err.message));
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

// 6. Inicialização e Eventos Globais
window.onload = carregarPlanilha;

document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});

document.addEventListener('fullscreenchange', atualizarVisualIconeFullscreen);

// 7. Função de Abrir/Fechar o menu da lateral esquerda (Sem estragar o mapa)
function toggleMenuLateral() {
    const menu = document.getElementById('menu-lateral-container');
    menu.classList.toggle('aberto');
}
/* ==========================================================================
   v138 - LÓGICA DO MENU LATERAL (COLUNA D)
   ========================================================================== */

function toggleMenuLateral() {
    const menu = document.getElementById('menu-lateral-container');
    if (!menu) return;

    menu.classList.toggle('aberto');

    // Se abriu, vamos montar a lista de residenciais
    if (menu.classList.contains('aberto')) {
        popularMenuResidenciais();
    }
}

function popularMenuResidenciais() {
    const trilho = document.getElementById('trilho-infinito');
    if (!trilho || !window.bancoDados) return;

    // 1. Limpa o menu para não duplicar toda vez que abrir
    trilho.innerHTML = "";

    // 2. Transforma o bancoDados em uma lista e pega apenas a Coluna D (nomeCurto)
    const listaIds = Object.keys(window.bancoDados);

    listaIds.forEach(id => {
        const info = window.bancoDados[id];
        
        // Só cria o card se existir um nome na Coluna D
        if (info.nomeCurto && info.nomeCurto.trim() !== "") {
            const card = document.createElement('div');
            card.className = 'card-residencial';
            card.innerText = info.nomeCurto;

            // Ao clicar no nome no menu, ele seleciona a cidade no mapa
            card.onclick = () => {
                const pathMapa = document.getElementById(id);
                if (pathMapa) pathMapa.click(); // Simula o clique no mapa
                toggleMenuLateral(); // Fecha o menu
            };

            trilho.appendChild(card);
        }
    });
}
