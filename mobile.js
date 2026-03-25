/* ==========================================================================
   v141.0 - LÓGICA DA VITRINE (LISTA DE IMÓVEIS POR REGIÃO)
   ========================================================================== */

/* ==========================================================================
   BLOCO 1: CONFIGURAÇÕES, URLs E ESTADOS GLOBAIS
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeClicadaAtiva = null; 
window.bancoDados = {};

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const DNA_AMPLIAR = "M 75.757133 114.16926 L 75.757133 124.7898 L 75.757133 135.41086 L 78.412268 135.41086 L 81.067403 135.41086 L 81.067403 127.44493 L 81.067403 119.47953 L 89.032808 119.47953 L 96.99873 119.47953 L 96.99873 116.82439 L 96.99873 114.16926 L 86.377673 114.16926 L 75.757133 114.16926 z M 115.58468 114.16926 L 115.58468 116.82439 L 115.58468 119.47953 L 123.36043 119.47953 L 131.13618 119.47953 L 131.13618 127.44493 L 131.13618 135.41086 L 133.79183 135.41086 L 136.44697 136.44697 L 136.44697 124.7898 L 136.44697 114.16926 L 126.01556 114.16926 L 115.58468 114.16926 z M 75.757133 153.9968 L 75.757133 164.61734 L 75.757133 175.2384 L 86.377673 175.2384 L 96.99873 175.2384 L 96.99873 172.39361 L 96.99873 169.54882 L 89.032808 169.54882 L 81.067403 169.54882 L 81.067403 161.77255 L 81.067403 153.9968 L 78.412268 153.9968 L 75.757133 153.9968 z M 131.13618 153.9968 L 131.13618 161.77255 L 131.13618 169.54882 L 123.36043 169.54882 L 115.58468 169.54882 L 115.58468 172.39361 L 115.58468 175.2384 L 126.01556 175.2384 L 136.44697 175.2384 L 136.44697 164.61734 L 136.44697 153.9968 L 133.79183 153.9968 L 131.13618 153.9968 z";
const DNA_REDUZIR = "M 78.408134 124.88437 L 78.408134 132.66012 L 78.408134 140.43587 L 70.442729 140.43587 L 62.476807 140.43587 L 62.476807 143.28066 L 62.476807 146.12596 L 73.097864 146.12596 L 83.718404 146.12596 L 83.718404 135.50491 L 83.718404 124.88437 L 81.063269 124.88437 L 78.408134 124.88437 z M 102.30435 124.88437 L 102.30435 135.50491 L 102.30435 146.12596 L 112.92541 146.12596 L 123.54595 146.12596 L 123.54595 143.28066 L 123.54595 140.43587 L 115.58054 140.43587 L 107.61514 140.43587 L 107.61514 132.66012 L 107.61514 124.88437 L 104.96 124.88437 L 102.30435 124.88437 z M 62.476807 164.3326 L 62.476807 167.17739 L 62.476807 170.02218 L 70.442729 170.02218 L 78.408134 170.02218 L 78.408134 177.79793 L 78.408134 185.5742 L 81.063269 185.5742 L 83.718404 185.5742 L 83.718404 174.95315 L 83.718404 164.3326 L 73.097864 164.3326 L 62.476807 164.3326 z M 102.30435 164.3326 L 102.30435 174.95315 L 102.30435 185.5742 L 104.96 185.5742 L 107.61514 185.5742 L 107.61514 177.79793 L 107.61514 170.02218 L 115.58054 170.02218 L 123.54595 170.02218 L 123.54595 167.17739 L 123.54595 164.3326 L 112.92541 164.3326 L 102.30435 164.3326 z";

/* ==========================================================================
   BLOCO 2: CARREGAMENTO DOS DADOS (ARRAY)
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

/* ==========================================================================
   BLOCO 3: GERAÇÃO DO MENU
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
        
        // Cores Zonas
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
                }, 200);
            } else {
                clicarNoMapa(pathNoMapa, info);
            }
        };
        lista.appendChild(li);
    });
}
/* ==========================================================================
   BLOCO 4: DESENHO E LÓGICA DO MAPA SVG (CORRIGIDO)
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
        
        // Verifica se existe algum residencial para esta região no nosso Array
        const temResidencial = window.dadosGerais.some(d => d.id === idLimpo);
        const ehMRV = pData.class === "commrv" || temResidencial;

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
                
                // Busca o primeiro residencial desta região para exibir na ficha
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
   FUNÇÃO DE APOIO: TRATA O CLIQUE (MAPA OU MENU)
   ========================================================================== */
