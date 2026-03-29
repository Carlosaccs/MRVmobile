/* ==========================================================================
   js v140.7.8 - CONEXÃO REAL COM PLANILHA (COLUNAS J, M, K, L, G, N, P)
   ========================================================================== */

/* ==========================================================================
   BLOCO 1: CONFIGURAÇÕES E VARIÁVEIS
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.dadosGerais = [];

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const ALTURA_PADRAO = "28px";

/* ==========================================================================
   BLOCO 2: AUXILIARES E FULLSCREEN
   ========================================================================== */
function obterCorPorZona(info) {
    const z = info.zona ? info.zona.trim().toUpperCase() : "";
    switch(z) {
        case "ZO": return "#ff8c00";
        case "ZL": return "#e31c19";
        case "ZN": return "#0054a6";
        case "ZS": return "#d1147e";
        default: return "#00713a";
    }
}

function solicitarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

function alternarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

/* ==========================================================================
   BLOCO 3: GESTÃO DE DADOS (MAPEAMENTO DE COLUNAS)
   ========================================================================== */
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
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    zona: limpar(c[3]).toUpperCase(),
                    nomeCurto: limpar(c[4]),
                    endereco: limpar(c[7]),
                    destaqueCampanha: limpar(c[16]), 
                    link: limpar(c[16]), 
                    descLonga: limpar(c[18]),
                    bookCliente: c[25] ? limpar(c[25]) : "",
                    bookCorretor: c[26] ? limpar(c[26]) : "",
                    videoDecorado: c[27] ? limpar(c[27]) : "",
                    
                    // NOVOS CAMPOS CONECTADOS
                    estoque: limpar(c[6]),     // Coluna G (índice 6)
                    entrega: limpar(c[9]),     // Coluna J (índice 9)
                    plantaMin: limpar(c[10]),  // Coluna K (índice 10)
                    plantaMax: limpar(c[11]),  // Coluna L (índice 11)
                    obra: limpar(c[12]),       // Coluna M (índice 12)
                    limitador: limpar(c[13]),  // Coluna N (índice 13)
                    cPaulista: limpar(c[15])   // Coluna P (índice 15)
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* ==========================================================================
   BLOCO 4: INTERFACE E TEXTOS
   ========================================================================== */
function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
}

function limparSelecaoAnterior() {
    cidadeClicadaAtiva = null;
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.setAttribute('data-selecionado', 'false');
        p.style.fill = p.getAttribute('data-cor-base');
    });
    const vitrine = document.getElementById('container-vitrine-botoes');
    if (vitrine) vitrine.innerHTML = "";
    if (document.getElementById('nome-imovel')) document.getElementById('nome-imovel').innerText = "";
    if (document.getElementById('detalhes-imovel')) document.getElementById('detalhes-imovel').innerHTML = "";
    atualizarTextoTopo(null);
}

/* ==========================================================================
   BLOCO 5: CLIQUE NO MAPA E VITRINE (28px E ALINHAMENTO)
   ========================================================================== */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    solicitarFullscreen();
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.setAttribute('data-selecionado', 'false'); 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });
    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500"; 
    
    const nomeDaCidade = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    cidadeClicadaAtiva = { name: (nomeDaCidade || "").toUpperCase() }; 
    atualizarTextoTopo(cidadeClicadaAtiva.name);
    
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a, b) => a.ordem - b.ordem);
    const ativo = infoSelecionado || todosDestaRegiao[0];
    
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto && item.nomeCurto !== (ativo ? ativo.nomeCurto : "")) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                
                // NOVO DESIGN E ALINHAMENTO (4px e alinhamento total)
                btn.style.height = ALTURA_PADRAO;
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.padding = "0 8px"; // Padding interno menor
                btn.style.fontSize = "0.7rem";
                btn.style.margin = "0"; // Zera as margens para alinhamento perfeito
                btn.style.marginBottom = "4px";
                btn.style.borderRadius = "4px"; // Mesmo arredondamento dos cinzas
                btn.style.width = "100%"; // Ocupa todo o espaço para alinhar no fim
                
                const corZona = obterCorPorZona(item);
                if (item.categoria === "COMPLEXO") {
                    btn.classList.add('estilo-complexo');
                    btn.style.backgroundColor = corZona;
                    btn.style.color = "#ffffff";
                    btn.style.border = "none";
                } else {
                    btn.style.backgroundColor = "#ffffff";
                    btn.style.color = "#333";
                    btn.style.border = "none";
                    // TARJA LATERAL DIREITA (PRESERVADA)
                    btn.style.borderRight = `4px solid ${corZona}`; 
                    btn.style.borderRightColor = corZona; // Garante a cor
                }
                btn.onclick = (e) => { e.stopPropagation(); clicarNoMapa(pathElement, item, pDataRaw); };
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (ativo) exibirDadosResidencial(ativo);
}

