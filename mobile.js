/* ==========================================================================
   v145 - DASHBOARD MOBILE: CONEXÃO + MAPA + MENU DINÂMICO
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

// DNA Ícones Fullscreen
const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 135.41086 L 136.44697 124.7898 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

// 1. CARREGAR DADOS DA PLANILHA
async function carregarPlanilha() {
    try {
        console.log("Iniciando busca de dados...");
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
                    estoque: c[5]?.replace(/"/g, '').trim() || "Consulte",
                    statusObra: c[11]?.replace(/"/g, '').trim() || "Em breve"
                };
            }
        }
        console.log("Planilha processada. Itens:", Object.keys(window.bancoDados).length);
        
        // Só desenha e gera o menu após ter os dados
        atualizarVisualizacao();
        gerarMenuResidenciais();

    } catch (e) {
        console.error("Erro ao conectar com Google Sheets:", e);
    }
}

// 2. GERAR MENU LATERAL (SÓ COM RESIDENCIAIS DA PLANILHA)
function gerarMenuResidenciais() {
    const container = document.getElementById('container-menu');
    if (!container) return;

    container.innerHTML = ""; // Limpa antes de preencher

    const lista = Object.values(window.bancoDados);
    
    lista.forEach(itemDados => {
        const btn = document.createElement('div');
        btn.className = 'item-menu';
        btn.innerText = itemDados.nomeCurto;
        
        btn.onclick = () => {
            // Tenta clicar no prédio correspondente no mapa
            const pathAlvo = document.getElementById(itemDados.id);
            if (pathAlvo) {
                pathAlvo.dispatchEvent(new Event('click'));
            }
            toggleMenu(); // Fecha o menu lateral
        };
        container.appendChild(btn);
    });
}

// 3. DESENHAR O MAPA (CORRIGIDO)
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    // Aplica ajustes de escala e margem se for o mapa principal
    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight;
        svg.style.marginLeft = conf.marginLeft;
        svg.style.transform = `scale(${conf.scale})`;
        svg.style.transition = "all 0.5s ease";
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
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corLaranja = "#FF4500";

        const corBase = ehMRV ? corVerde : corCinzaClaro;
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            path.onclick = () => {
                if (!ehMRV) return;

                // Limpa seleções anteriores
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                // Destaca o selecionado
                path.style.fill = corLaranja;
                document.getElementById('identificador-cidade').innerText = pData.name || pData.id;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto;
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

// 4. FUNÇÕES DE INTERFACE
function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    } else {
        console.error("Arquivos de mapa (JS) não foram carregados corretamente.");
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    document.getElementById('identificador-cidade').innerText = "";
    atualizarVisualizacao();
}

function toggleMenu() {
    const menu = document.getElementById('container-menu');
    if (menu) menu.classList.toggle('aberto');
}

// 5. INICIALIZAÇÃO
window.onload = carregarPlanilha;

document.addEventListener('click', (e) => {
    // Se clicar no mapa pequeno, troca
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
    
    // Se clicar no botão de menu (as 3 linhas no canto inferior esquerdo)
    if (e.target.closest('#botao-hamburguer')) toggleMenu();
});
