/* ==========================================================================
   v132 - JS CONSOLIDADO: TOUCH ATIVO + DESTAQUE FILTRADO
   ========================================================================== */

// 1. Configurações Iniciais e Variáveis Globais
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeSelecionada = ""; 
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// 2. Carregamento de Dados da Planilha
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        const linhas = csv.split('\n').slice(1);
        window.bancoDados = {};
        linhas.forEach(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 5) {
                const id = c[0].replace(/"/g, '').trim().toLowerCase();
                window.bancoDados[id] = {
                    nomeCurto: c[3]?.replace(/"/g, '').trim(),
                    nomeFull: c[4]?.replace(/"/g, '').trim(),
                    estoque: c[5]?.replace(/"/g, '').trim(),
                    statusObra: c[11]?.replace(/"/g, '').trim()
                };
            }
        });
    } catch (e) { 
        console.warn("Aviso: Planilha offline ou erro de conexão."); 
    }
    // Desenha os mapas após tentar carregar os dados
    atualizarVisualizacao();
}

// 3. Função de Construção do Mapa SVG
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    // Aplica zoom e margens no mapa principal
    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight;
        svg.style.marginLeft = conf.marginLeft;
        svg.style.transform = `scale(${conf.scale})`;
    }

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    // 4. Renderização dos Paths (Cidades)
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
        const corOriginal = ehMRV ? corVerde : corCinzaClaro;

        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        // 5. Lógica de Interação (Apenas para o mapa principal)
        if (!ehMinimizado) {
            
            // Sub-função para ativar o destaque e o nome
            const ativarFoco = () => {
                if (ehMRV) {
                    const display = document.getElementById('identificador-cidade');
                    if(display) display.innerText = nomeCidade;
                    if (path.getAttribute('data-selecionado') !== 'true') {
                        path.style.fill = corLaranjaVivo;
                    }
                }
            };

            // Sub-função para remover o destaque
            const desativarFoco = () => {
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                if (path.getAttribute('data-selecionado') !== 'true') {
                    path.style.fill = corOriginal;
                }
            };

            // Eventos de Mouse (Notebook)
            path.onmouseover = ativarFoco;
            path.onmouseout = desativarFoco;

            // EVENTO DE TOQUE (Celular) - Adicionado para v132
            path.ontouchstart = (e) => {
                ativarFoco();
            };

            // Evento de Clique (Seleção Definitiva)
            path.onclick = () => {
                if (!ehMRV) return;

                // Limpa seleções anteriores
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                // Define nova seleção
                path.setAttribute('data-selecionado', 'true');
                path.style.fill = corLaranjaVivo;
                cidadeSelecionada = nomeCidade;
                
                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;

                // Atualiza Ficha Técnica
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

// 6. Funções de Controle de Visualização
function atualizarVisualizacao() {
    if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
        desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
        desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
    }
}

// 7. Troca entre GSP e Interior
function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = "";
    const display = document.getElementById('identificador-cidade');
    if(display) display.innerText = "";
    atualizarVisualizacao();
}

// 8. Inicialização
window.onload = carregarPlanilha;

// Ouvinte Global para o Mini Mapa
document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
