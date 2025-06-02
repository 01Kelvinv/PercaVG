const codigosDescricao = {
  A: 'Recolhida Anormal',
  B: 'Trânsito',
  C: 'Falta de Operador',
  D: 'Socorro',
  E: 'Acidente/Incidente',
  F: 'Falta de carro',
  G: 'Revisão',
  H: 'Mal súbito',
  I: 'Programação incompatível',
  J: 'Atraso de garagem',
  K: 'Troca de Linha',
  L: 'Reflexo de Trânsito',
  M: 'Reflexo R.A',
  N: 'Reflexo S.O.S',
  O: 'Falha Operacional',
  P: 'Sem Transmissão'
};

const camposExtrasPorCodigo = {
  A: ['carro', 'local', 'protocolo', 'horarioAbertura', 'defeito, 'Observação' ],
  D: ['carro', 'local', 'protocolo', 'horarioAbertura', 'defeito'],
  B: ['local', 'protocolo', 'horarioAbertura', 'horarioFechamento'],
  E: ['carro', 'local', 'protocolo', 'horarioAbertura', 'motivo'],
  G: ['carro'],
  H: ['carro', 'local', 'protocolo', 'horarioAbertura'],
  K: ['carro', 'paraQualLinhaFoi'],
  M: ['carro'],
  N: ['carro'],
  P: ['carro'],
  O: ['motivo']
};

const codigoInput = document.getElementById('codigo');
const codigoDescricaoDiv = document.getElementById('codigo-descricao');
const camposExtrasDiv = document.getElementById('campos-extras');
const filtroLinhaInput = document.getElementById('filtro-linha');
const filtroSentidoSelect = document.getElementById('filtro-sentido');
const tbody = document.getElementById('lista-percas');
const modal = document.getElementById('modal-edicao');
const camposEdicaoDiv = document.getElementById('campos-edicao');
let indiceEdicaoAtual = null;

function atualizarDescricaoCodigo() {
  const codigo = codigoInput.value.toUpperCase();
  codigoInput.value = codigo;
  codigoDescricaoDiv.textContent = codigosDescricao[codigo] || '';

  // Salvar valores existentes antes de limpar
  const valoresAnteriores = {};
  const inputsAnteriores = camposExtrasDiv.querySelectorAll('input, select, textarea');
  inputsAnteriores.forEach(input => {
    if (input.id) valoresAnteriores[input.id] = input.value;
  });

  camposExtrasDiv.innerHTML = ''; // Limpa campos extras anteriores

  const campos = camposExtrasPorCodigo[codigo];
  if (campos && campos.length > 0) {
    campos.forEach(id => {
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1');

      const input = document.createElement('input');
      input.type = id.toLowerCase().includes('horario') ? 'time' : 'text';
      input.id = id;
      input.name = id;
      input.value = valoresAnteriores[id] || ''; // Restaura valor anterior, se existir

      camposExtrasDiv.appendChild(label);
      camposExtrasDiv.appendChild(input);
    });
  }
}

function carregarPercas() {
  return JSON.parse(localStorage.getItem('percas') || '[]');
}

function salvarPercas(percas) {
  localStorage.setItem('percas', JSON.stringify(percas));
}

function atualizarDataAtual() {
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
}

function renderizarPercas() {
  const todas = carregarPercas();
  const filtroLinha = filtroLinhaInput.value.toLowerCase();
  const filtroSentido = filtroSentidoSelect.value;

  const filtradas = todas.filter(p =>
    (!filtroLinha || p.linha.toLowerCase().includes(filtroLinha)) &&
    (!filtroSentido || p.sentido === filtroSentido)
  );

  filtradas.forEach(p => {
    p._index = todas.indexOf(p);
  });

  tbody.innerHTML = filtradas.length === 0
    ? '<tr><td colspan="5" style="text-align:center">Nenhuma perca lançada.</td></tr>'
    : '';

  filtradas.forEach(p => {
    const tr = document.createElement('tr');
    const detalhes = Object.entries(p)
      .filter(([k]) => !['linha', 'data', 'sentido', 'horario', 'codigo', '_index'].includes(k))
      .map(([k, v]) => `<div><strong>${k.charAt(0).toUpperCase() + k.slice(1)}:</strong> ${v}</div>`)
      .join('');

    tr.innerHTML = `
      <td>${p.linha}</td>
      <td>${p.sentido}</td>
      <td>${p.horario}</td>
      <td><strong>${codigosDescricao[p.codigo] || p.codigo}</strong><div style="font-size:0.85em; color:#555; margin-top:5px;">${detalhes}</div></td>
      <td class="acoes">
        <button class="remover" data-index="${p._index}" onclick="removerPercaFromBtn(this)">Remover</button>
        <button class="copiar" data-index="${p._index}" onclick="copiarPercaFromBtn(this)">Copiar</button>
        <button class="editar" data-index="${p._index}" onclick="editarPercaFromBtn(this)">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function removerPerca(index) {
  const percas = carregarPercas();
  if (!percas[index]) return;
  if (confirm('Remover esta perca?')) {
    percas.splice(index, 1);
    salvarPercas(percas);
    renderizarPercas();
  }
}

function copiarPerca(index) {
  const p = carregarPercas()[index];
  if (!p) return;
  document.getElementById('linha').value = p.linha;
  document.getElementById('sentido').value = p.sentido;
  document.getElementById('horario').value = p.horario;
  document.getElementById('codigo').value = p.codigo;
  atualizarDescricaoCodigo();

  const extras = camposExtrasPorCodigo[p.codigo];
  if (extras) {
    extras.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = p[id] || '';
    });
  }
}

function removerPercaFromBtn(btn) {
  removerPerca(parseInt(btn.dataset.index));
}
function copiarPercaFromBtn(btn) {
  copiarPerca(parseInt(btn.dataset.index));
}

function editarPercaFromBtn(btn) {
  const index = parseInt(btn.dataset.index, 10);
  const perca = carregarPercas()[index];
  if (perca) abrirModalEdicao(perca, index);
}

function abrirModalEdicao(perca, index) {
  indiceEdicaoAtual = index;
  camposEdicaoDiv.innerHTML = '';

  for (const chave in perca) {
    if (chave === '_index') continue;

    const label = document.createElement('label');
    label.textContent = chave.charAt(0).toUpperCase() + chave.slice(1);
    label.setAttribute('for', `edit-${chave}`);

    let input;

    if (chave === 'sentido') {
      input = document.createElement('select');
      input.id = `edit-${chave}`;
      input.dataset.campo = chave;

      const opcoes = ['', 'ida', 'volta'];
      opcoes.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op === '' ? 'Selecione' : op.charAt(0).toUpperCase() + op.slice(1);
        if (op === perca[chave]) option.selected = true;
        input.appendChild(option);
      });
    } else if (chave === 'data') {
      input = document.createElement('input');
      input.type = 'date';
      input.id = `edit-${chave}`;
      input.value = perca[chave];
      input.dataset.campo = chave;
    } else if (chave === 'horario' || chave.toLowerCase().includes('horario')) {
      input = document.createElement('input');
      input.type = 'time';
      input.id = `edit-${chave}`;
      input.value = perca[chave];
      input.dataset.campo = chave;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.id = `edit-${chave}`;
      input.value = perca[chave];
      input.dataset.campo = chave;
    }

    camposEdicaoDiv.appendChild(label);
    camposEdicaoDiv.appendChild(input);
  }

  modal.classList.remove('hidden');
}

document.getElementById('form-edicao').addEventListener('submit', function (e) {
  e.preventDefault();
  const percas = carregarPercas();
  if (indiceEdicaoAtual === null || !percas[indiceEdicaoAtual]) return;

  const inputs = camposEdicaoDiv.querySelectorAll('input, select');
  const atualizada = {};

  inputs.forEach(input => {
    if(input.dataset.campo === 'codigo'){
      atualizada[input.dataset.campo] = input.value.toUpperCase();
    } else {
      atualizada[input.dataset.campo] = input.value;
    }
  });

  percas[indiceEdicaoAtual] = atualizada;
  salvarPercas(percas);
  renderizarPercas();
  fecharModalEdicao();
});

document.getElementById('cancelar-edicao').addEventListener('click', fecharModalEdicao);
function fecharModalEdicao() {
  modal.classList.add('hidden');
  camposEdicaoDiv.innerHTML = '';
  indiceEdicaoAtual = null;
}

function exportarExcel() {
  const percas = carregarPercas();
  if (percas.length === 0) return alert('Nada para exportar!');
  const dados = percas.map(p => {
    const base = {
      Linha: p.linha,
      Data: p.data,
      Sentido: p.sentido,
      Horário: p.horario,
      Código: p.codigo,
      Descrição: codigosDescricao[p.codigo] || ''
    };
    Object.entries(p).forEach(([k, v]) => {
      if (!['linha', 'data', 'sentido', 'horario', 'codigo', '_index'].includes(k)) {
        base[k.charAt(0).toUpperCase() + k.slice(1)] = v;
      }
    });
    return base;
  });
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Percas");
  XLSX.writeFile(wb, "percas.xlsx");
}

function excluirTodasPercas() {
  if (confirm("Deseja apagar todas as percas?")) {
    localStorage.removeItem('percas');
    renderizarPercas();
  }
}

document.getElementById('form-perca').addEventListener('submit', function (e) {
  e.preventDefault();

  const nova = {
    linha: document.getElementById('linha').value.trim(),
    data: document.getElementById('data').value,
    sentido: document.getElementById('sentido').value,
    horario: document.getElementById('horario').value,
    codigo: document.getElementById('codigo').value.toUpperCase()
  };

  const extras = {};
  const inputsExtras = camposExtrasDiv.querySelectorAll('input, select, textarea');
  inputsExtras.forEach(input => {
    if(input.id && input.value.trim() !== '') {
      extras[input.id] = input.value.trim();
    }
  });

  Object.assign(nova, extras);

  const percas = carregarPercas();
  const duplicada = percas.some(p =>
    p.linha === nova.linha && p.sentido === nova.sentido && p.horario === nova.horario
  );
  if (duplicada) return alert('Essa perca já foi lançada.');
  percas.push(nova);
  salvarPercas(percas);
  this.reset();
  atualizarDataAtual();
  renderizarPercas();
});

filtroLinhaInput.addEventListener('input', renderizarPercas);
filtroSentidoSelect.addEventListener('change', renderizarPercas);
window.onload = () => {
  atualizarDataAtual();
  atualizarDescricaoCodigo();
  renderizarPercas();
};

// Alternância de tema claro/escuro
const toggleTemaBtn = document.getElementById('botao-tema');
const temaAtual = localStorage.getItem('tema');

if (temaAtual === 'escuro') {
  document.body.classList.add('tema-escuro');
  toggleTemaBtn.textContent = '☀️ Tema Claro';
}

toggleTemaBtn.addEventListener('click', () => {
  document.body.classList.toggle('tema-escuro');
  const modoEscuroAtivo = document.body.classList.contains('tema-escuro');
  toggleTemaBtn.textContent = modoEscuroAtivo ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  localStorage.setItem('tema', modoEscuroAtivo ? 'escuro' : 'claro');
});
