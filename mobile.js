/* ==========================================================================
   v137 - INTEGRAL: MAPA + TELA CHEIA + ÍCONES INKSCAPE
   ========================================================================== */

// 1. FUNÇÃO PARA ABRIR E FECHAR (O CORAÇÃO DO MENU)
function toggleMenu() {
    const menu = document.getElementById('container-menu');
    if (menu) {
        menu.classList.toggle('ativo');
        console.log("Menu disparado! Classe atual:", menu.className);
    } else {
        console.error("Erro: O elemento #container-menu não foi encontrado!");
    }
}

// 2. CONSTRUÇÃO DA LISTA (SIMPLIFICADA)
function construirMenuDOM() {
    const listaDiv = document.getElementById('lista-residenciais');
    if (!listaDiv) return;

    listaDiv.innerHTML = ""; // Limpa a lista atual

    // Verifica se os dados da planilha existem
    if (!window.listaResidenciais || window.listaResidenciais.length === 0) {
        listaDiv.innerHTML = "<p style='padding:20px'>Carregando dados...</p>";
        return;
    }

    window.listaResidenciais.forEach(res => {
        const item = document.createElement('div');
        item.className = 'item-menu';
        item.innerText = res.nomeCurto;

        item.onclick = (e) => {
            e.stopPropagation(); // Impede o clique de atravessar para o mapa
            
            // Simula o clique no path do mapa
            const pathAlvo = document.getElementById(res.idPath);
            if (pathAlvo) {
                pathAlvo.dispatchEvent(new Event('click'));
            }
            
            toggleMenu(); // Fecha o menu
        };

        listaDiv.appendChild(item);
    });
}
// 3. Função de Desenho do Mapa
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
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const info = window.bancoDados[idLimpo];
        const nomeCidade = pData.name || pData.id;
        const ehMRV = pData.class === "commrv";

        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        path.setAttribute("class", pData.class || "semmrv");
        
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corLaranjaVivo = "#FF4500";
        const corCinzaEscuro = "#777777";

        const corOriginal = ehMRV ? corVerde : corCinzaClaro;
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            const ativarFoco = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;
                path.style.fill = ehMRV ? corLaranjaVivo : corCinzaEscuro;
            };

            const desativarFoco = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                path.style.fill = corOriginal;
            };

            path.onmouseover = ativarFoco;
            path.onmouseout = desativarFoco;
            path.ontouchstart = ativarFoco;
            path.ontouchend = () => setTimeout(desativarFoco, 1200);

            path.onclick = () => {
                if (!ehMRV) return;
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                });
                path.setAttribute('data-selecionado', 'true');
                path.style.fill = corLaranjaVivo;
                cidadeSelecionada = nomeCidade;
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto || info.nomeFull;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p><strong>Estoque:</strong> ${info.estoque}</p>
                        <p><strong>Status:</strong> ${info.statusObra}</p>
                    `;
                }
            };
        }
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.appendChild(svg);
}

// 4. Controles de Visualização e Troca de Mapa
function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

// 5. Funções de Tela Cheia e Ícones
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err.message));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function atualizarVisualIconeFullscreen() {
    const path = document.getElementById('path-fullscreen');
    const svg = path?.closest('svg');
    if (!path || !svg) return;

    if (document.fullscreenElement) {
        path.setAttribute('d', DNA_REDUZIR);
        svg.setAttribute('viewBox', '55 120 80 80');
    } else {
        path.setAttribute('d', DNA_AMPLIAR);
        svg.setAttribute('viewBox', '60 110 90 90');
    }
}

// 6. Inicialização e Eventos Globais (v138 - Ajustada)
window.onload = () => {
    // 1. Força a primeira visualização do mapa (Grande SP) imediatamente
    atualizarVisualizacao(); 
    
    // 2. Carrega os dados da planilha para colorir os caminhos e montar o menu
    carregarPlanilha();
};

document.addEventListener('click', (e) => {
    // Se clicar no mapa pequeno, troca as posições
    if (e.target.closest('#mapa-minimizado')) {
        trocarMapas();
    }
});

document.addEventListener('fullscreenchange', atualizarVisualIconeFullscreen);

// 7. FUNÇÃO DE CONTROLE DO MENU (CIRURGIA v138 - Ajuste de Click)
function toggleMenu() {
    const menu = document.getElementById('container-menu');
    if (!menu) return;

    // Alterna a classe 'ativo' para o CSS deslizar o menu
    menu.classList.toggle('ativo');
    
    // Log para você conferir no console do navegador (F12) se o comando está chegando
    console.log("Menu alternado. Classe atual:", menu.className);
}
