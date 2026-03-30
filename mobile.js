/* ==========================================================================
   js v140.9.4 - FIX: ROLLBACK PARA NOME DA REGIÃO (NÃO DO PRÉDIO)
   ========================================================================== */

const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let regiaoAtivaGeral = null; // Nova variável para memorizar o texto do topo
window.dadosGerais = [];

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const ALTURA_PADRAO = "28px";

/* --- FULLSCREEN --- */
function atualizarIconeFullscreen() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    btn.innerHTML = isFull ? `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>` : `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>`;
}
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('webkitfullscreenchange', atualizarIconeFullscreen);

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
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
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
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    zona: limpar(c[3]).toUpperCase(),
                    nomeCurto: limpar(c[4]),
                    endereco: limpar(c[7]),
                    precosRaw: limpar(c[8]),
                    destaqueCampanha: limpar(c[16]), 
                    link: limpar(c[16]), 
                    descLonga: limpar(c[18]),
                    bookCliente: c[25] ? limpar(c[25]) : "",
                    bookCorretor: c[26] ? limpar(c[26]) : "",
                    videoDecorado: c[27] ? limpar(c[27]) : "",
                    estoque: limpar(c[6]),     
                    entrega: limpar(c[9]),     
                    plantaMin: limpar(c[10]),  
                    plantaMax: limpar(c[11]),  
                    obra: limpar(c[12]),       
                    limitador: limpar(c[13]),  
                    cPaulista: limpar(c[15])   
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro planilha:", e); }
}

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

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
}

