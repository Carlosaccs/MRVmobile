/* ==========================================================================
   v122 - CONEXÃO GOOGLE SHEETS + MAPA DINÂMICO
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
window.bancoDados = {}; // Repositório global de dados da planilha

// AJUSTES DE POSICIONAMENTO (Mantendo a blindagem da v121)
const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

/* --------------------------------------------------------------------------
   FUNÇÃO: Busca dados na Planilha e converte CSV em Objeto
   -------------------------------------------------------------------------- */
async function carregarPlanilha() {
    try {
        const res = await fetch(URL_PLANILHA);
        const csv = await res.text();
        
        // Converte CSV em linhas, ignorando o cabeçalho
        const linhas = csv.split('\n').slice(1);
        
        linhas.forEach(linha => {
            // Regex para lidar com possíveis vírgulas dentro de aspas nos nomes
            const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (colunas.length >= 4) {
                const idRegiao = colunas[0].replace(/"/g, '').trim().toLowerCase();
                window.bancoDados[idRegiao] = {
                    nome: colunas[3]?.replace(/"/g, '').trim() || "Empreendimento",
                    estoque: colunas[5]?.replace(/"/g, '').trim() || "Consulte",
                    status: colunas[4]?.replace(/"/g, '').trim() || ""
                };
            }
        });
        console.log("Banco de dados atualizado via Sheets");
        // Re-desenha o mapa inicial agora com os dados carregados
        atualizarVisualizacao();
    } catch (e) {
        console.error("Erro ao conectar com Google Sheets:", e);
    }
}

/* --------------------------------------------------------------------------
   FUNÇÃO: Desenha o SVG e associa aos Dados
   -------------------------------------------------------------------------- */
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
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        // Lógica de Cor: Se o ID existe na planilha e tem estoque, fica verde
        const info = window.bancoDados[idLimpo];
        const corBase = (info && pData.class !== "semmrv") ? "#00713a" : "#cccccc";
        
        path.style.fill = corBase;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.5";

        if (!ehMinimizado) {
            path.setAttribute('data-fill-original', corBase);
            path.style.cursor = info ? "pointer" : "default";

            path.onclick = () => {
                // Reset de cores
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.style.fill = p.getAttribute('data-fill-original');
                });

                if (info) {
                    path.style.fill = "#ffb347"; // Destaque laranja ao clicar
                    document.getElementById('nome-imovel').innerText = info.nome;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <strong>Região:</strong> ${idLimpo.toUpperCase()}<br>
                        <strong>Unidades:</strong> ${info.estoque}<br>
                        <small>Status: ${info.status}</small>
                    `;
                } else {
                    document.getElementById('nome-imovel').innerText = "Selecione";
                    document.getElementById('detalhes-imovel').innerText = "Sem dados para esta região.";
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
    atualizarVisualizacao();
}

// Inicialização
window.onload = async () => {
    // Primeiro carrega os dados, o desenho acontece dentro do carregarPlanilha
    await carregarPlanilha();
    document.getElementById('mapa-minimizado').onclick = trocarMapas;
};
