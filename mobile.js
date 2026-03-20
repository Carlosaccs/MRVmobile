/* ==========================================================================
   CONFIGURAÇÕES E SELETORES (Sincronizados com v26)
   ========================================================================== */
const containerMapa = document.getElementById('mapa-container');
const listaBotoes = document.getElementById('lista-botoes');
const fichaNome = document.getElementById('nome-imovel');
const fichaDetalhes = document.getElementById('detalhes-imovel');
const svgNS = "http://www.w3.org/2000/svg";

// URL da planilha publicada como CSV
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
    // 1. Carrega o mapa inicial (Grande SP)
    if (typeof MAPA_GSP !== 'undefined') {
        renderizarMapa(MAPA_GSP);
    } else {
        containerMapa.innerHTML = "Erro: Arquivo mapa-SP.js não encontrado.";
    }
    
    // 2. Carrega os botões da planilha
    carregarDadosPlanilha();
};

/* ==========================================================================
   MOTOR DA PLANILHA (Criação dos Botões)
   ========================================================================== */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1); // Pula cabeçalho

        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

      linhas.forEach(linha => {
    const col = linha.split(',');
    if (col.length < 5) return;

    const registro = {
        reg: col[13]?.trim() || "",        // Ex: ZS
        nomeCurto: col[3]?.trim() || "",   // Ex: Estoril
        preco: col[4]?.trim() || "",       // Ex: R$ 250.000
        estoque: col[5]?.trim() || "0"     // Ex: 83
    };

    const btn = document.createElement('div');
    btn.className = 'btn-empreendimento';
    
    // HTML limpo: Nome em destaque e Preço/Estoque embaixo
    btn.innerHTML = `
        <div style="color: #00713a; font-size: 1.1rem; font-weight: 800; margin-bottom: 5px;">
            ${registro.reg} ${registro.nomeCurto}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="color: #333; font-weight: bold; font-size: 0.9rem;">${registro.preco}</span>
            <span style="color: #888; font-size: 0.7rem; font-weight: normal;">RESTAM ${registro.estoque} UN.</span>
        </div>
    `;

    btn.onclick = () => selecionarEmpreendimento(registro, btn);
    listaBotoes.appendChild(btn);
});
    } catch (e) {
        console.error("Erro ao ler planilha:", e);
    }
}

function selecionarEmpreendimento(reg, elemento) {
    // Destaque no botão
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    elemento.classList.add('ativo');

    // Atualiza a ficha
    fichaNome.innerText = reg.nomeCurto;
    fichaDetalhes.innerHTML = `<p>${reg.desc}</p><p><strong>Regional:</strong> ${reg.reg}</p>`;

    // Pinta o mapa
    document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
    const shape = document.getElementById(reg.idPath);
    if (shape) { 
        shape.style.fill = "#ff8c00"; // Laranja ao clicar
    }
}

/* ==========================================================================
   MOTOR DO MAPA (SVG)
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
        path.style.fill = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.stroke = "#ffffff";
        path.style.strokeWidth = "2";
        path.style.cursor = "pointer";
        
        path.onclick = () => {
            fichaNome.innerText = pData.name;
            document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
            path.style.fill = "#ff8c00";
        };
        g.appendChild(path);
    });

    svg.appendChild(g);
    containerMapa.innerHTML = "";
    containerMapa.appendChild(svg);
}

// Abre/Fecha Menu
document.querySelector('.icon-bottom').onclick = () => {
    document.getElementById('menu-empreendimentos').classList.toggle('aberto');
};
