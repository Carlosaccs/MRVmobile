/* ==========================================================================
   js v140.9.8 - FIX: LÓGICA DE ESTOQUE + PLANTAS COMBINADAS (K até L)
   ========================================================================== */

/* ==========================================================================
   BLOCO 1: CONFIGURAÇÕES E VARIÁVEIS
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

/* ==========================================================================
   BLOCO 2: DADOS E CARREGAMENTO
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
                const nomeResidencial = limpar(c[4]);
                
                if (nomeResidencial !== "") {
                    window.dadosGerais.push({
                        id: limpar(c[0]).toLowerCase(),
                        categoria: limpar(c[1]).toUpperCase(),
                        ordem: parseInt(limpar(c[2])) || 9999,
                        zona: limpar(c[3]).toUpperCase(),
                        nomeCurto: nomeResidencial,
                        endereco: limpar(c[7]),
                        precosRaw: limpar(c[8]),
                        destaqueCampanha: limpar(c[16]), 
                        link: limpar(c[16]), 
                        descLonga: limpar(c[18]),
                        bookCliente: c[25] ? limpar(c[25]) : "",
                        bookCorretor: c[26] ? limpar(c[26]) : "",
                        videoDecorado: c[27] ? limpar(c[27]) : "",
                        estoque: limpar(c[6]),     // Coluna G
                        entrega: limpar(c[9]),     // Coluna J
                        plantaMin: limpar(c[10]),  // Coluna K
                        plantaMax: limpar(c[11]),  // Coluna L
                        obra: limpar(c[12]),       // Coluna M
                        limitador: limpar(c[13]),  // Coluna N
                        cPaulista: limpar(c[15])   // Coluna P
                    });
                }
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

/* ==========================================================================
   BLOCO 3: INTERAÇÃO E VITRINE
   ========================================================================== */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    solicitarFullscreen();
    const ehVerde = pathElement.getAttribute('data-cor-base') === "#00713a";
    const nomeDestaRegiao = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');

    if (!ehVerde && !infoSelecionado) {
        const indicador = document.getElementById('identificador-cidade');
        if (indicador) indicador.innerText = nomeDestaRegiao.toUpperCase();
        setTimeout(() => { 
            if (indicador) indicador.innerText = regiaoAtivaGeral ? regiaoAtivaGeral.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP"); 
        }, 1000); 
        return; 
    }

    document.querySelectorAll('#mapa-container path').forEach(p => { 
        p.setAttribute('data-selecionado', 'false'); 
        p.style.fill = p.getAttribute('data-cor-base'); 
    });

    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500"; 
    
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a, b) => a.ordem - b.ordem);
    const ativo = infoSelecionado || todosDestaRegiao[0];

    regiaoAtivaGeral = ativo ? ativo.nomeCurto : nomeDestaRegiao;
    const indicador = document.getElementById('identificador-cidade');
    if (indicador) indicador.innerText = regiaoAtivaGeral.toUpperCase();

    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto && item.nomeCurto !== (ativo ? ativo.nomeCurto : "")) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                const nomeZona = obterNomeZona(item.zona);
                btn.innerHTML = `<span>${item.nomeCurto.toUpperCase()}</span><span style="opacity: 0.7; font-size: 0.6rem; margin-right: 8px;">${nomeZona}</span>`;
                
                btn.style.height = ALTURA_PADRAO;
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.justifyContent = "space-between";
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

/* ==========================================================================
   BLOCO 4: FICHA TÉCNICA E LÓGICA DE CAMPOS
   ========================================================================== */
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = (info.nomeCurto || "").toUpperCase();
    if (!elDetalhes) return;

    const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
    const isComplexo = info.categoria === "COMPLEXO";

    // --- TRATAMENTO PLANTAS (K até L) ---
    const plantasTxt = (info.plantaMin && info.plantaMax) ? `${info.plantaMin} até ${info.plantaMax}` : (info.plantaMin || "---");

    // --- LÓGICA DE TRATAMENTO DO ESTOQUE ---
    let estoqueHtml = "";
    const estValue = info.estoque ? info.estoque.toString().trim() : "";
    const estNum = parseInt(estValue);

    if (estValue === "" || estValue === null) {
        estoqueHtml = "---";
    } else if (estValue === "-") {
        estoqueHtml = "CONSULTAR";
    } else if (estNum === 0) {
        estoqueHtml = `<span style="text-decoration: line-through; color: #bbb;">VENDIDO</span>`;
    } else if (estNum < 5) {
        estoqueHtml = `<span style="color: #e31c19;">APENAS ${estNum} UN.</span>`;
    } else {
        estoqueHtml = `RESTAM ${estNum} UN.`;
    }

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
        // Lógica para complexos se mantém...
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
            ${criarCaixaDado("OBRA", info.obra ? info.obra + (info.obra.includes('%') ? '' : '%') : '---')}
            ${criarCaixaDado("PLANTAS", plantasTxt)}
            ${criarCaixaDado("ESTOQUE", estoqueHtml)}
            ${criarCaixaDado("LIMITADOR", info.limitador || "---")}
            ${criarCaixaDado("C. PAULISTA", info.cPaulista || "---")}
        </div>`;

        // Lógica de preços se mantém...
        htmlContent += htmlCaixaQ + htmlGrid6;
    }
    elDetalhes.innerHTML = htmlContent;
}

/* ==========================================================================
   BLOCO 5: MAPAS E MENU LATERAL (SISTEMA)
   ========================================================================== */
// ... (Funções desenharMapa, trocarMapas, gerarMenuResidenciais, etc.)
// Estas funções seguem a lógica da v140.9.7 que já está funcionando bem.
