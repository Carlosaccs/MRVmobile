/* ==========================================================================
   v136 - DESAFIO TOUCH: EFEITO HOVER NO CELULAR (ESTÁVEL)
   ========================================================================== */

// 1. Configurações Iniciais
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let cidadeSelecionada = ""; 
window.bancoDados = {}; 

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

// 2. Carregamento de Dados
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
    } catch (e) { console.warn("Planilha Offline"); }
    atualizarVisualizacao();
}

// 3. Função de Desenho
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
            
            const ativarFoco = (e) => {
                // Não interrompe se já estiver selecionado
                if (path.getAttribute('data-selecionado') === 'true') return;

                if (e && e.type === 'touchstart' && e.cancelable) {
                    // Não usamos preventDefault aqui para permitir que o 'click' ainda ocorra
                }

                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = nomeCidade;
                
                path.style.fill = ehMRV ? corLaranjaVivo : corCinzaEscuro;
            };

            const desativarFoco = () => {
                // SÓ limpa se o path NÃO for o selecionado atual
                if (path.getAttribute('data-selecionado') === 'true') return;

                const display = document.getElementById('identificador-cidade');
                if(display) display.innerText = cidadeSelecionada;
                path.style.fill = corOriginal;
            };

            // Eventos de Mouse
            path.onmouseover = ativarFoco;
            path.onmouseout = desativarFoco;

            // Eventos de Toque
            path.ontouchstart = ativarFoco;
            path.ontouchend = () => {
                // O "Pulo do Gato": Se for verde, ele não limpa no timer, 
                // espera o 'onclick' decidir se trava ou não.
                if (!ehMRV) {
                    setTimeout(desativarFoco, 1200); // 1.2s para os cinzas
                } else {
                    // Para os verdes, só limpa se o usuário não tiver clicado de fato
                    setTimeout(() => {
                        if (path.getAttribute('data-selecionado') !== 'true') {
                            desativarFoco();
                        }
                    }, 1200);
                }
            };

            path.onclick = (e) => {
                if (!ehMRV) return;

                // 1. Limpa TODOS os paths antes de marcar o novo
                document.querySelectorAll('#mapa-container path').forEach(p => {
                    p.setAttribute('data-selecionado', 'false');
                    p.style.fill = p.getAttribute('data-cor-base');
                });

                // 2. Trava o path atual como selecionado
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

// 5. Controles Finais
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

window.onload = carregarPlanilha;

document.addEventListener('click', (e) => {
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});
