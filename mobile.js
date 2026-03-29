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

/* ==========================================================================
   BLOCO 2: AUXILIARES
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
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

/* ==========================================================================
   BLOCO 3: GESTÃO DE DADOS (Z, AA e AB)
   ========================================================================== */
async function carregarPlanilha() {
    try {
        const res = await fetch(`${URL_PLANILHA}&cache_buster=${Date.now()}`);
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
                    endereco: limpar(c[7]),
                    link: limpar(c[16]),
                    descLonga: limpar(c[18]),
                    bookCliente: c[25] ? limpar(c[25]) : "",
                    bookCorretor: c[26] ? limpar(c[26]) : "",
                    videoDecorado: c[27] ? limpar(c[27]) : ""
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* ==========================================================================
   BLOCO 4: INTERFACE E MAPA
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
   BLOCO 5: CLIQUE NO MAPA E VITRINE
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
            if (item.nomeCurto && item.nomeCurto !== ativo.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                const corZona = obterCorPorZona(item);
                if (item.categoria === "COMPLEXO") {
                    btn.classList.add('estilo-complexo');
                    btn.style.backgroundColor = corZona;
                    btn.style.color = "#ffffff";
                } else {
                    btn.style.borderRightColor = corZona;
                    btn.style.backgroundColor = "#ffffff";
                    btn.style.color = "#333";
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
            path.onpointerdown = (e) => { e.stopPropagation(); solicitarFullscreen(); atualizarTextoTopo(pData.name); };
            path.onpointerleave = () => { atualizarTextoTopo(cidadeClicadaAtiva ? cidadeClicadaAtiva.name : null); };
            path.onclick = (e) => { e.stopPropagation(); if (pData.id === "grandesaopaulo") { trocarMapas(); } else if (ehMRV) clicarNoMapa(path, null, pData); };
        }
        g.appendChild(path);
    });
    svg.appendChild(g); container.appendChild(svg);
}

/* ==========================================================================
   BLOCO 7: FICHA TÉCNICA E MAQUIAGEM (Z, AA e AB)
   ========================================================================= */
function trocarMapas() { solicitarFullscreen(); limparSelecaoAnterior(); mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP"; atualizarVisualizacao(); }

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = (info.nomeCurto || "").toUpperCase();
    if (elDetalhes) {
        const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
        const isComplexo = info.categoria === "COMPLEXO";

        // Ajuste de Maquiagem: Linha única e botões menores
        let htmlDesc = (isComplexo && info.descLonga) ? `
            <div style="margin-top: 5px; border-top: 1px solid #444; padding-top: 8px; font-size: 0.68rem; color: #bbb; line-height: 1.3; text-align: justify;">
                ${info.descLonga}
            </div>` : "";

        const criarCard = (titulo, link, icone) => {
            if (!link || link.length < 5) return "";
            return `
                <div style="display: flex; align-items: center; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 6px 10px; gap: 8px; margin-top: 6px;">
                    <span style="font-size: 0.9rem;">${icone}</span>
                    <div style="flex-grow: 1; font-size: 0.68rem; font-weight: bold; color: #333;">${titulo}</div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="window.open('${link}', '_blank')" style="background: #00713a; color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">Abrir</button>
                        <button onclick="copyToClipboard('${link}')" style="background: #ff8c00; color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 0.6rem; font-weight: bold; cursor: pointer;">Copiar</button>
                    </div>
                </div>`;
        };

        let htmlMateriais = "";
        if (isComplexo) {
            const cardBook = criarCard("Book Cliente", info.bookCliente, "📄");
            const cardCorretor = criarCard("Book Corretor", info.bookCorretor, "💼");
            const cardVideo = criarCard("Vídeo do Decorado", info.videoDecorado, "🎬");

            htmlMateriais = (cardBook || cardCorretor || cardVideo) ? `
                <div style="margin-top: 12px; border-top: 1px solid #555; padding-top: 8px;">
                    <div style="font-size: 0.6rem; color: #888; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Materiais de Apoio</div>
                    ${cardBook}
                    ${cardCorretor}
                    ${cardVideo}
                </div>` : "";
        }

        // Maquiagem: Botões Maps e Link menores e linha cinza mais próxima
        elDetalhes.innerHTML = `
            <div style="margin-top: 0px; border-top: 1px solid #00713a; padding-top: 6px;">
                <div style="font-size: 0.65rem; color: #aaa; margin-bottom: 6px;">📍 ${info.endereco || "Não informado"}</div>
                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button onclick="window.open('${linkMaps}', '_blank')" style="width: 65px; height: 24px; padding: 0; background: #4285F4; color: white; border: none; border-radius: 4px; font-size: 0.58rem; font-weight: bold; cursor: pointer;">MAPS</button>
                    <button onclick="copyToClipboard('${info.link}')" style="width: 65px; height: 24px; padding: 0; background: #444; color: white; border: none; border-radius: 4px; font-size: 0.58rem; font-weight: bold; cursor: pointer;">LINK</button>
                </div>
                ${htmlDesc}
                ${htmlMateriais}
            </div>`;
    }
}

/* ==========================================================================
   BLOCO 8: SISTEMA E EVENTOS
   ========================================================================== */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 
    [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem).forEach(info => {
        if (!info.nomeCurto || info.nomeCurto === "Sem Nome") return;
        const li = document.createElement('li');
        li.className = 'menu-item-mrv'; li.innerText = info.nomeCurto.toUpperCase();
        const corZona = obterCorPorZona(info);
        if (info.categoria === "COMPLEXO") { li.classList.add('estilo-complexo'); li.style.backgroundColor = corZona; li.style.color = "#ffffff"; }
        else { li.style.borderRightColor = corZona; }
        li.onclick = (e) => { e.stopPropagation(); toggleMenu(); let p = document.getElementById(info.id); if (!p) { trocarMapas(); setTimeout(() => { let np = document.getElementById(info.id); if (np) clicarNoMapa(np, info); }, 300); } else { clicarNoMapa(p, info); } };
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
