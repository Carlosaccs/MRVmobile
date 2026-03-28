/* ==========================================================================
   v140.3 - DASHBOARD MOBILE: COLUNA D (ZONA) + LIMPEZA DE DADOS
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

// --- 1. FUNÇÃO DE CORES (BASEADA NA NOVA COLUNA D) ---
function obterCorPorZona(info) {
    const z = info.zona ? info.zona.trim().toUpperCase() : "";
    switch(z) {
        case "ZO": return "#ff8c00"; // Laranja
        case "ZL": return "#e31c19"; // Vermelho
        case "ZN": return "#0054a6"; // Azul
        case "ZS": return "#d1147e"; // Rosa/Magenta
        default: return "#00713a";   // Verde (Padrão)
    }
}

// --- 2. CARREGAMENTO COM ÍNDICES RECALIBRADOS (COLUNA D EM DIANTE) ---
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
                    zona: limpar(c[3]).toUpperCase(),           // COLUNA D (Nova)
                    nomeCurto: limpar(c[4]),                     // COLUNA E (Antiga D)
                    estoque: limpar(c[6]),                       // COLUNA G
                    endereco: limpar(c[7]),                      // COLUNA H
                    entrega: limpar(c[9]),                       // COLUNA J
                    plantaMin: limpar(c[10]),                    // COLUNA K
                    plantaMax: limpar(c[11]),                    // COLUNA L
                    obra: limpar(c[12]),                         // COLUNA M
                    limitador: limpar(c[13]),                    // COLUNA N
                    regional: reg,                               // COLUNA O
                    cPaulista: limpar(c[15]),                    // COLUNA P
                    link: limpar(c[16]),                         // COLUNA Q
                    descricao: limpar(c[17]),                    // COLUNA R
                    textoColunaR: limpar(c[18])                   // COLUNA S
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

// --- 3. LÓGICA DE CLIQUE E VITRINE ---
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
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
    
    const todosDestaRegiao = window.dadosGerais
        .filter(d => d.id === idRegiao)
        .sort((a, b) => a.ordem - b.ordem);

    const ativo = infoSelecionado || todosDestaRegiao[0];

    // Vitrine Superior (Somente outros residenciais com nome válido)
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto && item.nomeCurto !== "Sem Nome" && item.nomeCurto !== ativo.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                btn.style.borderRightColor = obterCorPorZona(item);

                if (item.categoria === "COMPLEXO") {
                    btn.style.backgroundColor = btn.style.borderRightColor;
                    btn.style.color = "#ffffff";
                    btn.classList.add('estilo-complexo');
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

// --- 4. EXIBIÇÃO DA FICHA TÉCNICA ---
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    const endereco = info.endereco || "Endereço não cadastrado";
    const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

    if(elDetalhes) {
        elDetalhes.innerHTML = `
            <div class="container-acoes">
                <span class="endereco-texto">📍 ${endereco}</span>
                <div style="display: flex; gap: 8px; margin-top: 5px;">
                    <a href="${linkMaps}" target="_blank" class="btn-acao btn-maps">MAPS</a>
                    <button onclick="copyToClipboard('${info.link}')" class="btn-acao btn-link">LINK</button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                <div class="texto-coluna-r">ENTREGA: <b>${info.entrega}</b></div>
                <div class="texto-coluna-r">OBRA: <b>${info.obra}%</b></div>
                <div class="texto-coluna-r">ESTOQUE: <b>${info.estoque}</b></div>
                <div class="texto-coluna-r">LIMITADOR: <b>${info.limitador}</b></div>
            </div>
            <div id="texto-descricao" style="margin-top:15px; border-top: 1px solid #444; padding-top:10px;">
                ${info.textoColunaR}<br><br>
                ${info.descricao || ""}
            </div>
        `;
    }
}

// --- 5. MENU LATERAL ---
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 
    
    [...window.dadosGerais]
        .sort((a, b) => a.ordem - b.ordem)
        .forEach(info => {
            if (!info.nomeCurto || info.nomeCurto === "Sem Nome") return;

            const li = document.createElement('li');
            li.className = 'menu-item-mrv'; 
            li.innerText = info.nomeCurto.toUpperCase();
            li.style.borderRightColor = obterCorPorZona(info);

            if (info.categoria === "COMPLEXO") { 
                li.style.backgroundColor = li.style.borderRightColor; 
                li.style.color = "#ffffff"; 
                li.classList.add('estilo-complexo');
            }
            
            li.onclick = (e) => {
                e.stopPropagation();
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

// --- 6. UTILITÁRIOS E MAPA ---
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;
    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    // Ajustes de escala conforme o mapa ativo
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
        
        // Identifica se é MRV pela classe do SVG ou pela presença na planilha
        const ehMRV = pData.class === "commrv" || window.dadosGerais.some(d => d.id === idLimpo);
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.setAttribute('data-name', pData.name || pData.id);
        
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        // Paths cinzas (semmrv) não têm borda conforme sua solicitação
        path.style.strokeWidth = (ehMinimizado || !ehMRV) ? "0" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            // --- COMPORTAMENTO DE TOQUE (HOVER) ---
            path.onmouseenter = () => {
                atualizarTextoTopo(pData.name || pData.id);
                if (!ehMRV) path.style.fill = "#bbbbbb"; // Brilho leve no cinza ao tocar
            };

            path.onmouseleave = () => {
                // Se houver um residencial selecionado (laranja), volta o nome dele.
                // Se não, volta o nome do mapa atual.
                const nomeParaVoltar = cidadeClicadaAtiva ? cidadeClicadaAtiva.name : (mapaAtivo === "GSP" ? "Grande SP" : "Estado de SP");
                atualizarTextoTopo(nomeParaVoltar);
                
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = corBase;
                }
            };

            // --- COMPORTAMENTO DE CLIQUE (FIXAR) ---
            path.onclick = (e) => { 
                e.stopPropagation();
                
                if (pData.id === "grandesaopaulo") { trocarMapas(); return; } 

                if (ehMRV) {
                    // Fixa o destaque apenas se for MRV
                    clicarNoMapa(path, null, pData); 
                } else {
                    // Se for cinza, apenas limpa qualquer seleção anterior (opcional) ou não faz nada fixo
                    // O texto já foi atualizado no mouseenter e voltará no mouseleave
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
    
    // Inicializa o texto do topo com o nome do mapa
    if (!cidadeClicadaAtiva) {
        atualizarTextoTopo(mapaAtivo === "GSP" ? "Grande SP" : "Estado de SP");
    }
}
function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeClicadaAtiva = null; 
    // Atualiza para o nome do novo mapa ativo
    atualizarTextoTopo(mapaAtivo === "GSP" ? "Grande SP" : "Estado de SP");
    atualizarVisualizacao();
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = (nome || "").toUpperCase();
}

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        menu.classList.toggle('menu-aberto');
        menu.classList.toggle('menu-oculto');
    }
}

function copyToClipboard(text) {
    if(!text || text === "#") return alert("Link não disponível");
    navigator.clipboard.writeText(text).then(() => alert("Copiado!"));
}

window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
