/* ==========================================================================
   v140.25 - DASHBOARD MOBILE COMPLETO
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.dadosGerais = [];

// DNAs para o ícone de Fullscreen
const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58054 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// --- FUNÇÕES DE SUPORTE ---
function forcarFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen negado"));
    }
}

function copyToClipboard(text) {
    if(!text || text === "#") return alert("Link não disponível");
    navigator.clipboard.writeText(text).then(() => alert("Link copiado para o WhatsApp!"));
}

// --- BLOCO 3: CARREGAMENTO ---
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 
        
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 15) { 
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                const reg = limpar(c[13]); 
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    nomeCurto: reg ? `${limpar(c[3]) || "Sem Nome"} - ${reg}` : limpar(c[3]) || "Sem Nome",
                    estoque: limpar(c[5]),
                    endereco: limpar(c[6]),
                    entrega: limpar(c[8]),
                    plantaMin: limpar(c[9]),
                    plantaMax: limpar(c[10]),
                    obra: limpar(c[11]),
                    limitador: limpar(c[12]),
                    cPaulista: limpar(c[14]),
                    destaqueVermelho: limpar(c[15]), 
                    link: limpar(c[16]) || "#",     
                    textoColunaR: limpar(c[17]),    
                    regional: reg
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro planilha:", e); }
}

// --- BLOCO 4: VISUALIZAÇÃO ---
function atualizarVisualizacao() {
    const dadosMapa = (mapaAtivo === "GSP") ? window.mapaGSP : window.mapaInterior;
    const mapaMini = (mapaAtivo === "GSP") ? window.mapaInterior : window.mapaGSP;

    desenharMapa(dadosMapa, 'mapa-container', false);
    desenharMapa(mapaMini, 'mapa-minimizado', true);
    
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = (mapaAtivo === "GSP" ? "GRANDE SÃO PAULO" : "INTERIOR SP");
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
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            path.onclick = (e) => { 
                e.stopPropagation();
                forcarFullscreen(); 
                if (ehMRV) clicarNoMapa(path, window.dadosGerais.find(d => d.id === idLimpo), pData); 
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

// --- BLOCO 5: INTERAÇÃO ---
function clicarNoMapa(pathElement, info, pDataRaw = null) {
    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });
    pathElement.style.fill = "#FF4500"; 
    
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a,b) => a.ordem - b.ordem);
    
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) containerBotoes.innerHTML = ""; 
    
    const registroDestaque = info || todosDestaRegiao[0];
    
    if (todosDestaRegiao.length > 1 && containerBotoes) {
        todosDestaRegiao.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'menu-item-mrv';
            btn.style.display = "inline-block";
            btn.style.padding = "4px 8px";
            btn.style.margin = "2px";
            btn.style.fontSize = "10px";
            btn.innerText = item.nomeCurto.split('-')[0].trim().toUpperCase();
            
            if (item.nomeCurto === registroDestaque.nomeCurto) {
                btn.style.background = "#00713a";
                btn.style.color = "white";
            }

            btn.onclick = (e) => { 
                e.stopPropagation(); 
                clicarNoMapa(pathElement, item, pDataRaw); 
            };
            containerBotoes.appendChild(btn);
        });
    }
    if (registroDestaque) exibirDadosResidencial(registroDestaque);
}

// --- BLOCO 6: FICHA TÉCNICA ---
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    if(elDetalhes) {
        let htmlDestaque = "";
        if (info.destaqueVermelho && info.destaqueVermelho !== "") {
            htmlDestaque = `
                <div style="background:#fff5f5; border:1px solid #ffe3e3; color:#e31c19; font-weight:800; text-align:center; padding:5px; margin:8px 0; border-radius:4px; font-size:11px;">
                    ${info.destaqueVermelho.toUpperCase()}
                </div>`;
        }

        const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
        const cssCaixa = `display:flex; justify-content:space-between; align-items:center; background:white; padding:6px 10px; flex:1 1 45%; border:1px solid #eee; border-radius:4px; min-height:30px;`;
        
        elDetalhes.innerHTML = `
            <div style="height:2px; background:#00713a; margin-bottom:10px;"></div>
            <div style="margin-bottom: 10px;">
                <span style="font-size:11px; display:block; color:#444;">📍 ${info.endereco || ""}</span>
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <a href="${linkMaps}" target="_blank" style="background:#4285F4; color:white; padding:8px 0; border-radius:4px; font-size:11px; text-decoration:none; font-weight:bold; flex:1; text-align:center;">MAPS</a>
                    <button onclick="copyToClipboard('${info.link}')" style="background:#333; color:white; padding:8px 0; border-radius:4px; font-size:11px; border:none; cursor:pointer; font-weight:bold; flex:1;">LINK WHATS</button>
                </div>
            </div>

            ${htmlDestaque}

            <div style="display:flex; flex-wrap:wrap; gap:5px; width:100%;">
                <div style="${cssCaixa}"><span style="color:#00713a;font-weight:bold;font-size:9px;">ENTREGA</span><span style="font-weight:800;font-size:11px;">${info.entrega}</span></div>
                <div style="${cssCaixa}"><span style="color:#00713a;font-weight:bold;font-size:9px;">OBRA</span><span style="font-weight:800;font-size:11px;">${info.obra}%</span></div>
                <div style="${cssCaixa}"><span style="color:#00713a;font-weight:bold;font-size:9px;">PLANTAS</span><span style="font-weight:800;font-size:11px;">${info.plantaMin}m²</span></div>
                <div style="${cssCaixa}"><span style="color:#00713a;font-weight:bold;font-size:9px;">ESTOQUE</span><span style="font-weight:800;font-size:11px;">${info.estoque}</span></div>
            </div>

            <div style="color:#333; margin-top:12px; font-size: 11px; text-align:justify; background:#f0f0f0; padding:10px; border-radius:4px; border-left:3px solid #00713a; white-space: pre-line;">
                ${info.textoColunaR || ""}
            </div>
        `;
    }
}

// --- BLOCO 7: MENU LATERAL ---
function gerarMenuResidenciais() {
    const containerMenu = document.getElementById('lista-residenciais');
    if (!containerMenu) return;

    containerMenu.innerHTML = "";
    const filtrados = window.dadosGerais.filter(d => 
        d.id && d.id !== "" && (d.regional === (mapaAtivo === "GSP" ? "GSP" : "INTERIOR"))
    );

    filtrados.sort((a, b) => a.ordem - b.ordem);

    filtrados.forEach(item => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv';
        li.style.listStyle = "none";
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid #eee";
        li.style.fontSize = "12px";
        li.innerText = item.nomeCurto.toUpperCase();

        li.onclick = (e) => {
            e.stopPropagation();
            toggleMenu(); 
            const pathAlvo = document.getElementById(item.id);
            if (pathAlvo) clicarNoMapa(pathAlvo, item);
            else exibirDadosResidencial(item);
        };
        containerMenu.appendChild(li);
    });
}

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        menu.classList.toggle('menu-ativo');
        menu.classList.toggle('menu-oculto');
    }
}

function trocarMapas() {
    forcarFullscreen(); 
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    atualizarVisualizacao();
    gerarMenuResidenciais();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
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

// --- BLOCO 9: INICIALIZAÇÃO ---
window.onload = carregarPlanilha;
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#btn-fullscreen')) toggleFullscreen();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
