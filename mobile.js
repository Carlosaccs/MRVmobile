/* ==========================================================================
   v140.18 - DASHBOARD MOBILE: ESTRUTURA RESIDENCIAL COMPLETA (GRADE TÉCNICA)
   ========================================================================== */

// --- BLOCO 1: CONSTANTES E CONFIGURAÇÕES ---
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.dadosGerais = [];

const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58054 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

function forcarFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {
            console.log("Auto-Fullscreen bloqueado.");
        });
    }
}

// --- BLOCO 2: CARREGAMENTO DE DADOS ---
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
                    estoque: limpar(c[5]),      // Coluna F
                    endereco: limpar(c[6]),     // Coluna G
                    entrega: limpar(c[8]),      // Coluna I
                    plantasMin: limpar(c[9]),   // Coluna J
                    plantasMax: limpar(c[10]),  // Coluna K
                    obra: limpar(c[11]),        // Coluna L
                    limitador: limpar(c[12]),   // Coluna M
                    cPaulista: limpar(c[14]),   // Coluna O
                    link: limpar(c[11]),        // Link (Ajuste se necessário)
                    descricao: limpar(c[12]), 
                    textoColunaR: limpar(c[17]),
                    regional: reg
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

// --- BLOCO 3: MAPA E INTERAÇÕES ---
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
        
        const corVerde = "#00713a", corCinza = "#cccccc", corLaranja = "#FF4500", corHoverCinza = "#bbbbbb";
        const corBase = ehMRV ? corVerde : corCinza;
        
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            path.onmouseover = () => { 
                atualizarTextoTopo(pData.name || pData.id); 
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = ehMRV ? corLaranja : corHoverCinza; 
                }
            };
            path.onmouseout = () => { 
                atualizarTextoTopo(cidadeClicadaAtiva ? cidadeClicadaAtiva.name : null); 
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = corBase; 
                }
            };
            path.onclick = (e) => { 
                e.stopPropagation();
                forcarFullscreen();
                if (pData.id === "grandesaopaulo") { trocarMapas(); return; } 

                if (ehMRV) {
                    clicarNoMapa(path, window.dadosGerais.find(d => d.id === idLimpo), pData); 
                } else {
                    const indicador = document.getElementById('identificador-cidade');
                    if (indicador) indicador.innerText = (pData.name || path.getAttribute('data-name')).toUpperCase();
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function clicarNoMapa(pathElement, info, pDataRaw = null) {
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.setAttribute('data-selecionado', 'false'); 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });
    
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
                if (item.categoria === "COMPLEXO") {
                    btn.style.backgroundColor = corBorda;
                    btn.style.color = "#ffffff";
                    btn.classList.add('estilo-complexo');
                }
                btn.onclick = (e) => {
                    e.stopPropagation();
                    forcarFullscreen();
                    clicarNoMapa(pathElement, item, pDataRaw);
                };
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (registroDestaque) exibirDadosResidencial(registroDestaque);
}

// --- BLOCO 4: FICHA TÉCNICA (VITRINE) ---
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    const endereco = info.endereco || "Endereço não cadastrado";
    const linkMaps = `http://googleusercontent.com/maps.google.com/maps?q=${encodeURIComponent(endereco)}`;
    const linkBook = info.link || "#";

    if(elDetalhes) {
        let htmlContent = `
            <div class="divisor-verde"></div>
            <div class="container-acoes">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span class="endereco-texto" style="font-size: 0.9rem;">📍 ${endereco}</span>
                    <div style="display: flex; gap: 5px;">
                        <a href="${linkMaps}" target="_blank" class="btn-acao btn-maps">MAPS</a>
                        <button onclick="copyToClipboard('${linkBook}')" class="btn-acao btn-link">LINK</button>
                    </div>
                </div>
        `;

        if (info.categoria === "RESIDENCIAL") {
            htmlContent += `
                <div class="grid-tecnico">
                    <div class="item-tecnico">
                        <span class="label">ENTREGA</span>
                        <span class="valor">${info.entrega || "-"}</span>
                    </div>
                    <div class="item-tecnico">
                        <span class="label">OBRA</span>
                        <span class="valor">${info.obra || "0%"}</span>
                    </div>
                    <div class="item-tecnico">
                        <span class="label">PLANTAS</span>
                        <span class="valor">${info.plantasMin}m² - ${info.plantasMax}m²</span>
                    </div>
                    <div class="item-tecnico">
                        <span class="label">ESTOQUE</span>
                        <span class="valor">${info.estoque || "CONSULTE"}</span>
                    </div>
                    <div class="item-tecnico">
                        <span class="label">LIMITADOR</span>
                        <span class="valor">${info.limitador || "-"}</span>
                    </div>
                    <div class="item-tecnico">
                        <span class="label">C. PAULISTA</span>
                        <span class="valor">${info.cPaulista || "NÃO"}</span>
                    </div>
                </div>
                <div class="texto-coluna-r" style="margin-top: 15px; font-weight: bold; color: #00713a; font-size: 1.1em;">
                    ${info.textoColunaR || ""}
                </div>
                <div id="texto-descricao" style="margin-top: 10px; line-height: 1.4; color: #333; font-size: 0.95rem;">
                    ${info.descricao || ""}
                </div>
            `;
        } else {
            htmlContent += `
                <div class="texto-coluna-r">${info.textoColunaR || ""}</div>
                <div id="texto-descricao">${info.descricao || ""}</div>
            `;
        }
        htmlContent += `</div>`;
        elDetalhes.innerHTML = htmlContent;
    }
}

// --- BLOCO 5: MENU E UTILITÁRIOS ---
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
            li.style.backgroundColor = corBorda; li.style.color = "#ffffff"; li.classList.add('estilo-complexo');
        }
        li.onclick = (e) => {
            e.stopPropagation();
            forcarFullscreen();
            let p = document.getElementById(info.id);
            if (!p) { 
                trocarMapas(); 
                setTimeout(() => { 
                    let np = document.getElementById(info.id); 
                    if (np) clicarNoMapa(np, info); 
                }, 200); 
            } else clicarNoMapa(p, info);
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
    forcarFullscreen();
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeClicadaAtiva = null; 
    atualizarTextoTopo(null);
    atualizarVisualizacao();
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    indicador.innerText = (nome || "").toUpperCase();
}

function toggleMenu() {
    forcarFullscreen();
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        menu.classList.toggle('menu-aberto');
        menu.classList.toggle('menu-oculto');
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
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

function copyToClipboard(text) {
    if(!text || text === "#") return alert("Link não disponível");
    navigator.clipboard.writeText(text).then(() => alert("Link do Book copiado!"));
}

window.onload = carregarPlanilha;
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#btn-fullscreen')) toggleFullscreen();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
