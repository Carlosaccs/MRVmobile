/* ==========================================================================
   BLOCO 01: CONFIGURAÇÕES E SELEÇÃO (ESTILO v27)
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const svgNS = "http://www.w3.org/2000/svg";
// URL da sua planilha MRV atualizada
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* ==========================================================================
   BLOCO 10: MOTOR DA PLANILHA (ADAPTADO PARA FICHA TÉCNICA)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1);
        
        // Criamos um mapa de dados na memória para consulta rápida
        window.dadosEmpreendimentos = {};

        linhas.forEach(linha => {
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (col.length < 5) return;

            const idPath = col[0].replace(/"/g, '').trim();
            window.dadosEmpreendimentos[idPath] = {
                nome: col[3]?.replace(/"/g, '').trim() || "Sem Nome",
                estoque: col[5]?.replace(/"/g, '').trim() || "0"
            };
        });
        console.log("Bloco 10: Dados da Planilha sincronizados.");
    } catch (e) { console.error("Erro Bloco 10:", e); }
}

/* ==========================================================================
   BLOCO 30: RENDERIZAÇÃO DO MAPA (LÓGICA v27 PURA)
   ========================================================================== */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) return;
    
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        
        // Cores originais v27
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.setAttribute('data-original-fill', corBase);
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";

        // Interação de Clique (Atualiza a Ficha Técnica Cinza)
        path.onclick = () => {
            // Reseta cores
            document.querySelectorAll('#mapa-container path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            
            // Destaca selecionado
            path.style.fill = "#ff8c00";
            
            // Busca dados da planilha salvos no Bloco 10
            const info = window.dadosEmpreendimentos ? window.dadosEmpreendimentos[pData.id] : null;
            
            const txtNome = document.getElementById('nome-imovel');
            const txtDetalhes = document.getElementById('detalhes-imovel');
            
            if (info) {
                txtNome.innerText = info.nome;
                txtDetalhes.innerText = `Restam apenas ${info.estoque} unidades neste residencial.`;
            } else {
                txtNome.innerText = pData.id.replace(/-/g, ' ').toUpperCase();
                txtDetalhes.innerText = "Residencial selecionado.";
            }
        };

        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
    console.log("Bloco 30: Mapa v39 renderizado.");
}

/* ==========================================================================
   BLOCO 40: INICIALIZAÇÃO (HÍBRIDA)
   ========================================================================== */
window.onload = () => {
    // 1. Carrega o visual do mapa
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        console.error("MAPA_GSP não encontrado!");
    }
    
    // 2. Carrega os dados da planilha em segundo plano
    carregarDadosPlanilha();
};
