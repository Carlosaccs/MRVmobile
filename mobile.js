/* ==========================================================================
   BLOCO 1: CONFIGURAÇÕES INICIAIS E VARIÁVEIS
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
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

/* ==========================================================================
   BLOCO 3: GESTÃO DE DADOS (PLANILHA)
   ========================================================================== */
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
                    descLonga: limpar(c[18]), // CORRIGIDO: Parentese fechado aqui
                    linkBookCliente: limpar(c[19]),  
                    linkBookCorretor: limpar(c[21]), 
                    materiaisExtras: limpar(c[28])   
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* ==========================================================================
   BLOCO 4: INTERFACE E LIMPEZA
   ========================================================================== */
function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP");
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
    
    const todosDestaRegiao = window.dadosGerais
        .filter(d => d.id === idRegiao)
        .sort((a, b) => a.ordem - b.ordem);

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
                if (ehMRV) clicarNoMapa(path, null, pData);
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

/* ==========================================================================
   BLOCO 7: MATERIAIS DE APOIO (ESTILO DESKTOP NO MOBILE)
   ========================================================================== */
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = (info.nomeCurto || "").toUpperCase();
    if (!elDetalhes) return;

    const criarLinhaMaterial = (titulo, url, icone = "📄") => {
        if (!url || url === "#" || url === "" || url === "---") return "";
        const urlSegura = url.includes('drive.google.com') ? url.replace(/\/view.*|\/edit.*/, '/preview') : url;

        return `
            <div style="background: #fff; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                    <span style="font-size: 1.1rem;">${icone}</span>
                    <span style="font-size: 0.72rem; color: #333; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titulo}</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="window.open('${urlSegura}', '_blank')" style="background: #00713a; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: pointer;">ABRIR</button>
                    <button onclick="copyToClipboard('${urlSegura}')" style="background: #ff8c00; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: pointer;">COPIAR</button>
                </div>
            </div>`;
    };

    let htmlMateriaisExtras = "";
    if (info.materiaisExtras && info.materiaisExtras !== "---") {
        info.materiaisExtras.split(';').forEach(par => {
            const dados = par.split(',');
            if (dados.length === 2) {
                htmlMateriaisExtras += criarLinhaMaterial(dados[0].trim(), dados[1].trim(), "🎬");
            }
        });
    }

    const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
    const eComplexo = info.categoria === "COMPLEXO";

    elDetalhes.innerHTML = `
        <div style="margin-top: 10px; border-top: 1px solid #00713a; padding-top: 8px;">
            <div style="font-size: 0.68rem; color: #cccccc; margin-bottom: 10px;">📍 ${info.endereco || ""}</div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                <button onclick="window.open('${linkMaps}', '_blank')" class="menu-item-mrv" style="width: 70px; height: 32px; background: #4285F4; color: white; border: none; font-size: 0.6rem; display: flex; align-items: center; justify-content: center;">MAPS</button>
                <button onclick="copyToClipboard('${info.link || ""}')" class="menu-item-mrv" style="width: 70px; height: 32px; background: #444; color: white; border: none; font-size: 0.6rem; display: flex; align-items: center; justify-content: center;">LINK</button>
            </div>

            ${eComplexo && info.descLonga ? `<div style="font-size: 0.68rem; color: #bbb; margin-bottom: 15px; text-align: justify; line-height: 1.3;">${info.descLonga}</div>` : ""}

            <div style="margin-top: 15px;">
                <div style="font-size: 0.6rem; color: #aaa; margin-bottom: 8px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Materiais de Apoio</div>
                ${criarLinhaMaterial("Book Cliente", info.linkBookCliente, "📄")}
                ${criarLinhaMaterial("Book Corretor", info.linkBookCorretor, "💼")}
                ${htmlMateriaisExtras}
            </div>
        </div>
    `;
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

        if (String(info.categoria).toUpperCase() === "COMPLEXO") {
            li.classList.add('estilo-complexo');
            li.style.backgroundColor = corZona;
            li.style.color = "#ffffff";
        } else {
            li.style.borderRightColor = corZona;
        }

        li.onclick = (e) => {
            e.stopPropagation();
            toggleMenu();
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

/* ==========================================================================
   BLOCO 8: SISTEMA (MENU, CLIPBOARD E EVENTOS)
   ========================================================================== */
function toggleMenu() {
    solicitarFullscreen();
    const menu = document.getElementById('menu-lateral');
    if(menu) { menu.classList.toggle('menu-aberto'); menu.classList.toggle('menu-oculto'); }
}

function copyToClipboard(text) {
    if(!text || text === "#" || text === "") return alert("Link não disponível");
    navigator.clipboard.writeText(text).then(() => alert("Copiado!"));
}

window.onload = carregarPlanilha;

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) { e.stopPropagation(); toggleMenu(); }
    if (e.target.closest('#btn-fullscreen')) { e.stopPropagation(); alternarFullscreen(); }
    if (e.target.closest('#mapa-minimizado')) { e.stopPropagation(); trocarMapas(); }
});
