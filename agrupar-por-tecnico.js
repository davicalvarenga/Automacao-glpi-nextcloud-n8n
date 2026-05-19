const chamadosPorTecnico = {};
const chamadosNaoAtribuidos = []; 

const statusMap = {
  1: "Novo",
  2: "Em Atendimento",
  3: "Planejado",
  4: "Pendente"
};

const urgenciaMap = {
  1: "⚪ Muito Baixa",
  2: "🟢 Baixa",
  3: "🟡 Média",
  4: "🟠 Alta",
  5: "🔴 Muito Alta"
};

// Substitua pelo Token da conversa de cada técnico no Nextcloud Talk e o ID correspondente do GLPI
const mapaTecnicos = {
  'ID_TEC_1': 'TOKEN_TALK_1', // tecnico_1
  'ID_TEC_2': 'TOKEN_TALK_2', // tecnico_2
  'ID_TEC_3': 'TOKEN_TALK_3', // tecnico_3
};

const chamados = $input.first().json.data || [];
const hoje = new Date();
const diaDaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça...

// --- PROCESSAR CHAMADOS ---
for (const chamado of chamados) {
  const id = chamado["2"];
  const titulo = chamado["1"];
  const empresa = chamado["80"] || "Empresa não informada";
  const status = chamado["12"];
  
  if (status == 5 || status == 6) continue; 
  
  const dataCriacao = chamado["15"];
  let diasAberto = 0;
  if (dataCriacao) {
    const dataChamado = new Date(dataCriacao);
    const diferencaTempo = Math.abs(hoje - dataChamado);
    diasAberto = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));
  }
  
  const idUrgencia = chamado["10"]; 
  const urgenciaTraduzida = urgenciaMap[idUrgencia] || "Não informada";
  const statusTraduzido = statusMap[status] || status;

  let tecnicosDoChamado = chamado["5"];
  if (!tecnicosDoChamado) {
    tecnicosDoChamado = [];
  } else if (!Array.isArray(tecnicosDoChamado)) {
    tecnicosDoChamado = [tecnicosDoChamado];
  }
  
  const objChamado = {
    id: id,
    titulo: titulo,
    empresa: empresa,
    status: statusTraduzido,
    urgencia: urgenciaTraduzida,
    diasAberto: diasAberto       
  };

  if (tecnicosDoChamado.length === 0) {
    chamadosNaoAtribuidos.push(objChamado);
  } else {
    for (const idTec of tecnicosDoChamado) {
      const idLimpo = String(idTec).trim();
      const tokenTalk = mapaTecnicos[idLimpo];
      
      if (tokenTalk) {
        if (!chamadosPorTecnico[tokenTalk]) {
          chamadosPorTecnico[tokenTalk] = [];
        }
        chamadosPorTecnico[tokenTalk].push(objChamado);
      }
    }
  }
}

// --- MONTAR AS MENSAGENS ---
function formatarLista(lista) {
  return lista.map(c => 
    `🎫 **[#${c.id}]** ${c.titulo}\n` +
    `🏢 **Cliente:** ${c.empresa}\n` +
    `🚥 **Status:** ${c.status}\n` +
    `🚨 **Urgência:** ${c.urgencia}\n` +
    `⏳ **Aberto há:** ${c.diasAberto} dia(s)\n` +
    `🔗 **Link:** http://seu-glpi.local/front/ticket.form.php?id=${c.id}`
  ).join('\n\n---\n\n');
}

const resultados = [];

// 1. Criar mensagem para as Filas Individuais (BLOQUEADO NA QUINTA-FEIRA)
if (diaDaSemana !== 4) {
  for (const [token, lista] of Object.entries(chamadosPorTecnico)) {
    if (lista.length > 0) {
        const textoLista = formatarLista(lista);
        
        const msgTecnico = `Olá! 🚀\n\nVocê tem **${lista.length}** chamado(s) pendente(s) na sua fila. Confira o resumo:\n\n---\n\n${textoLista}\n\n---\n\nDê os devidos andamentos e atribua corretamente!\n\nBom trabalho e foco nas prioridades!`;
        
        resultados.push({ 
          json: { 
            mensagem_pronta: msgTecnico,
            token_conversa: token 
          } 
        });
    }
  }
}

// 2. Criar a mensagem da Fila Geral COM PAGINAÇÃO (SOMENTE SEGUNDA-FEIRA e QUINTA-FEIRA)
if (chamadosNaoAtribuidos.length > 0 && (diaDaSemana === 1 || diaDaSemana === 4)) {
  
  const tamanhoLote = 15;
  const totalLotes = Math.ceil(chamadosNaoAtribuidos.length / tamanhoLote);
  
  // IDs dos responsáveis pela triagem
  const idsResponsaveisTriagem = ['ID_TEC_1', 'ID_TEC_2']; 

  for (let i = 0; i < totalLotes; i++) {
    const lote = chamadosNaoAtribuidos.slice(i * tamanhoLote, (i + 1) * tamanhoLote);
    const textoNaoAtribuidos = formatarLista(lote);
    
    let msgFilaGeral = '';

    if (i === 0) {
      msgFilaGeral = `⚠️ **TRIAGEM PENDENTE (Parte ${i + 1}/${totalLotes}):**\nOlá! No momento, temos **${chamadosNaoAtribuidos.length} chamado(s)** na fila geral aguardando atribuição. Por favor, verifiquem:\n\n---\n\n${textoNaoAtribuidos}\n\n---`;
    } else {
      msgFilaGeral = `⚠️ **TRIAGEM PENDENTE (Parte ${i + 1}/${totalLotes}):**\nContinuação da lista da Fila Geral:\n\n---\n\n${textoNaoAtribuidos}\n\n---`;
    }
    
    // Envia a mesma página da Fila Geral para todos os responsáveis da lista
    for (const idResp of idsResponsaveisTriagem) {
      const tokenResp = mapaTecnicos[idResp];
      
      if (tokenResp) {
        resultados.push({ 
          json: { 
            mensagem_pronta: msgFilaGeral,
            token_conversa: tokenResp 
          } 
        });
      }
    }
  }
}

return resultados;