/* --- CLIQUE MAPA --- */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    solicitarFullscreen();
    const ehVerde = pathElement.getAttribute('data-cor-base') === "#00713a";
    const nomeDestaRegiao = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');

    // CASO CINZA (SEM LANÇAMENTO)
    if (!ehVerde && !infoSelecionado) {
        atualizarTextoTopo(nomeDestaRegiao);
        setTimeout(() => {
            // Volta para a região que estava ativa anteriormente (ou limpa se não houver)
            atualizarTextoTopo(regiaoAtivaGeral);
        }, 1000); 
        return; 
    }

    // CASO VERDE (COM LANÇAMENTO)
    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.setAttribute('data-selecionado', 'false'); 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });

    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500"; 
    
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a, b) => a.ordem - b.ordem);
    const ativo = infoSelecionado || todosDestaRegiao[0];

    // ATUALIZAÇÃO DA MEMÓRIA:
    if (infoSelecionado) {
        // Se veio do menu ou botões, a "região ativa" passa a ser o nome do residencial
        regiaoAtivaGeral = ativo.nomeCurto;
    } else {
        // Se tocou direto no mapa, a "região ativa" é o nome da cidade/região
        regiaoAtivaGeral = nomeDestaRegiao;
    }
    
    atualizarTextoTopo(regiaoAtivaGeral);

    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto && item.nomeCurto !== (ativo ? ativo.nomeCurto : "")) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                btn.style.height = ALTURA_PADRAO;
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.paddingLeft = "10px";
                btn.style.width = "100%";
                btn.style.fontSize = "0.7rem";
                btn.style.marginBottom = "4px";
                btn.style.borderRadius = "4px";
                btn.style.boxSizing = "border-box";
                
                const corZona = obterCorPorZona(item);
                if (item.categoria === "COMPLEXO") {
                    btn.classList.add('estilo-complexo');
                    btn.style.backgroundColor = corZona; btn.style.color = "#ffffff";
                } else {
                    btn.style.backgroundColor = "#ffffff"; btn.style.color = "#333";
                    btn.style.borderRight = `4px solid ${corZona}`; 
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
            return `<div style="display: flex; align-items: center; background: #fff; border-radius: 4px; padding: 0 10px; gap: 8px; margin-top: 6px; height: ${ALTURA_PADRAO};">
                <span style="font-size: 0.9rem;">${icone}</span>
                <div style="flex-grow: 1; font-size: 0.75rem; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titulo.toUpperCase()}</div>
                <div style="display: flex; gap: 4px;">
                    <button onclick="window.open('${link}', '_blank')" style="background: #00713a; color: white; border: none; border-radius: 4px; padding: 0 8px; height: 20px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">ABRIR</button>
                    <button onclick="copyToClipboard('${link}')" style="background: #ff8c00; color: white; border: none; border-radius: 4px; padding: 0 8px; height: 20px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">COPIAR</button>
                </div>
            </div>`;
        };
        htmlContent += (info.descLonga ? `<div style="font-size:0.82rem; color:#eee; margin-bottom:10px;">${info.descLonga}</div>` : "") + 
                       criarCard("Book Cliente", info.bookCliente, "📄") + criarCard("Book Corretor", info.bookCorretor, "💼");
    } else {
        let htmlCaixaQ = (info.destaqueCampanha && info.destaqueCampanha.trim() !== "") ? `
            <div style="background: #fff; color: #e31c19; height: ${ALTURA_PADRAO}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; border-radius: 4px; margin-bottom: 8px; text-transform: uppercase;">
                ${info.destaqueCampanha}
            </div>` : "";

        const criarCaixaDado = (label, valor) => `
            <div style="background: #444; height: ${ALTURA_PADRAO}; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px;">
                <span style="color: #bbb; font-size: 0.55rem; font-weight: bold;">${label}</span>
                <span style="color: #fff; font-size: 0.72rem; font-weight: bold;">${valor}</span>
            </div>`;

        let htmlGrid6 = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
            ${criarCaixaDado("ENTREGA", info.entrega || "---")}
            ${criarCaixaDado("OBRA", info.obra ? info.obra+'%' : '---')}
            ${criarCaixaDado("PLANTAS", info.plantaMin || "---")}
            ${criarCaixaDado("ESTOQUE", info.estoque || "---")}
            ${criarCaixaDado("LIMITADOR", info.limitador || "---")}
            ${criarCaixaDado("C. PAULISTA", info.cPaulista || "---")}
        </div>`;

        let htmlPrecos = "";
        if (info.precosRaw && info.precosRaw.includes(";")) {
            const blocos = info.precosRaw.split(";");
            let linhasHtml = "";
            blocos.slice(1).forEach(linha => {
                const d = linha.split(",");
                if (d.length >= 4) {
                    linhasHtml += `
                        <div style="display: grid; grid-template-columns: 0.5fr 1.2fr 1fr 1fr; gap: 4px; padding: 6px 0; border-top: 1px solid #555;">
                            <span style="color: #fff; font-weight: 800; font-size: 0.7rem;">${d[0]}</span>
                            <span style="background: #ff8c00; color: #fff; font-weight: 800; font-size: 0.7rem; text-align: center; border-radius: 2px;">${d[1]}</span>
                            <span style="color: #bbb; font-size: 0.6rem; text-align: right;">${d[2]}</span>
                            <span style="color: #bbb; font-size: 0.6rem; text-align: right;">${d[3]}</span>
                        </div>`;
                }
            });
            htmlPrecos = `<div style="background: #444; border-radius: 4px; padding: 8px;">
                <div style="display: grid; grid-template-columns: 0.5fr 1.2fr 1fr 1fr; gap: 4px; margin-bottom: 4px; font-size: 0.5rem; color: #bbb; font-weight: bold;">
                    <span>TIPO</span><span style="text-align: center;">MENOR PREÇO</span><span style="text-align: right;">AVAL.</span><span style="text-align: right;">B. PAG.</span>
                </div>
                ${linhasHtml}
            </div>`;
        }
        htmlContent += htmlCaixaQ + htmlGrid6 + htmlPrecos;
    }
    elDetalhes.innerHTML = htmlContent;
}

/* --- MAPA --- */
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
            path.onclick = (e) => { 
                e.stopPropagation(); 
                if (pData.id === "grandesaopaulo") { trocarMapas(); } 
                else { clicarNoMapa(path, null, pData); } 
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g); container.appendChild(svg);
}

function trocarMapas() { 
    solicitarFullscreen(); 
    regiaoAtivaGeral = null; // Limpa memória ao trocar mapa
    limparSelecaoAnterior(); 
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP"; 
    atualizarVisualizacao(); 
}

function limparSelecaoAnterior() {
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

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

/* --- MENU --- */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 
    [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem).forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv';
        li.innerText = info.nomeCurto.toUpperCase();
        li.style.height = ALTURA_PADRAO;
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginLeft = "-10px";
        li.style.paddingLeft = "25px";
        li.style.width = "calc(100% + 10px)";
        li.style.fontSize = "0.75rem";
        li.style.marginBottom = "4px";
        li.style.borderRadius = "4px";
        const corZona = obterCorPorZona(info);
        if (info.categoria === "COMPLEXO") { 
            li.classList.add('estilo-complexo'); li.style.backgroundColor = corZona; li.style.color = "#ffffff";
        } else { 
            li.style.backgroundColor = "#ffffff"; li.style.color = "#333"; li.style.borderRight = `5px solid ${corZona}`; 
        }
        li.onclick = (e) => { 
            e.stopPropagation(); 
            solicitarFullscreen();
            let p = document.getElementById(info.id); 
            if (!p) { trocarMapas(); setTimeout(() => { let np = document.getElementById(info.id); if (np) clicarNoMapa(np, info); }, 300); } 
            else { clicarNoMapa(p, info); } 
        };
        lista.appendChild(li);
    });
}

function toggleMenu() { 
    solicitarFullscreen(); 
    const menu = document.getElementById('menu-lateral'); 
    if(menu) { 
        menu.classList.toggle('menu-aberto'); 
        menu.classList.toggle('menu-oculto'); 
    } 
}

function copyToClipboard(text) { if(!text || text === "#") return alert("Link indisponível"); navigator.clipboard.writeText(text).then(() => alert("Copiado!")); }

window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) { e.stopPropagation(); toggleMenu(); }
    if (e.target.closest('#btn-fullscreen')) { e.stopPropagation(); alternarFullscreen(); }
    if (e.target.closest('#mapa-minimizado')) { e.stopPropagation(); trocarMapas(); }
});
