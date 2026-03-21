/* ==========================================================================
   BLOCO 01: CONFIGURAÇÕES GERAIS
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const listaBotoes = document.getElementById('lista-botoes');
const menuEmp = document.getElementById('menu-empreendimentos');
const fichaNome = document.getElementById('nome-imovel');
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* ==========================================================================
   BLOCO 10: MOTOR DA PLANILHA (MAPEAMENTO DE COLUNAS)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1); // Pula cabeçalho
        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            // Regex para separar por vírgula respeitando aspas internas
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (col.length < 5) return;

            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),
                zona: col[1]?.replace(/"/g, '').trim().toUpperCase() || "", // Coluna B (Para o CSS v34.1)
                valor: col[2]?.replace(/"/g, '').trim() || "",              // Coluna C (R$)
                nome: col[3]?.replace(/"/g, '').trim() || "Sem Nome",       // Coluna D (Nome Principal)
                estoque: col[5]?.replace(/"/g, '').trim() || "0"            // Coluna F (Quantidade)
            };

            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            btn.setAttribute('data-zona', registro.zona); // Essencial para a cor da borda
            
            // HTML Interno do botão (Preço em cima, Nome no meio, Estoque embaixo)
            btn.innerHTML = `
                <div style="color: #666; font-size: 0.7rem; font-weight: bold;">${registro.valor}</div>
                <div style="color: #333; font-size: 0.9rem; font-weight: 800; margin-top: 2px;">${registro.nome}</div>
                <div style="margin-top: 5px; color: #888; font-size: 0.65rem;">RESTAM ${registro.estoque} UNIDADES</div>
            `;
            
            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro v34:", e); }
}

/* ==========================================================================
   BLOCO 20: INTERAÇÃO (Clique no Botão)
   ========================================================================== */
function selecionarEmpreendimento(reg, el) {
    // 1. Destaque Visual no Botão
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    el.classList.add('ativo');

    // 2. Atualiza a Ficha Técnica
    if(fichaNome) fichaNome.innerText = reg.nome;

    // 3. Pinta o mapa (Laranja no selecionado, Verde nos outros)
    document.querySelectorAll('path').forEach(p => {
        const corOriginal = p.getAttribute('data-original-fill') || "#00713a";
        p.style.fill = corOriginal;
    });

    const shape = document.getElementById(reg.idPath);
    if (shape) { shape.style.fill = "#ff8c00"; } // Laranja MRV
}

/* ==========================================================================
   BLOCO 30: MOTOR DO MAPA (SVG)
   ========================================================================== */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) return;
    
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        
        const corBase = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = corBase;
        path.setAttribute('data-original-fill', corBase);
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        
        path.onclick = () => {
            if(fichaNome) fichaNome.innerText = pData.name;
            document.querySelectorAll('path').forEach(p => {
                p.style.fill = p.getAttribute('data-original-fill');
            });
            path.style.fill = "#ff8c00"; 
        };
        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

/* ==========================================================================
   BLOCO 40: INICIALIZAÇÃO E EVENTOS
   ========================================================================== */
window.onload = () => {
    if (typeof MAPA_GSP !== 'undefined') renderizarMapa(MAPA_GSP);
    carregarDadosPlanilha();
};

const btnMenu = document.querySelector('.icon-bottom');
if(btnMenu) {
    btnMenu.onclick = () => {
        if(menuEmp) menuEmp.classList.toggle('aberto');
    };
}
