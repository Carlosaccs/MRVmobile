/* ==========================================================================
   v140.1 - RETORNO AO ESTÁVEL + ACRÉSCIMO DA COLUNA N (REGIONAL)
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
   CARREGAMENTO DOS DADOS (FOCO NA COLUNA N)
   ========================================================================== */
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        
        window.dadosGerais = []; 
        
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 4) {
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                
                // Pegamos a Coluna N (índice 13)
                const reg = limpar(c[13]); 
                const nomeBase = limpar(c[3]) || "Sem Nome";
                
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    // Aqui acrescentamos o traço e a regional no nomeCurto
                    nomeCurto: reg ? `${nomeBase} - ${reg}` : nomeBase,
                    regional: reg
                });
            }
        });
        
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* ==========================================================================
   DESENHO DO MAPA (ESTRUTURA ORIGINAL)
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
        
        const temResidencial = window.dadosGerais.some(d => d.id === idLimpo);
        const ehMRV = pData.class === "commrv" || temResidencial;

        path.setAttribute('data-name', pData.name || pData.id);
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        const corVerde = "#00713a", corCinza = "#cccccc", corLaranja = "#FF4500", corFoco = "#777777";
        const corBase = ehMRV ? corVerde : corCinza;
        
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corBase);

        if (!ehMinimizado) {
            path.onmouseover = () => {
                atualizarTextoTopo(pData.name || pData.id);
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = ehMRV ? corLaranja : corFoco;
                }
            };
            
            path.onmouseout = () => {
                atualizarTextoTopo(null);
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = corBase;
                }
            };

            path.onclick = () => {
                if (pData.id === "grandesaopaulo") {
                    trocarMapas();
                    return;
                }
                if (!ehMRV) return;
                const infoPrimeiro = window.dadosGerais.find(d => d.id === idLimpo);
                clicarNoMapa(path, infoPrimeiro, pData);
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

/* ==========================================================================
   LÓGICA DE CLIQUE E INTERAÇÃO
   ========================================================================== */
function clicarNoMapa(pathElement, info, pDataRaw = null) {
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

    const elTituloFicha = document.getElementById('titulo-regiao-ficha');
    if (elTituloFicha) {
        elTituloFicha.innerText = `MRV EM ${cidadeClicadaAtiva.name.toUpperCase()}`;
        elTituloFicha.style.display = "block";
    }

    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao);
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) containerBotoes.innerHTML = ""; 

    const registroDestaque = info || todosDestaRegiao[0];

    if (todosDestaRegiao.length > 1 && containerBotoes) {
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto !== registroDestaque.nomeCurto) {
                const btn = document.createElement('div');
                btn.className = 'menu-item-mrv';
                btn.innerText = item.nomeCurto.toUpperCase();
                
                let corBorda = "#00713a";
                if (btn.innerText.includes("ZO")) corBorda = "#ff8c00";
                else if (btn.innerText.includes("ZL")) corBorda = "#e31c19";
                else if (btn.innerText.includes("ZN")) corBorda = "#0054a6";
                else if (btn.innerText.includes("ZS")) corBorda = "#d1147e";
                btn.style.borderRightColor = corBorda;

                btn.onclick = () => clicarNoMapa(pathElement, item, pDataRaw);
                containerBotoes.appendChild(btn);
            }
        });
    }

    if (registroDestaque) exibirDadosResidencial(registroDestaque);
}

function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if(elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    if(elDetalhes) {
        elDetalhes.innerHTML = `
            <p style="margin-top:10px;"><strong>CATEGORIA:</strong> ${info.categoria}</p>
            <p style="color:#50c878; font-weight:bold;">📍 Localidade: ${cidadeClicadaAtiva ? cidadeClicadaAtiva.name.toUpperCase() : ""}</p>
        `;
    }
}

/* ==========================================================================
   FUNÇÕES DE APOIO (TROCA DE MAPA, FULLSCREEN, ETC)
   ========================================================================== */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = ""; 

    const itensOrdenados = [...window.dadosGerais].sort((a, b) => a.ordem - b.ordem);

    itensOrdenados.forEach(info => {
        const li = document.createElement('li');
        li.className = 'menu-item-mrv'; 
        li.innerText = info.nomeCurto.toUpperCase();
        
        let corBorda = "#00713a";
        if (li.innerText.includes("ZO")) corBorda = "#ff8c00";
        else if (li.innerText.includes("ZL")) corBorda = "#e31c19";
        else if (li.innerText.includes("ZN")) corBorda = "#0054a6";
        else if (li.innerText.includes("ZS")) corBorda = "#d1147e";
        li.style.borderRightColor = corBorda;

        if (info.categoria === "COMPLEXO") {
            li.style.background = "#232323";
            li.style.color = "#ffffff";
        }

        li.onclick = () => {
            let p = document.getElementById(info.id);
            if (!p) {
                trocarMapas();
                setTimeout(() => {
                    let np = document.getElementById(info.id);
                    if (np) clicarNoMapa(np, info);
                }, 200);
            } else {
                clicarNoMapa(p, info);
            }
        };
        lista.appendChild(li);
    });
}

function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeClicadaAtiva = null; 
    atualizarTextoTopo(null);
    atualizarVisualizacao();
}

function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    const textoExibir = nome || (cidadeClicadaAtiva ? cidadeClicadaAtiva.name : "");
    indicador.innerText = textoExibir.toUpperCase();
}

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    if(menu) {
        menu.classList.toggle('menu-oculto');
        menu.classList.toggle('menu-aberto');
    }
}

// Inicialização
window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
