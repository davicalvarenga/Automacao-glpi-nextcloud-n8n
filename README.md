# 🚀 Integração GLPI & Nextcloud Talk via n8n

Este repositório contém o fluxo (workflow) exportado do **n8n** projetado para melhorar o tempo de resposta e a gestão de SLA em operações de suporte de TI. Ele integra o **GLPI** (Sistema de Chamados) com o **Nextcloud Talk** (Comunicação), enviando resumos diários de forma proativa para os técnicos.

## 🎯 O Desafio
Em operações com alto volume de chamados, é comum que tickets percam o prazo de SLA devido à falta de visibilidade. Depender de buscas manuais em painéis desgasta a equipe. A ideia aqui é **inverter a lógica**: a prioridade vai até o técnico antes mesmo de ele abrir o painel.

## ✨ Como Funciona (Features)
1. **Autenticação (HTTP Request):** Inicia uma sessão segura na API REST do GLPI.
2. **Busca Ativa:** Consulta todos os chamados abertos/pendentes.
3. **Triagem Avançada (Node.js):** - Traduz IDs do GLPI para dados legíveis (nível de urgência, status).
   - Calcula exatamente há quantos dias o ticket está aberto.
   - Separa os chamados por técnico e identifica os que estão na "Fila Geral" aguardando atribuição.
4. **Notificação (Nextcloud Talk):** Utiliza a API do Spreed/Talk para enviar os relatórios diários paginados e individuais em DMs ou grupos.
5. **Segurança:** Encerra a sessão do GLPI (`Kill Session`) ao finalizar o fluxo.

## 🤝 Agradecimentos
Uma menção especial ao meu colega de equipe **[@NomeDoAmigo]** que foi fundamental na estruturação dos nós de **HTTP Request**, ajudando a configurar os métodos (GET/POST), injetar headers de autorização (`App-Token`, `Session-Token`) e tratar os payloads para a API do Nextcloud Talk!

## 🛠️ Tecnologias Utilizadas
- [n8n](https://n8n.io/)
- GLPI (API REST)
- Nextcloud Talk (Spreed API)
- JavaScript (Node.js)

## 📦 Como Importar e Usar

1. Baixe o arquivo `Notificacao_GLPI_Talk.json` deste repositório.
2. No seu n8n, vá em **Workflows**, clique na engrenagem no canto superior direito e selecione **Import from File...**
3. **Configure as Credenciais:** Substitua as informações genéricas no fluxo pelas suas reais:
   - `seu-glpi.local` e `seu-nextcloud.local` pelas URLs dos seus servidores.
   - Nos nós de HTTP Request, adicione seu `App-Token`, `user_token` do GLPI e o token em Base64 do bot do Nextcloud.
   - No nó **"4. Agrupar por Técnico" (Code)**, edite o objeto `mapaTecnicos` com os IDs do seu GLPI e os Tokens de conversa correspondentes do Talk.

## 📱 Exemplo de Notificação

O resultado entregue no chat do técnico ficará assim:

> Olá! 🚀
> Você tem **12** chamado(s) pendente(s) na sua fila. Confira o resumo:
> 
> 🎫 **[#12345]** Visita técnica para verificar máquina.
> 🏢 **Cliente:** Empresa Fictícia S/A
> 🚥 **Status:** Em Atendimento
> 🚨 **Urgência:** 🟡 Média
> ⏳ **Aberto há:** 1 dia(s)
> 🔗 **Link:** http://seu-glpi.local/front/ticket.form.php?id=12345
> 
> ---
> 
> 🎫 **[#12346]** Instalação de novo roteador no setor financeiro.
> 🏢 **Cliente:** Cliente Exemplo Ltda
> 🚥 **Status:** Novo
> 🚨 **Urgência:** 🟠 Alta
> ⏳ **Aberto há:** 0 dia(s)
> 🔗 **Link:** http://seu-glpi.local/front/ticket.form.php?id=12346

---
*Gostou da solução? Deixe uma ⭐ neste repositório!*
