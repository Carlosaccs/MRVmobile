/* BLOCO 01: CONFIGURAÇÕES */
const containerMapa = document.getElementById('mapa-container');
const listaBotoes = document.getElementById('lista-botoes');
const menuEmp = document.getElementById('menu-empreendimentos');
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv'; 

/* BLOCO 10: MOTOR DA PLANILHA */
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1);
        if (!listaBotoes) return;
        listaBotoes.innerHTML = '';

        linhas.forEach(linha => {
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (col.length < 5) return;

            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),
                zona: col[1]?.replace(/"/g, '').trim().toUpperCase() || "",
                nomeExibicao: col[3].replace(/"/g, '').trim(),
                estoque: col[5]?.replace(/"/g, '').trim() || "0"
            };

            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            btn.setAttribute('data-zona', registro.zona);
            btn.innerHTML = `
                <div style="color: #333; font-size: 0.85rem; font-weight: 800;">${registro.nomeExibicao}</div>
                <div style="margin-top: 4px; color: #666; font-size: 0.65rem;">RESTAM ${registro.estoque} UNIDADES</div>
            `;
            btn.onclick = () => selecionarEmpreendimento(registro, btn);
            listaBotoes.appendChild(btn);
        });
    } catch (e) { console.error("Erro no JS v32:", e); }
}

/* BLOCO 30: MOTOR DO MAPA */
function renderizarMapa(dados) {
    if (!containerMapa || !dados) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", dados.transform);

    dados.paths.forEach(pData => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pData.d);
        path.setAttribute("id", pData.id);
        const cor = pData.class === "semmrv" ? "#cccccc" : "#00713a";
        path.style.fill = cor;
        path.style.stroke = "#fff"; path.style.strokeWidth = "2";
        g.appendChild(path);
    });
    svg.appendChild(g);
    containerMapa.innerHTML = ""; containerMapa.appendChild(svg);
}

/* BLOCO 40: INICIALIZAÇÃO */
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

function selecionarEmpreendimento(reg, el) {
    document.querySelectorAll('.btn-empreendimento').forEach(b => b.classList.remove('ativo'));
    el.classList.add('ativo');
    document.querySelectorAll('path').forEach(p => p.style.fill = "#00713a");
    const shape = document.getElementById(reg.idPath);
    if(shape) shape.style.fill = "#ff8c00";
}
