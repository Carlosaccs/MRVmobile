/* ==========================================================================
   v140.7 - DASHBOARD MOBILE: FOCO EM COMPLEXOS E LISTA COMPACTA
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.dadosGerais = [];

// Paths dos ícones para o botão de tela cheia
const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

/* --- Funções de Controle --- */

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        if (menu.classList.contains('menu-oculto')) {
            menu.classList.remove('menu-oculto');
            menu.classList.add('menu-aberto');
        } else {
            menu.classList.remove('menu-aberto');
            menu.classList.add('menu-oculto');
        }
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function atualizarIconeFullscreen() {
    const p = document.getElementById('path-fullscreen');
    const svg = document.getElementById('svg-fullscreen');
    if (!p || !svg) return;
    if (document.fullscreenElement) {
        p.setAttribute('d', DNA_REDUZIR);
        svg.setAttribute('viewBox', '55 120 80 80');
    } else {
        p.setAttribute('d', DNA_AMPLIAR);
        svg.setAttribute('viewBox', '60 110 90 90');
    }
}

/* --- Lógica de Mapa e Planilha --- */

async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 4) {
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                const reg = limpar(c[13]); 
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    nomeCurto: reg ? `${limpar(c[3]) || "Sem Nome"} - ${reg}` : limpar(c[3]) || "Sem Nome",
                    regional: reg
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
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
    if(dados.transform) g.setAttribute("transform", dados.transform);
    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const temResidencial = window.dadosGerais.some(d => d.id === idLimpo);
        const ehMRV = pData.class === "commrv" || temResidencial;
        path.setAttribute('data-name', pData.name || pData.id);
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        const corVerde = "#00713a", corCinza = "#cccccc", corLaranja = "#FF4500", corFoco = "#777777";
        const corBase = ehMRV ? corVerde : corCinza;
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);
        if (!ehMinimizado) {
            path.onmouseover = () => { atualizarTextoTopo(pData.name || pData.id); if (path.getAttribute('data-selecionado') !== 'true') path.style.fill = ehMRV ? corLaranja : corFoco; };
            path.onmouseout = () => { atualizarTextoTopo(null); if (path.getAttribute('data-selecionado') !== 'true') path.style.fill = corBase; };
            path.onclick = () => { if (pData.id === "grandesaopaulo") { trocarMapas(); return; } if (!ehMRV) return; clicarNoMapa(path, window.dadosGerais.find(d => d.id === idLimpo), pData); };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function clicarNoMapa(pathElement, info, pDataRaw = null) {
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    document.querySelectorAll('#mapa-container path').forEach(p => { p.setAttribute('data-selecionado', 'false'); p.style.fill = p.getAttribute('data-cor-base'); });
    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500";
    const nomeDaCidade = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    cidadeClicadaAtiva = { name: nomeDaCidade || "" }; 
    atualizarTextoTopo(cidadeClicadaAtiva.name);
    
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao);
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) containerBotoes.innerHTML = ""; 
    
    const registroDestaque = info || todosDestaRegiao[0];
    
    if (todosDestaRegiao.length > 1 && containerBotoes) {
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto !== registroDestaque.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                
                let corBorda = "#00713a";
                if (btn.innerText.includes("ZO")) corBorda = "#ff8c00"; 
                else if (btn.innerText.includes("ZL")) corBorda = "#e31c19"; 
                else if (btn.innerText.includes("ZN")) corBorda = "#0054a6"; 
                else if (btn.innerText.includes("ZS")) corBorda = "#d1147e";
                
                btn.style.borderRightColor = corBorda;

                // LÓGICA DE COMPLEXO: Fundo colorido e texto branco
                if (item.categoria === "COMPLEXO") {
                    btn.style.backgroundColor = corBorda;
                    btn.style.color = "#ffffff";
                    btn.classList.add('estilo-complexo');
                }

                btn.onclick = () => clicarNoMapa(pathElement, item, pDataRaw);
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (registroDestaque) exibirDadosResidencial(registroDestaque);
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    if(elDetalhes) elDetalhes.innerHTML = `<p style="margin-top:10px;"><strong>CATEGORIA:</strong> ${info.categoria}</p><p style="color:#50c878; font-weight:bold;">📍 Localidade: ${cidadeClicadaAtiva ? cidadeClicadaAtiva.name.toUpperCase() : ""}</p>`;
}

function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 
    [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem).forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv'; 
        li.innerText = info.nomeCurto.toUpperCase();
        
        let corBorda = "#00713a";
        if (li.innerText.includes("ZO")) corBorda = "#ff8c00"; 
        else if (li.innerText.includes("ZL")) corBorda = "#e31c19"; 
        else if (li.innerText.includes("ZN")) corBorda = "#0054a6"; 
        else if (li.innerText.includes("ZS")) corBorda = "#d1147e";
        
        li.style.borderRightColor = corBorda;
        
        if (info.categoria === "COMPLEXO") { 
            li.style.backgroundColor = corBorda; 
            li.style.color = "#ffffff"; 
            li.classList.add('estilo-complexo');
        }

        li.onclick = () => {
            let p = document.getElementById(info.id);
            if (!p) { trocarMapas(); setTimeout(() => { let np = document.getElementById(info.id); if (np) clicarNoMapa(np, info); }, 200); }
            else clicarNoMapa(p, info);
            toggleMenu(); 
        };
        lista.appendChild(li);
    });
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeClicadaAtiva = null; 
    atualizarTextoTopo(null);
    atualizarVisualizacao();
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    indicador.innerText = (nome || (cidadeClicadaAtiva ? cidadeClicadaAtiva.name : "")).toUpperCase();
}

/* --- Listeners e Eventos --- */

window.onload = carregarPlanilha;
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('webkitfullscreenchange', atualizarIconeFullscreen);

document.addEventListener('click', (e) => {
    const clicouNoMenu = e.target.closest('#btn-menu');
    const clicouNoFull = e.target.closest('#btn-fullscreen');
    const clicouNoMini = e.target.closest('#mapa-minimizado');

    if (clicouNoMenu) toggleMenu();
    if (clicouNoFull) toggleFullscreen();
    if (clicouNoMini) trocarMapas();
});
