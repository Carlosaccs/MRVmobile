// Mantenha a URL da sua planilha aqui
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

async function carregarDadosPlanilha() {
    try {
        const response = await fetch(URL_PLANILHA_CSV);
        const csvText = await response.text();
        const linhas = csvText.split('\n').slice(1);
        const lista = document.getElementById('lista-botoes');
        if (!lista) return;
        lista.innerHTML = '';

        linhas.forEach(linha => {
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (col.length < 5) return;
            const registro = {
                idPath: col[0].replace(/"/g, '').trim(),
                nome: col[3]?.replace(/"/g, '').trim() || "Sem Nome",
                estoque: col[5]?.replace(/"/g, '').trim() || "0"
            };
            const btn = document.createElement('div');
            btn.className = 'btn-empreendimento';
            btn.innerHTML = `<strong>${registro.nome}</strong><br><small>RESTAM ${registro.estoque} UNIDADES</small>`;
            btn.onclick = () => {
                document.querySelectorAll('path').forEach(p => p.style.fill = p.getAttribute('data-original-fill'));
                const shape = document.getElementById(registro.idPath);
                if (shape) shape.style.fill = "#ff8c00";
            };
            lista.appendChild(btn);
        });
    } catch (e) { console.error("Erro v37:", e); }
}

function renderizarMapa(dados) {
    const container = document.getElementById('mapa-container');
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
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
        g.appendChild(path);
    });
    svg.appendChild(g);
    container.innerHTML = "";
    container.appendChild(svg);
}

window.onload = () => {
    if (typeof MAPA_GSP !== 'undefined') renderizarMapa(MAPA_GSP);
    carregarDadosPlanilha();
};
