/* ==========================================================================
   v140.35 - REPARO FINAL: TEXTO DINÂMICO + FULLSCREEN + COLUNA D
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

// --- 1. CORES E TELA CHEIA ---
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

function alternarFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// --- 2. CARREGAMENTO (COLUNA D) ---
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
                const reg = limpar(c[14]); 
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
                    regional: reg,
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

// --- 3. LOGICA DO MAPA E TEXTO ---
function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;

    if (nome) {
        indicador.innerText = nome.toUpperCase();
    } else {
        // Se não houver nome para mostrar, volta para o nome do Mapa
        indicador.innerText = (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
    }
}

function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
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
                btn.style.borderRightColor = obterCorPorZona(item);
                btn.onclick = (e) => { e.stopPropagation(); clicarNoMapa(pathElement, item, pDataRaw); };
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
            // No Mobile, usamos eventos de Pointer para garantir que o texto limpe
            path.onpointerdown = () => {
                atualizarTextoTopo(pData.name);
            };

            path.onclick = (e) => { 
                e.stopPropagation();
                if (pData.id === "grandesaopaulo") { trocarMapas(); return; } 
                if (ehMRV) {
                    clicarNoMapa(path, null, pData);
                } else {
                    // Se clicar num cinza, remove destaque laranja anterior e reseta título
                    cidadeClicadaAtiva = null;
                    document.querySelectorAll('#mapa-container path').forEach(p => {
                        p.setAttribute('data-selecionado', 'false');
                        p.style.fill = p.getAttribute('data-cor-base');
                    });
                    atualizarTextoTopo(null);
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
    
    if (!cidadeClicadaAtiva) atualizarTextoTopo(null);
}

// --- 4. FUNÇÕES DE APOIO ---
function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeClicadaAtiva = null; 
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
        li.style.borderRightColor = obterCorPorZona(info);
        li.onclick = (e) => {
            e.stopPropagation();
            let p = document.getElementById(info.id);
            if (!p) { trocarMapas(); setTimeout(() => { let np = document.getElementById(info.id); if (np) clicarNoMapa(np, info); }, 300); } 
            else { clicarNoMapa(p, info); }
        };
        lista.appendChild(li);
    });
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    if(elDetalhes) {
        elDetalhes.innerHTML = `
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <button onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(info.endereco)}','_blank')" class="btn-acao btn-maps">MAPS</button>
                <button onclick="copyToClipboard('${info.link}')" class="btn-acao btn-link">LINK</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div class="texto-coluna-r">ENTREGA: <b>${info.entrega}</b></div>
                <div class="texto-coluna-r">OBRA: <b>${info.obra}%</b></div>
                <div class="texto-coluna-r">PLANTAS: <b>${info.plantaMin} a ${info.plantaMax}</b></div>
                <div class="texto-coluna-r">ESTOQUE: <b>${info.estoque}</b></div>
                <div class="texto-coluna-r">LIMITADOR: <b>${info.limitador}</b></div>
                <div class="texto-coluna-r">C. PAULISTA: <b>${info.cPaulista}</b></div>
            </div>
        `;
    }
}

function toggleMenu() {
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
    // ESSA É A LINHA QUE ATIVA O BOTÃO DE AMPLIAR/REDUZIR:
    if (e.target.closest('#btn-fullscreen') || e.target.closest('.icon-fullscreen')) alternarFullscreen();
});
