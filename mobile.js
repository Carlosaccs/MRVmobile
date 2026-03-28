/* ==========================================================================
   BLOCO 1: VARIÁVEIS E CARREGAMENTO DA PLANILHA
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
                    cPaulista: limpar(c[15]),
                    link: limpar(c[16]),
                    descricao: limpar(c[17])
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* ==========================================================================
   BLOCO 2: AUXILIARES E TEXTOS
   ========================================================================== */
function obterCorPorZona(info) {
    const z = info.zona ? info.zona.trim().toUpperCase() : "";
    switch(z) {
        case "ZO": return "#ff8c00"; case "ZL": return "#e31c19";
        case "ZN": return "#0054a6"; case "ZS": return "#d1147e";
        default: return "#00713a";
    }
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
}

function limparSelecaoAnterior() {
    cidadeClicadaAtiva = null;
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.style.fill = p.getAttribute('data-cor-base');
    });
    const vitrine = document.getElementById('container-vitrine-botoes');
    if (vitrine) vitrine.innerHTML = "";
    const elNome = document.getElementById('nome-imovel');
    if (elNome) elNome.innerText = "";
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elDetalhes) elDetalhes.innerHTML = "<p>Toque em uma cidade para ver os detalhes.</p>";
    atualizarTextoTopo(null);
}

/* ==========================================================================
   BLOCO 3: INTERAÇÃO (MAPA -> FICHA TÉCNICA)
   ========================================================================== */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    
    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });
    
    pathElement.style.fill = "#FF4500"; 
    const nomeDaCidade = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    cidadeClicadaAtiva = { name: (nomeDaCidade || "").toUpperCase() }; 
    atualizarTextoTopo(cidadeClicadaAtiva.name);
    
    const todosDestaRegiao = window.dadosGerais
        .filter(d => d.id === idRegiao)
        .sort((a, b) => a.ordem - b.ordem);

    const ativo = infoSelecionado || todosDestaRegiao[0];
    
    // Gerar botões da Vitrine (os outros residenciais da cidade)
    const vitrine = document.getElementById('container-vitrine-botoes');
    if (vitrine) {
        vitrine.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto !== ativo.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                if (item.categoria === "COMPLEXO") btn.classList.add('estilo-complexo');
                btn.innerText = item.nomeCurto.toUpperCase();
                btn.style.borderRightColor = obterCorPorZona(item);
                btn.onclick = (e) => { e.stopPropagation(); clicarNoMapa(pathElement, item, pDataRaw); };
                vitrine.appendChild(btn);
            }
        });
    }

    if (ativo) exibirDadosResidencial(ativo);
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    if(elDetalhes) {
        elDetalhes.innerHTML = `
            <div style="margin-bottom: 8px; font-size: 0.72rem; color: #ccc;">📍 ${info.endereco || ""}</div>
            <div class="container-acoes-grid">
                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}','_blank')" class="btn-acao btn-maps">MAPS</button>
                <button onclick="copyToClipboard('${info.link}')" class="btn-acao btn-link">LINK</button>
            </div>
            <div class="grid-dados-imovel">
                <div class="caixa-dado-mrv"><span>ENTREGA</span><b>${info.entrega}</b></div>
                <div class="caixa-dado-mrv"><span>OBRA</span><b>${info.obra}%</b></div>
                <div class="caixa-dado-mrv"><span>ESTOQUE</span><b>${info.estoque}</b></div>
                <div class="caixa-dado-mrv"><span>C. PAUL.</span><b>${info.cPaulista}</b></div>
                <div class="caixa-dado-mrv"><span>PLANTAS</span><b>${info.plantaMin}</b></div>
                <div class="caixa-dado-mrv"><span>LIMIT.</span><b>${info.limitador}</b></div>
            </div>
            <div id="texto-descricao" style="margin-top: 12px; font-size: 0.8rem;">${info.descricao || ""}</div>
        `;
    }
}

/* ==========================================================================
   BLOCO 4: RENDERIZAÇÃO E NAVEGAÇÃO DO MAPA
   ========================================================================== */
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
        const ehMRV = window.dadosGerais.some(d => d.id === idLimpo);
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.setAttribute('data-cor-base', corBase);
        path.style.stroke = "#fff";
        path.style.strokeWidth = "1";

        if (!ehMinimizado) {
            path.onclick = (e) => { 
                e.stopPropagation();
                if (ehMRV) clicarNoMapa(path, null, pData);
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function trocarMapas() { 
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
    window.dadosGerais.sort((a,b) => a.ordem - b.ordem).forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv';
        if (info.categoria === "COMPLEXO") li.classList.add('estilo-complexo');
        li.innerText = info.nomeCurto.toUpperCase();
        li.style.borderRightColor = obterCorPorZona(info);
        li.onclick = () => { toggleMenu(); /* Aqui você chamaria a função de clique no mapa se necessário */ };
        lista.appendChild(li);
    });
}

/* ==========================================================================
   BLOCO 5: SISTEMA (MENU, FULLSCREEN E CLIQUES)
   ========================================================================== */
function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        menu.classList.toggle('menu-aberto');
        menu.classList.toggle('menu-oculto');
    }
}

function alternarFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        document.exitFullscreen();
    }
}

function copyToClipboard(text) { 
    if(!text || text === "#") return alert("Link não disponível"); 
    navigator.clipboard.writeText(text).then(() => alert("Copiado!")); 
}

// Escutador de Cliques Unificado
document.addEventListener('click', (e) => {
    // Busca o elemento clicado ou seus pais que tenham os IDs
    const btnMenu = e.target.closest('#btn-menu');
    const btnFull = e.target.closest('#btn-fullscreen');
    const btnMinimapa = e.target.closest('#mapa-minimizado');

    if (btnMenu) {
        e.stopPropagation();
        toggleMenu();
    } else if (btnFull) {
        e.stopPropagation();
        alternarFullscreen();
    } else if (btnMinimapa) {
        e.stopPropagation();
        trocarMapas();
    }
});

window.onload = carregarPlanilha;