/* ==========================================================================
   BLOCO 6: DESENHO DO SVG (MAPA)
   ========================================================================== */
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;
    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight; svg.style.marginLeft = conf.marginLeft; svg.style.transform = `scale(${conf.scale})`;
    }
    const g = document.createElementNS(svgNS, "g");
    if(dados.transform) g.setAttribute("transform", dados.transform);
    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const ehMRV = pData.class === "commrv" || window.dadosGerais.some(d => d.id === idLimpo);
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.setAttribute('data-name', pData.name || pData.id);
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase; path.style.stroke = "#ffffff"; path.style.strokeWidth = (ehMinimizado || !ehMRV) ? "0" : "1.2";
        path.setAttribute('data-cor-base', corBase);
        if (!ehMinimizado) {
            path.onclick = (e) => { e.stopPropagation(); if (pData.id === "grandesaopaulo") { trocarMapas(); } else if (ehMRV) clicarNoMapa(path, null, pData); };
        }
        g.appendChild(path);
    });
    svg.appendChild(g); container.appendChild(svg);
}

function trocarMapas() { solicitarFullscreen(); limparSelecaoAnterior(); mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP"; atualizarVisualizacao(); }

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

/* ==========================================================================
   BLOCO 7: FICHA TÉCNICA (LÓGICA DE ESTOQUE E EXIBIÇÃO)
   ========================================================================= */
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = (info.nomeCurto || "").toUpperCase();
    if (!elDetalhes) return;

    const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
    const isComplexo = info.categoria === "COMPLEXO";

    let htmlContent = `
        <div style="margin-top: 0px;">
            <div style="font-size: 0.82rem; color: #ffffff; margin-bottom: 12px; font-weight: bold; line-height: 1.3;">
                📍 ${info.endereco || "Não informado"}
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                <button onclick="window.open('${linkMaps}', '_blank')" style="width: 70px; height: ${ALTURA_PADRAO}; background: #4285F4; color: white; border: none; border-radius: 4px; font-size: 0.72rem; font-weight: 800; cursor: pointer;">MAPS</button>
                <button onclick="copyToClipboard('${info.link}')" style="width: 70px; height: ${ALTURA_PADRAO}; background: #444; color: white; border: none; border-radius: 4px; font-size: 0.72rem; font-weight: 800; cursor: pointer;">LINK</button>
            </div>
        </div>`;

    if (isComplexo) {
        const criarCard = (titulo, link, icone) => {
            if (!link || link.length < 5) return "";
            return `
                <div style="display: flex; align-items: center; background: #fff; border-radius: 4px; padding: 0 10px; gap: 8px; margin-top: 6px; height: ${ALTURA_PADRAO};">
                    <span style="font-size: 0.9rem;">${icone}</span>
                    <div style="flex-grow: 1; font-size: 0.75rem; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titulo.toUpperCase()}</div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="window.open('${link}', '_blank')" style="background: #00713a; color: white; border: none; border-radius: 4px; padding: 0 8px; height: 20px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">ABRIR</button>
                        <button onclick="copyToClipboard('${link}')" style="background: #ff8c00; color: white; border: none; border-radius: 4px; padding: 0 8px; height: 20px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">COPIAR</button>
                    </div>
                </div>`;
        };
        let htmlDesc = info.descLonga ? `<div style="margin-top: 10px; font-size: 0.82rem; color: #eee; line-height: 1.4; text-align: justify; margin-bottom: 10px;">${info.descLonga}</div>` : "";
        let cards = criarCard("Book Cliente", info.bookCliente, "📄") + criarCard("Book Corretor", info.bookCorretor, "💼") + criarCard("Vídeo Decorado", info.videoDecorado, "🎬");
        htmlContent += htmlDesc + (cards ? `<div style="margin-top: 5px;">${cards}</div>` : "");
    } else {
        let htmlCaixaQ = (info.destaqueCampanha && info.destaqueCampanha.trim() !== "") ? `
            <div style="background: #fff; color: #e31c19; height: ${ALTURA_PADRAO}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; border-radius: 4px; margin-bottom: 8px; text-transform: uppercase; padding: 0 5px; text-align: center;">
                ${info.destaqueCampanha}
            </div>` : "";

        const criarCaixaDado = (label, valorHtml) => `
            <div style="background: #444; height: ${ALTURA_PADRAO}; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; box-sizing: border-box;">
                <span style="color: #bbb; font-size: 0.55rem; font-weight: bold; text-transform: uppercase;">${label}</span>
                <div style="flex-grow: 1; text-align: right; display: flex; justify-content: flex-end;">${valorHtml}</div>
            </div>`;

        // --- LÓGICA DE TRATAMENTO DO ESTOQUE ---
        let estoqueHtml = "";
        const estValue = info.estoque ? info.estoque.toString().trim() : "";
        const estNum = parseInt(estValue);

        if (estValue === "" || estValue === null) {
            estoqueHtml = ""; // Não escreve nada
        } else if (estValue === "-") {
            estoqueHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">CONSULTAR</span>`;
        } else if (estNum === 0) {
            estoqueHtml = `<span style="color: #bbb; font-size: 0.72rem; font-weight: bold; text-decoration: line-through;">VENDIDO</span>`;
        } else if (estNum < 5) {
            estoqueHtml = `<span style="color: #e31c19; font-size: 0.72rem; font-weight: bold;">APENAS ${estNum} UN.</span>`;
        } else {
            estoqueHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">RESTAM ${estNum} UN.</span>`;
        }

        // Outras formatações
        const textoObra = info.obra ? `${info.obra}%` : "---";
        const valorObraHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${textoObra}</span>`;
        
        const textoPlantas = (info.plantaMin && info.plantaMax) ? `${info.plantaMin} ATÉ ${info.plantaMax}` : (info.plantaMin || "---");
        const valorPlantasHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${textoPlantas}</span>`;

        const valorEntregaHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${info.entrega || "---"}</span>`;
        const valorLimitadorHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${info.limitador || "---"}</span>`;
        const valorCPaulistaHtml = `<span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${info.cPaulista || "---"}</span>`;

        let htmlGrid6 = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${criarCaixaDado("ENTREGA", valorEntregaHtml)}
                ${criarCaixaDado("OBRA", valorObraHtml)}
                ${criarCaixaDado("PLANTAS", valorPlantasHtml)}
                ${criarCaixaDado("ESTOQUE", estoqueHtml)}
                ${criarCaixaDado("LIMITADOR", valorLimitadorHtml)}
                ${criarCaixaDado("C. PAULISTA", valorCPaulistaHtml)}
            </div>`;

        htmlContent += htmlCaixaQ + htmlGrid6;
    }
    elDetalhes.innerHTML = htmlContent;
}

/* ==========================================================================
   BLOCO 8: MENU LATERAL E EVENTOS (PADRONIZAÇÃO DESIGN)
   ========================================================================== */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 
    [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem).forEach(info => {
        if (!info.nomeCurto) return;
        const li = document.createElement('li');
        li.className = 'menu-item-mrv';
        li.innerText = info.nomeCurto.toUpperCase();
        
        // PADRONIZAÇÃO DESIGN NO MENU
        li.style.height = ALTURA_PADRAO;
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.padding = "0 8px";
        li.style.fontSize = "0.75rem";
        li.style.marginBottom = "4px";
        li.style.borderRadius = "4px"; // Mesmo arredondamento dos cinzas
        li.style.border = "none"; // Remove bordas antigas

        const corZona = obterCorPorZona(info);
        if (info.categoria === "COMPLEXO") { 
            li.classList.add('estilo-complexo'); 
            li.style.backgroundColor = corZona; 
            li.style.color = "#ffffff";
        } else { 
            li.style.backgroundColor = "#ffffff";
            li.style.color = "#333";
            // TARJA LATERAL DIREITA (PRESERVADA)
            li.style.borderRight = `5px solid ${corZona}`; 
        }
        
        li.onclick = (e) => { 
            e.stopPropagation(); 
            toggleMenu(); 
            let p = document.getElementById(info.id); 
            if (!p) { 
                trocarMapas(); 
                setTimeout(() => { let np = document.getElementById(info.id); if (np) clicarNoMapa(np, info); }, 300); 
            } else { 
                clicarNoMapa(p, info); 
            } 
        };
        lista.appendChild(li);
    });
}

function toggleMenu() { solicitarFullscreen(); const menu = document.getElementById('menu-lateral'); if(menu) { menu.classList.toggle('menu-aberto'); menu.classList.toggle('menu-oculto'); } }
function copyToClipboard(text) { if(!text || text === "#") return alert("Link indisponível"); navigator.clipboard.writeText(text).then(() => alert("Copiado!")); }

window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) { e.stopPropagation(); toggleMenu(); }
    if (e.target.closest('#btn-fullscreen')) { e.stopPropagation(); alternarFullscreen(); }
    if (e.target.closest('#mapa-minimizado')) { e.stopPropagation(); trocarMapas(); }
});
