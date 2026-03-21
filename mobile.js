/* ==========================================================================
   v124 - LÓGICA DE TEXTO DINÂMICO + LARANJA VIVO
   ========================================================================== */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeSelecionada = ""; // Armazena o nome da cidade clicada
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// ... carregarPlanilha() igual à v123 ...

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
        const nomeCidade = pData.name || idLimpo; // Pega o campo "name" do objeto path
        
        path.setAttribute("d", pData.d);
        path.setAttribute("id", (ehMinimizado ? 'mini-' : '') + pData.id);
        
        // Cores v124
        const corVerde = "#00713a";
        const corCinzaClaro = "#cccccc";
        const corCinzaEscuro = "#888888";
        const corLaranjaVivo = "#FF4500"; // Laranja mais vibrante solicitado

        const corOriginal = (info && pData.class !== "semmrv") ? corVerde : corCinzaClaro;
        
        path.style.fill = corOriginal;
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = ehMinimizado ? "6" : "1.2";
        path.setAttribute('data-cor-base', corOriginal);

        if (!ehMinimizado) {
            // EVENTO: Hover (Passar o Mouse)
            path.onmouseover = () => {
                document.getElementById('identificador-cidade').innerText = nomeCidade;
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = (corOriginal === corVerde) ? corLaranjaVivo : corCinzaEscuro;
            };

            // EVENTO: Out (Sair com o Mouse)
            path.onmouseout = () => {
                // Se houver algo clicado, volta o texto para o clicado, senão limpa
                document.getElementById('identificador-cidade').innerText = cidadeSelecionada;
                
                if (path.getAttribute('data-selecionado') === 'true') return;
                path.style.fill = corOriginal;
            };

            // EVENTO: Clique (Selecionar)
            path.onclick = () => {
                // Reseta todos
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                // Define a seleção
                path.setAttribute('data-selecionado', 'true');
                path.style.fill = corLaranjaVivo;
                cidadeSelecionada = nomeCidade; // Atualiza a variável global de seleção
                document.getElementById('identificador-cidade').innerText = nomeCidade;

                if (info) {
                    document.getElementById('nome-imovel').innerText = info.nomeCurto || info.nomeFull;
                    document.getElementById('detalhes-imovel').innerHTML = `
                        <p><strong>Estoque:</strong> ${info.estoque}</p>
                        <p><strong>Status:</strong> ${info.statusObra}</p>
                        <p><strong>Dica:</strong> ${info.dica}</p>
                    `;
                } else {
                    document.getElementById('nome-imovel').innerText = nomeCidade;
                    document.getElementById('detalhes-imovel').innerText = "Região sem residenciais MRV.";
                }
            };
        }
        g.appendChild(path);
    });

    svg.appendChild(g);
    container.appendChild(svg);
}

// Reseta a variável ao trocar mapas para não ficar o nome de uma cidade do mapa anterior
function trocarMapas() {
    mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP";
    cidadeSelecionada = ""; 
    document.getElementById('identificador-cidade').innerText = "";
    atualizarVisualizacao();
}
// ... restante igual ...
