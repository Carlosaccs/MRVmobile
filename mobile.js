/* ==========================================================================
   v140.75 - FIX DEFINITIVO: LIMPEZA DE COMPLEXO (Bases Notebook & Mobile)
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

// --- 1. AUXILIARES E FULLSCREEN ---
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
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

// --- 2. GESTÃO DE DADOS ---
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 

        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 18) { 
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    zona: limpar(c[3]).toUpperCase(),
                    nomeCurto: limpar(c[4]),
                    estoque: limpar(c[6]),
                    endereco: limpar(c[7]),
                    entrega: limpar(c[9]),
                    plantaMin: limpar(c[10]),
                    plantaMax: limpar(c[11]),
                    obra: limpar(c[12]),
                    limitador: limpar(c[13]),
                    regional: limpar(c[14]),
                    cPaulista: limpar(c[15]),
                    link: limpar(c[16]),
                    descricao: limpar(c[17]),
                    textoColunaR: limpar(c[18])
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

// --- 3. LÓGICA DE INTERFACE E MAPA ---
function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    if (nome) {
        indicador.innerText = nome.toUpperCase();
    } else {
        indicador.innerText = (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
    }
}

function limparSelecaoAnterior() {
    cidadeClicadaAtiva = null;
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.setAttribute('data-selecionado', 'false');
        p.style.fill = p.getAttribute('data-cor-base');
    });
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if (containerBotoes) containerBotoes.innerHTML = "";
    const elNome = document.getElementById('nome-imovel');
    if (elNome) elNome.innerText = "";
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elDetalhes) elDetalhes.innerHTML = ""; 
    atualizarTextoTopo(null);
}

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
    
    const todosDestaRegiao = window.dadosGerais
        .filter(d => d.id === idRegiao)
        .sort((a, b) => a.ordem - b.ordem);

    const ativo = infoSelecionado || todosDestaRegiao[0];
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto && item.nomeCurto !== "Sem Nome" && item.nomeCurto !== ativo.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv'; 
                btn.innerText = item.nomeCurto.toUpperCase();
                const corZona = obterCorPorZona(item);

                if (item.categoria === "COMPLEXO") {
                    btn.classList.add('estilo-complexo');
                    btn.style.backgroundColor = corZona;
                    btn.style.color = "#ffffff";
                    btn.style.borderRightColor = "rgba(0,0,0,0.2)";
                } else {
                    btn.style.borderRightColor = corZona;
                    btn.style.backgroundColor = "#ffffff";
                    btn.style.color = "#333";
                }

                btn.onclick = (e) => { 
                    e.stopPropagation(); 
                    clicarNoMapa(pathElement, item, pDataRaw); 
                };
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (ativo) exibirDadosResidencial(ativo);
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
        const ehMRV = pData.class === "commrv" || window.dadosGerais.some(d => d.id === idLimpo);
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.setAttribute('data-name', pData.name || pData.id);
        
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = (ehMinimizado || !ehMRV) ? "0" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            path.onpointerdown = (e) => {
                e.stopPropagation();
                solicitarFullscreen();
                atualizarTextoTopo(pData.name);
            };
            path.onpointerleave = () => {
                const nomeVolta = cidadeClicadaAtiva ? cidadeClicadaAtiva.name : null;
                atualizarTextoTopo(nomeVolta);
            };
            path.onclick = (e) => { 
                e.stopPropagation();
                if (pData.id === "grandesaopaulo") { trocarMapas(); return; } 
                if (ehMRV) {
                    clicarNoMapa(path, null, pData);
                } else {
                    atualizarTextoTopo(pData.name);
                    setTimeout(() => {
                        const nomeVolta = cidadeClicadaAtiva ? cidadeClicadaAtiva.name : null;
                        atualizarTextoTopo(nomeVolta);
                    }, 2000);
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function trocarMapas() {
    solicitarFullscreen();
    limparSelecaoAnterior();
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    atualizarVisualizacao();
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
    [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem).forEach(info => {
        if (!info.nomeCurto || info.nomeCurto === "Sem Nome") return;
        const li = document.createElement('li');
        li.className = 'menu-item-mrv'; 
        li.innerText = info.nomeCurto.toUpperCase();
        const corZona = obterCorPorZona(info);
        if (info.categoria === "COMPLEXO") {
            li.classList.add('estilo-complexo');
            li.style.backgroundColor = corZona;
            li.style.color = "#ffffff";
            li.style.borderRightColor = "rgba(0,0,0,0.2)";
        } else {
            li.style.borderRightColor = corZona;
            li.style.backgroundColor = "#ffffff";
            li.style.color = "#333";
        }
        li.onclick = (e) => {
            e.stopPropagation();
            solicitarFullscreen();
            let p = document.getElementById(info.id);
            if (!p) { 
                trocarMapas(); 
                setTimeout(() => { 
                    let np = document.getElementById(info.id); 
                    if (np) clicarNoMapa(np, info); 
                }, 300); 
            } else { 
                clicarNoMapa(p, info); 
            }
        };
        lista.appendChild(li);
    });
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) { elNome.innerText = info.nomeCurto.toUpperCase(); }

    if(elDetalhes) {
        // PARTE 1: Cabeçalho (Sempre aparece)
        let htmlBase = `
            <div class="endereco-texto" style="margin-bottom: 8px; font-size: 0.72rem; color: #ccc;">
                📍 ${info.endereco || "Endereço não disponível"}
            </div>
            <div class="container-acoes-grid">
                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}','_blank')" class="btn-acao btn-maps">MAPS</button>
                <button onclick="copyToClipboard('${info.link}')" class="btn-acao btn-link">LINK</button>
            </div>
        `;

        // PARTE 2: Dados Técnicos (Somente se NÃO for COMPLEXO)
        let htmlTecnico = "";
        if (info.categoria !== "COMPLEXO") {
            htmlTecnico = `
                <div class="grid-dados-imovel">
                    <div class="caixa-dado-mrv"><span>ENTREGA</span><b>${info.entrega}</b></div>
                    <div class="caixa-dado-mrv"><span>OBRA</span><b>${info.obra}%</b></div>
                    <div class="caixa-dado-mrv"><span>ESTOQUE</span><b>${info.estoque}</b></div>
                    <div class="caixa-dado-mrv"><span>C. PAUL.</span><b>${info.cPaulista}</b></div>
                    <div class="caixa-dado-mrv"><span>PLANTAS</span><b>${info.plantaMin}</b></div>
                    <div class="caixa-dado-mrv"><span>LIMIT.</span><b>${info.limitador}</b></div>
                </div>
                <div id="texto-descricao" style="margin-top: 12px; font-size: 0.8rem; color: #efefef;">
                    ${info.descricao || info.textoColunaR || ""}
                </div>
            `;
        }
        elDetalhes.innerHTML = htmlBase + htmlTecnico;
    }
}

function toggleMenu() {
    solicitarFullscreen();
    const menu = document.getElementById('menu-lateral');
    if(menu) { menu.classList.toggle('menu-aberto'); menu.classList.toggle('menu-oculto'); }
}

function copyToClipboard(text) {
    if(!text || text === "#") return alert("Link não disponível");
    navigator.clipboard.writeText(text).then(() => alert("Copiado!"));
}

window.onload = carregarPlanilha;

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
    if (e.target.closest('#btn-fullscreen')) alternarFullscreen();
});
