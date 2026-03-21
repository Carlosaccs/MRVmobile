/* ==========================================================================
   v123 - LÓGICA DE DADOS COMPLETA + INTERAÇÃO AVANÇADA
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

/* 1. CARREGAMENTO DA PLANILHA (Mapeamento Completo) */
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
                // Mapeamos os campos conforme sua lista (0 a 30)
                window.bancoDados[id] = {
                    nomeCurto: c[3]?.replace(/"/g, '').trim(),
                    nomeFull: c[4]?.replace(/"/g, '').trim(),
                    estoque: c[5]?.replace(/"/g, '').trim(),
                    entrega: c[8]?.replace(/"/g, '').trim(),
                    statusObra: c[11]?.replace(/"/g, '').trim(),
                    dica: c[16]?.replace(/"/g, '').trim()
                };
            }
        });
        atualizarVisualizacao();
    } catch (e) { console.error("Erro ao carregar dados."); }
}

/* 2. RENDERIZAÇÃO E INTERAÇÃO */
function desenharMapa(dados, targetId, ehMinimizado) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;

    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    
    if (!ehMinimizado) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        Object.assign(svg.style, { marginRight: conf.marginRight, marginLeft: conf.marginLeft, transform: `scale(${conf.scale})` });
    }

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        const idLimpo = pData.id.toLowerCase();
        const info = window.bancoDados[idLimpo];
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        // Cores Iniciais
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corCinzaEscuro = "#999999"; // Hover do cinza
        const corLaranja = "#ffb347";   // Seleção/Hover do verde

        const corOriginal = (info && pData.class !== "semmrv") ? corVerde : corCinzaClaro;
        
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            // EVENTO: Hover (Passar o Mouse)
            path.onmouseover = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                
                if (corOriginal === corVerde) {
                    path.style.fill = corLaranja;
                } else {
                    path.style.fill = corCinzaEscuro;
                }
            };

            // EVENTO: Out (Sair com o Mouse)
            path.onmouseout = () => {
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = corOriginal;
            };

            // EVENTO: Clique (Selecionar)
            path.onclick = () => {
                // 1. Limpa seleção anterior de todos os paths
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                    p.style.strokeWidth = "1.2";
                });

                // 2. Fixa o novo path como selecionado se for Verde/MRV
                if (corOriginal === corVerde) {
                    path.setAttribute('data-selecionado', 'true');
                    path.style.fill = corLaranja;
                    path.style.strokeWidth = "2";
                    
                    // Atualiza Ficha Técnica
                    document.getElementById('nome-imovel').innerText = info.nomeCurto || info.nomeFull;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p><strong>Estoque:</strong> ${info.estoque} unidades</p>
                        <p><strong>Previsão:</strong> ${info.entrega}</p>
                        <p><strong>Obra:</strong> ${info.statusObra}</p>
                        <hr style="border:0; border-top:1px solid #777">
                        <p style="font-style:italic; font-size:0.9rem">${info.dica}</p>
                    `;
                } else {
                    document.getElementById('nome-imovel').innerText = "Área sem MRV";
                    document.getElementById('detalhes-imovel').innerText = "Esta região não possui empreendimentos ativos no momento.";
                }
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

function atualizarVisualizacao() {
    desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false);
    desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    // Ao trocar, a visualização reseta (limpa o laranja fixo)
    atualizarVisualizacao();
}

window.onload = async () => {
    await carregarPlanilha();
    document.getElementById('mapa-minimizado').onclick = trocarMapas;
};
