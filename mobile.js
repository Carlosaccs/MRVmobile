/* ==========================================================================
   BLOCO 1: VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; // Objeto para busca rápida por ID
window.listaResidenciais = []; // Lista completa para o menu

/* ==========================================================================
   BLOCO 2: CONEXÃO COM GOOGLE SHEETS E TRATAMENTO DE DADOS
   ========================================================================== */
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        
        window.bancoDados = {};
        window.listaResidenciais = [];

        for (let i = 1; i < linhas.length; i++) {
            // Regex para evitar quebra em vírgulas dentro de aspas
            const c = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (c.length >= 5) {
                const registro = {
                    idPath: c[0]?.replace(/"/g, '').trim().toLowerCase(),
                    categoria: c[1]?.replace(/"/g, '').trim(),
                    ordem: parseInt(c[2]) || 999,
                    nomeMenu: c[3]?.replace(/"/g, '').trim(),
                    nomeFull: c[4]?.replace(/"/g, '').trim(),
                    estoque: c[5]?.replace(/"/g, '').trim() || "Consulte",
                    status: c[11]?.replace(/"/g, '').trim() || "Em obra"
                };

                window.listaResidenciais.push(registro);
                
                // Mapeia o ID para o clique no mapa (armazena o primeiro encontrado)
                if (!window.bancoDados[registro.idPath]) {
                    window.bancoDados[registro.idPath] = registro;
                }
            }
        }
        
        // Ordena por prioridade (Coluna C)
        window.listaResidenciais.sort((a, b) => a.ordem - b.ordem);
        
        gerarMenuResidenciais();
        atualizarVisualizacao();
    } catch (e) { 
        console.error("Erro no carregamento da planilha:", e); 
    }
}

/* ==========================================================================
   BLOCO 3: CONSTRUÇÃO DO MENU DINÂMICO
   ========================================================================== */
function gerarMenuResidenciais() {
    const container = document.getElementById('container-menu');
    if (!container) return;

    container.innerHTML = "";
    window.listaResidenciais.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'item-menu';
        item.innerText = reg.nomeMenu;
        
        item.onclick = () => {
            selecionarImovel(reg.idPath, reg);
            toggleMenu(); // Fecha o menu após selecionar
        };
        
        container.appendChild(item);
    });
}

/* ==========================================================================
   BLOCO 4: LÓGICA DE SELEÇÃO E INTERAÇÃO (MAPA + MENU)
   ========================================================================== */
function selecionarImovel(id, dados = null) {
    // Se clicou no mapa, busca no banco. Se veio do menu, usa os dados diretos.
    const info = dados || window.bancoDados[id];
    if (!info) return;

    // 1. Reset visual do mapa
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.style.fill = p.getAttribute('data-cor-base');
    });

    // 2. Destaca o path selecionado
    const path = document.getElementById(id);
    if (path) {
        path.style.fill = "#FF4500";
        document.getElementById('identificador-cidade').innerText = info.nomeMenu;
    }

    // 3. Atualiza Ficha Técnica
    document.getElementById('nome-imovel').innerText = info.nomeMenu || info.nomeFull;
    document.getElementById('detalhes-imovel').innerHTML = `
        <p style="margin: 10px 0;"><strong>Estoque:</strong> ${info.estoque}</p>
        <p style="margin: 10px 0;"><strong>Status:</strong> ${info.status}</p>
    `;
}

/* ==========================================================================
   BLOCO 5: DESENHO E ALTERNÂNCIA DOS MAPAS (SVG)
   ========================================================================== */
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const ehMRV = pData.class === "commrv";

        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado && ehMRV) {
            path.onclick = () => selecionarImovel(idLimpo);
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

/* ==========================================================================
   BLOCO 6: FUNÇÕES DE CONTROLE (MENU/FULLSCREEN/LOAD)
   ========================================================================== */
function toggleMenu() {
    const menu = document.getElementById('container-menu');
    if(menu) menu.classList.toggle('aberto');
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    atualizarVisualizacao();
}

window.onload = carregarPlanilha;

// Listener para o ícone de hambúrguer na faixa verde
document.addEventListener('click', (e) => {
    if (e.target.closest('.icon-bottom')) toggleMenu();
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