function clicarNoMapa(pathElement, info, pDataRaw = null) {
    const corLaranja = "#FF4500";
    
    // 1. Limpa destaques anteriores
    document.querySelectorAll('#mapa-container path').forEach(p => {
        p.setAttribute('data-selecionado', 'false');
        p.style.fill = p.getAttribute('data-cor-base');
    });

    // 2. Destaca a nova região
    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = corLaranja;
    
    // 3. Define qual nome exibir no topo
    const nomeParaTopo = info ? info.nomeCurto : (pDataRaw ? (pDataRaw.name || pDataRaw.id) : "");
    cidadeClicadaAtiva = { name: nomeParaTopo }; 
    atualizarTextoTopo(nomeParaTopo);

    // 4. Atualiza a Ficha Técnica lateral
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');

    if (info) {
        elNome.innerText = info.nomeCurto.toUpperCase();
        elDetalhes.innerHTML = `
            <p style="margin-top:10px;"><strong>CATEGORIA:</strong> ${info.categoria}</p>
            <p style="color:#00713a; font-weight:bold;">📍 Região: ${pathElement.id.toUpperCase()}</p>
        `;
    } else {
        elNome.innerText = nomeParaTopo.toUpperCase();
        elDetalhes.innerHTML = "<p>Selecione um residencial no menu para ver detalhes específicos.</p>";
    }
}

/* ==========================================================================
   BLOCO 5: TROCA DE MAPAS E VISUALIZAÇÃO
   ========================================================================== */
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

/* ==========================================================================
   BLOCO 6: UTILITÁRIOS (FULLSCREEN, TEXTO TOPO, MENU)
   ========================================================================== */
function atualizarTextoTopo(nome) {
    const indicador = document.getElementById('identificador-cidade');
    if (!indicador) return;
    if (nome) {
        indicador.innerText = nome.toUpperCase();
    } else {
        indicador.innerText = cidadeClicadaAtiva ? cidadeClicadaAtiva.name.toUpperCase() : "";
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
        document.exitFullscreen();
    }
}

function atualizarIconeFullscreen() {
    const p = document.getElementById('path-fullscreen');
    const svg = p?.closest('svg');
    if (!p || !svg) return;
    if (document.fullscreenElement) {
        p.setAttribute('d', DNA_REDUZIR);
        svg.setAttribute('viewBox', '55 120 80 80');
    } else {
        p.setAttribute('d', DNA_AMPLIAR);
        svg.setAttribute('viewBox', '60 110 90 90');
    }
}

function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    menu.classList.toggle('menu-oculto');
    menu.classList.toggle('menu-aberto');
}

/* ==========================================================================
   BLOCO 7: EVENTOS DE CARREGAMENTO E CLIQUE EXTERNO
   ========================================================================== */
window.onload = carregarPlanilha;
document.addEventListener('fullscreenchange', atualizarIconeFullscreen);

document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});



/* ==========================================================================
   BLOCO 8: LÓGICA DA VITRINE (LISTA DE IMÓVEIS POR REGIÃO)
   ========================================================================== */

// Esta função limpa a ficha e monta a lista de botões dos prédios daquela cidade
function montarListaCidadeVitrine(nomeRegiao, idPath) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');

    if (!elNome || !elDetalhes) return;

    // 1. Atualiza o Título Principal da Vitrine
    elNome.innerText = `MRV EM ${nomeRegiao.toUpperCase()}`;

    // 2. Filtra no seu Array (window.dadosGerais) todos os imóveis dessa cidade
    const imoveisDaRegiao = window.dadosGerais.filter(d => d.id === idPath.toLowerCase());

    if (imoveisDaRegiao.length === 0) {
        elDetalhes.innerHTML = `<p style="padding:20px; color:#999;">Nenhum residencial cadastrado para esta região.</p>`;
        return;
    }

    // 3. Cria a lista de botões (btRes)
    let htmlBotoes = `<div class="vitrine-lista-botoes">`;
    
    imoveisDaRegiao.forEach(imovel => {
        // Define a cor da borda lateral com base na Zona (ZL, ZS, etc)
        let corBorda = "#00713a";
        if (imovel.nomeCurto.includes("ZO")) corBorda = "#ff8c00";
        else if (imovel.nomeCurto.includes("ZL")) corBorda = "#e31c19";
        else if (imovel.nomeCurto.includes("ZN")) corBorda = "#0054a6";
        else if (imovel.nomeCurto.includes("ZS")) corBorda = "#d1147e";

        htmlBotoes += `
            <button class="btRes" 
                    style="border-right: 15px solid ${corBorda};"
                    onclick="abrirFichaImovel('${imovel.nomeCurto}')">
                ${imovel.nomeCurto.toUpperCase()}
            </button>`;
    });

    htmlBotoes += `</div>`;
    elDetalhes.innerHTML = htmlBotoes;
}

// Função de apoio que será usada no próximo passo para mostrar preços/detalhes
function abrirFichaImovel(nomeImovel) {
    console.log("Solicitado detalhes de: " + nomeImovel);
    // Aqui entrará a lógica de carregar a tabela de preços e endereço
}

/* AJUSTE DE INTEGRAÇÃO: 
   Para que isso funcione, adicione esta linha NO FINAL da sua função 
   clicarNoMapa (lá no Bloco 4) do seu código original:
   
   montarListaCidadeVitrine(nomeParaTopo, pathElement.id);
*/
