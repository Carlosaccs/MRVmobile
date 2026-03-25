/* ==========================================================================
   v141.0 000 - DASHBOARD MRV (ESTÁVEL)
   ========================================================================== */

/* BLOCO 1: CONFIGURAÇÕES */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.dadosGerais = []; 

/* BLOCO 2: CARREGAMENTO */
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
                window.dadosGerais.push({
                    id: limpar(c[0]).toLowerCase(),
                    categoria: limpar(c[1]).toUpperCase(),
                    ordem: parseInt(limpar(c[2])) || 9999,
                    nomeCurto: limpar(c[3]) || "Sem Nome"
                });
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro na planilha:", e); }
}

/* BLOCO 3: MENU LATERAL */
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
            let pathNoMapa = document.getElementById(info.id);
            if (!pathNoMapa) {
                trocarMapas();
                setTimeout(() => {
                    const novoPath = document.getElementById(info.id);
                    if (novoPath) clicarNoMapa(novoPath, info);
                }, 300);
            } else {
                clicarNoMapa(pathNoMapa, info);
            }
        };
        lista.appendChild(li);
    });
}

/* BLOCO 4: LÓGICA DO CLIQUE (SVG) */
function clicarNoMapa(pathElement, info, pDataRaw = null) {
    if (!pathElement) return;
    const corLaranja = "#FF4500";
    
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.setAttribute('data-selecionado', 'false');
        p.style.fill = p.getAttribute('data-cor-base');
    });

    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = corLaranja;
    
    // Define o nome da região corrigindo o erro de "Cidade Sete Sóis" no topo
    let nomeDaRegiao = "";
    if (pDataRaw && pDataRaw.name) {
        nomeDaRegiao = pDataRaw.name;
    } else {
        nomeDaRegiao = pathElement.getAttribute('name') || pathElement.id.replace('mini-', '').toUpperCase();
    }

    cidadeClicadaAtiva = { name: nomeDaRegiao }; 
    atualizarTextoTopo(nomeDaRegiao);

    // Envia para a Vitrine (Bloco 8)
    montarListaCidadeVitrine(nomeDaRegiao, pathElement.id.replace('mini-', ''));
}

/* BLOCO 5 & 6: MAPA E UTILITÁRIOS */
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
    if (indicador) indicador.innerText = nome ? nome.toUpperCase() : "";
}

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    menu.classList.toggle('menu-oculto');
    menu.classList.toggle('menu-aberto');
}

/* BLOCO 8: LÓGICA DA VITRINE */
function montarListaCidadeVitrine(nomeRegiao, idPath) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (!elNome || !elDetalhes) return;

    elNome.innerText = `MRV EM ${nomeRegiao.toUpperCase()}`;

    const buscaId = idPath.toLowerCase().trim();
    const imoveisDaRegiao = window.dadosGerais.filter(d => d.id === buscaId);

    if (imoveisDaRegiao.length === 0) {
        elDetalhes.innerHTML = `<p style="padding:20px; color:#999;">Nenhum residencial cadastrado para esta região.</p>`;
        return;
    }

    let htmlBotoes = `<div class="vitrine-lista-botoes">`;
    imoveisDaRegiao.sort((a,b) => a.ordem - b.ordem).forEach(imovel => {
        let corBorda = "#00713a";
        const n = imovel.nomeCurto.toUpperCase();
        if (n.includes("ZO")) corBorda = "#ff8c00";
        else if (n.includes("ZL")) corBorda = "#e31c19";
        else if (n.includes("ZN")) corBorda = "#0054a6";
        else if (n.includes("ZS")) corBorda = "#d1147e";

        htmlBotoes += `
            <button class="btRes" style="border-right: 15px solid ${corBorda};"
                    onclick="abrirFichaImovel('${imovel.nomeCurto}')">
                <span>${n}</span>
                <span style="font-size: 10px; opacity: 0.5;">VER DETALHES ></span>
            </button>`;
    });
    htmlBotoes += `</div>`;
    elDetalhes.innerHTML = htmlBotoes;
}

function abrirFichaImovel(nomeImovel) {
    console.log("v141: Detalhes de " + nomeImovel);
}

// Inicialização
window.onload = carregarPlanilha;
document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
