/* ==========================================================================
   v140.0 - JS CONSOLIDADO (LÓGICA DE ESTOQUE E VITRINE ATUALIZADA)
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
   BLOCO 2: CARREGAMENTO E TRATAMENTO DE DADOS (ESTOQUE)
   ========================================================================== */
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        
        window.dadosGerais = []; 
        
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 14) { // Garantindo que chegue até a coluna N (14)
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    nomeCurto: limpar(c[3]) || "Sem Nome",
                    estoque: limpar(c[5]), // Coluna F
                    regional: limpar(c[13]) // Coluna N
                });
            }
        });
        
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

// Função para formatar o texto do estoque conforme as regras solicitadas
function formatarEstoque(valor) {
    if (!valor || valor === "" || valor === " ") return "";
    if (valor === "-") return '<span style="color: #666;">CONSULTAR</span>';
    
    const num = parseInt(valor);
    if (num === 0) return '<span style="color: #999; text-decoration: line-through;">VENDIDO</span>';
    if (num < 6) return `<span style="color: #e31c19; font-weight: bold;">RESTAM ${num} UN.</span>`;
    return `<span style="color: #666;">RESTAM ${num} UN.</span>`;
}

/* ==========================================================================
   BLOCO 3: GERAÇÃO DO MENU LATERAL
   ========================================================================== */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 

    const itensOrdenados = [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem);

    itensOrdenados.forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv'; 
        
        // Texto do Menu: Nome + Regional
        const regionalSufixo = info.regional ? ` - ${info.regional}` : "";
        li.innerHTML = `<span style="flex:1; text-align:left;">${info.nomeCurto.toUpperCase()}${regionalSufixo}</span>`;
        
        let corBorda = "#00713a";
        if (info.nomeCurto.includes("ZO")) corBorda = "#ff8c00";
        else if (info.nomeCurto.includes("ZL")) corBorda = "#e31c19";
        else if (info.nomeCurto.includes("ZN")) corBorda = "#0054a6";
        else if (info.nomeCurto.includes("ZS")) corBorda = "#d1147e";
        li.style.borderRight = `4px solid ${corBorda}`;

        if (info.categoria === "COMPLEXO") {
            li.style.background = "#232323";
            li.style.color = "#ffffff";
        }

        li.onclick = () => {
            let pathNoMapa = document.getElementById(info.id);
            if (!pathNoMapa) {
                trocarMapas();
                setTimeout(() => {
                    const novoPath = document.getElementById(info.id);
                    if (novoPath) clicarNoMapa(novoPath, info);
                }, 200);
            } else {
                clicarNoMapa(pathNoMapa, info);
            }
        };
        lista.appendChild(li);
    });
}

/* ==========================================================================
   BLOCO 4: CLIQUE E VITRINE (FICHA TÉCNICA)
   ========================================================================== */
function clicarNoMapa(pathElement, info, pDataRaw = null) {
    const corLaranja = "#FF4500";
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.setAttribute('data-selecionado', 'false');
        p.style.fill = p.getAttribute('data-cor-base');
    });
    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = corLaranja;
    
    const nomeDaCidade = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    cidadeClicadaAtiva = { name: nomeDaCidade || "" }; 
    atualizarTextoTopo(cidadeClicadaAtiva.name);

    const elTituloFicha = document.getElementById('titulo-regiao-ficha');
    if (elTituloFicha) {
        elTituloFicha.innerText = `MRV EM ${cidadeClicadaAtiva.name.toUpperCase()}`;
        elTituloFicha.style.display = "block";
    }

    // VITRINE: Filtra todos da região
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao);
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) containerBotoes.innerHTML = ""; 

    // O registro em destaque é o clicado ou o primeiro
    const registroDestaque = info || todosDestaRegiao[0];

    // Gera os botões da vitrine com Nome - Regional (esquerda) e Estoque (direita)
    if (todosDestaRegiao.length > 0 && containerBotoes) {
        todosDestaRegiao.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'menu-item-mrv';
            
            // Highlight para o que está selecionado na ficha agora
            if (item.nomeCurto === registroDestaque.nomeCurto) {
                btn.style.background = "#f0f0f0";
            }

            const regionalSufixo = item.regional ? ` - ${item.regional}` : "";
            const htmlEstoque = formatarEstoque(item.estoque);

            btn.innerHTML = `
                <span style="flex:1; text-align:left;">${item.nomeCurto.toUpperCase()}${regionalSufixo}</span>
                <span style="margin-left:10px; font-size: 0.75rem; white-space: nowrap;">${htmlEstoque}</span>
            `;
            
            let corBorda = "#00713a";
            if (item.nomeCurto.includes("ZO")) corBorda = "#ff8c00";
            else if (item.nomeCurto.includes("ZL")) corBorda = "#e31c19";
            else if (item.nomeCurto.includes("ZN")) corBorda = "#0054a6";
            else if (item.nomeCurto.includes("ZS")) corBorda = "#d1147e";
            btn.style.borderRight = `4px solid ${corBorda}`;

            btn.onclick = (e) => {
                e.stopPropagation();
                clicarNoMapa(pathElement, item, pDataRaw);
            };
            containerBotoes.appendChild(btn);
        });
    }

    if (registroDestaque) exibirDadosResidencial(registroDestaque);
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    
    // Limpamos o título para ele "subir" conforme solicitado
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    if(elDetalhes) {
        elDetalhes.innerHTML = `
            <p style="margin-top:5px; font-size:0.85rem;"><strong>CATEGORIA:</strong> ${info.categoria}</p>
            <p style="color:#50c878; font-weight:bold; font-size:0.85rem;">📍 Localidade: ${info.regional || cidadeClicadaAtiva.name.toUpperCase()}</p>
        `;
    }
}

// ... (Restante das funções de Desenho, Troca de Mapa e Fullscreen permanecem iguais)
