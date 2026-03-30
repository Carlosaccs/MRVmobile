/* ==========================================================================
   js v140.9.9 - FIX: TOPO POR REGIÃO + ESTOQUE + PLANTAS (K até L)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let regiaoAtivaGeral = null; 
window.dadosGerais = [];

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const ALTURA_PADRAO = "28px";

function obterNomeZona(sigla) {
    const s = sigla ? sigla.trim().toUpperCase() : "";
    switch(s) {
        case "ZO": return "Z. OESTE";
        case "ZL": return "Z. LESTE";
        case "ZN": return "Z. NORTE";
        case "ZS": return "Z. SUL";
        case "C":  return "CENTRO";
        default: return ""; 
    }
}

/* --- FULLSCREEN --- */
function atualizarIconeFullscreen() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    btn.innerHTML = isFull ? `<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>` : `<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
}
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);

function solicitarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

function alternarFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) solicitarFullscreen();
    else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

/* --- DADOS --- */
async function carregarPlanilha() {
    try {
        const res = await fetch(`${URL_PLANILHA}&cache_buster=${Date.now()}`);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 17) { 
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                const nomeRes = limpar(c[4]);
                if (nomeRes !== "") {
                    window.dadosGerais.push({
                        id: limpar(c[0]).toLowerCase(),
                        categoria: limpar(c[1]).toUpperCase(),
                        ordem: parseInt(limpar(c[2])) || 9999,
                        zona: limpar(c[3]).toUpperCase(),
                        nomeCurto: nomeRes,
                        endereco: limpar(c[7]),
                        precosRaw: limpar(c[8]),
                        destaqueCampanha: limpar(c[16]), 
                        link: limpar(c[16]), 
                        descLonga: limpar(c[18]),
                        bookCliente: limpar(c[25] || ""),
                        bookCorretor: limpar(c[26] || ""),
                        estoque: limpar(c[6]),     
                        entrega: limpar(c[9]),     
                        plantaMin: limpar(c[10]),  
                        plantaMax: limpar(c[11]),  
                        obra: limpar(c[12]),       
                        limitador: limpar(c[13]),  
                        cPaulista: limpar(c[15])   
                    });
                }
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro planilha:", e); }
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) {
        indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
    }
}

/* --- CLIQUE MAPA --- */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    solicitarFullscreen();
    const nomePath = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    
    // Define o nome da Região/Cidade no topo (nunca o nome do residencial)
    regiaoAtivaGeral = nomePath;
    atualizarTextoTopo(regiaoAtivaGeral);

    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.setAttribute('data-selecionado', 'false'); 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });

    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500"; 
    
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a, b) => a.ordem - b.ordem);
    const ativo = infoSelecionado || todosDestaRegiao[0];

    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto !== (ativo ? ativo.nomeCurto : "")) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                const corZona = (item.zona === "ZO") ? "#ff8c00" : (item.zona === "ZL") ? "#e31c19" : (item.zona === "ZN") ? "#0054a6" : (item.zona === "ZS") ? "#d1147e" : "#00713a";
                btn.innerHTML = `<span>${item.nomeCurto.toUpperCase()}</span><span style="opacity: 0.7; font-size: 0.6rem;">${obterNomeZona(item.zona)}</span>`;
                btn.style.cssText = `height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:space-between; padding:0 10px; font-size:0.7rem; margin-bottom:4px; border-radius:4px; cursor:pointer;`;
                
                if (item.categoria === "COMPLEXO") {
                    btn.style.backgroundColor = corZona; btn.style.color = "#fff";
                } else {
                    btn.style.backgroundColor = "#fff"; btn.style.color = "#333"; btn.style.borderRight = `4px solid ${corZona}`;
                }
                btn.onclick = (e) => { e.stopPropagation(); clicarNoMapa(pathElement, item, pDataRaw); };
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (ativo) exibirDadosResidencial(ativo);
}

/* --- FICHA TÉCNICA --- */
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    // Plantas K + L
    const plantasTxt = (info.plantaMin && info.plantaMax) ? `${info.plantaMin} até ${info.plantaMax}` : (info.plantaMin || "---");
    
    // Lógica Estoque
    let estHtml = "";
    const eVal = info.estoque ? info.estoque.trim() : "";
    const eNum = parseInt(eVal);
    if (eVal === "" || eVal === null) estHtml = "---";
    else if (eVal === "-") estHtml = "CONSULTAR";
    else if (eNum === 0) estHtml = `<span style="text-decoration:line-through; color:#bbb;">VENDIDO</span>`;
    else if (eNum < 5) estHtml = `<span style="color:#e31c19;">APENAS ${eNum} UN.</span>`;
    else estHtml = `RESTAM ${eNum} UN.`;

    const criarCaixa = (label, valor) => `<div style="background:#444; height:${ALTURA_PADRAO}; border-radius:4px; display:flex; align-items:center; justify-content:space-between; padding:0 8px;"><span style="color:#bbb; font-size:0.55rem; font-weight:bold;">${label}</span><span style="color:#fff; font-size:0.72rem; font-weight:bold;">${valor}</span></div>`;

    let htmlMain = `
        <div style="font-size:0.82rem; color:#fff; margin-bottom:12px; font-weight:bold;">📍 ${info.endereco}</div>
        <div style="display:flex; gap:8px; margin-bottom:15px;">
            <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}','_blank')" style="width:70px; height:${ALTURA_PADRAO}; background:#4285F4; color:#fff; border:none; border-radius:4px; font-weight:800; cursor:pointer; font-size:0.7rem;">MAPS</button>
            <button onclick="copyToClipboard('${info.link}')" style="width:70px; height:${ALTURA_PADRAO}; background:#444; color:#fff; border:none; border-radius:4px; font-weight:800; cursor:pointer; font-size:0.7rem;">LINK</button>
        </div>`;

    if (info.categoria !== "COMPLEXO") {
        const camp = (info.destaqueCampanha) ? `<div style="background:#fff; color:#e31c19; height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.75rem; border-radius:4px; margin-bottom:8px;">${info.destaqueCampanha.toUpperCase()}</div>` : "";
        htmlMain += camp + `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
            ${criarCaixa("ENTREGA", info.entrega || "---")}
            ${criarCaixa("OBRA", info.obra ? info.obra+'%' : '---')}
            ${criarCaixa("PLANTAS", plantasTxt)}
            ${criarCaixa("ESTOQUE", estHtml)}
            ${criarCaixa("LIMITADOR", info.limitador || "---")}
            ${criarCaixa("C. PAULISTA", info.cPaulista || "---")}
        </div>`;
    }
    elDetalhes.innerHTML = htmlMain;
}

/* --- SISTEMA --- */
function desenharMapa(dados, targetId, ehMin) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;
    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    if (!ehMin) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight; svg.style.marginLeft = conf.marginLeft; svg.style.transform = `scale(${conf.scale})`;
    }
    const g = document.createElementNS(svgNS, "g");
    if(dados.transform) g.setAttribute("transform", dados.transform);
    dados.paths.forEach(p => {
        const path = document.createElementNS(svgNS, "path");
        const idL = p.id.toLowerCase();
        const ehMRV = p.class === "commrv" || window.dadosGerais.some(d => d.id === idL);
        path.setAttribute("d", p.d);
        path.setAttribute("id", (ehMin ? 'mini-' : '') + p.id);
        path.setAttribute('data-name', p.name || p.id);
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase; path.style.stroke = "#fff"; path.style.strokeWidth = (ehMin || !ehMRV) ? "0" : "1.2";
        path.setAttribute('data-cor-base', corBase);
        if (!ehMin) path.onclick = (e) => { e.stopPropagation(); if (p.id === "grandesaopaulo") trocarMapas(); else clicarNoMapa(path, null, p); };
        g.appendChild(path);
    });
    svg.appendChild(g); container.appendChild(svg);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    regiaoAtivaGeral = null;
    atualizarVisualizacao();
    atualizarTextoTopo(null);
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = "";
    [...window.dadosGerais].sort((a,b)=>a.ordem-b.ordem).forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv';
        const corZona = (info.zona === "ZO") ? "#ff8c00" : (info.zona === "ZL") ? "#e31c19" : (info.zona === "ZN") ? "#0054a6" : (info.zona === "ZS") ? "#d1147e" : "#00713a";
        li.innerHTML = `<span>${info.nomeCurto.toUpperCase()}</span><span style="opacity:0.7; font-size:0.6rem;">${obterNomeZona(info.zona)}</span>`;
        li.style.cssText = `height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:space-between; padding-left:25px; width:calc(100% + 10px); font-size:0.75rem; margin-bottom:4px; border-radius:4px; cursor:pointer; margin-left:-10px;`;
        if (info.categoria === "COMPLEXO") { li.style.backgroundColor = corZona; li.style.color = "#fff"; }
        else { li.style.backgroundColor = "#fff"; li.style.color = "#333"; li.style.borderRight = `5px solid ${corZona}`; }
        
        li.onclick = (e) => {
            e.stopPropagation();
            let p = document.getElementById(info.id);
            if (!p) { trocarMapas(); setTimeout(() => { let np = document.getElementById(info.id); if(np) clicarNoMapa(np, info); }, 350); }
            else clicarNoMapa(p, info);
        };
        lista.appendChild(li);
    });
}

function toggleMenu() { 
    const m = document.getElementById('menu-lateral'); 
    if(m) { m.classList.toggle('menu-aberto'); m.classList.toggle('menu-oculto'); } 
}

function copyToClipboard(t) { if(!t || t==="#") return alert("Link indisponível"); navigator.clipboard.writeText(t).then(()=>alert("Copiado!")); }

window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#btn-fullscreen')) alternarFullscreen();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
