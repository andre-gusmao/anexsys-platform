# Fluxo de status da Ordem de Serviço

**Atualizado em:** 05/10/2026 (tarde)
**Substitui:** os ciclos de vida de status da documentação antiga (`docs/arquivo/`). Baseado em `02-decisoes-do-andre.md`.
**Situação:** o fluxo abaixo é o **desenho decidido**. **Ainda não está construído**: hoje o sistema só tem os status Em aberto, Aprovada e Cancelada para a OS. Pontos marcados **[EM ABERTO]** ou **[ASSUMIDO]** aguardam resposta do André.

## 1. O caminho da OS, do balcão à retirada

```
ATENDIMENTO            APROVAÇÃO               SACOLA + OP IMPRESSA       PRODUÇÃO               QUALIDADE             RETIRADA
Cliente chega,    ->   Cliente assina   ->    Peças vão numa sacola  ->  Técnico lê o QR   ->   Revisor lê o QR  ->  Cliente retira,
mede, OS é aberta      no link "concordo      (até 5 peças) com a OP     ao pegar e ao          ao pegar; aprova      assina na tela e
e vai por WhatsApp     com serviço e preço"   impressa no bolso          terminar               ou reprova            lê-se o QR
(Em aberto)                                   (QR grande)
```

## 2. Etapas, em palavras

1. **Atendimento e abertura da OS.** O atendente cadastra o cliente (nome e WhatsApp obrigatórios), as peças e os serviços. A OS nasce com o status **Em aberto** (público). Não há etiqueta nem leitura de QR nesta etapa. O sistema envia a **primeira mensagem de WhatsApp** com o **link público** de acompanhamento e aprovação.
2. **Medição das roupas.** Acontece no atendimento. **Não é status**, não gera QR e não manda WhatsApp.
3. **Aprovação do cliente.** O cliente **assina** "concordo com o serviço e o preço" no link público. **Não é status**: a OS continua **Em aberto**. A medida usada fica travada na aprovação.
4. **Sacola e esteira.** As peças vão para uma **sacola física** (sem controle no sistema, **até 5 peças por OS**) com um bolso transparente que leva a **Ordem de Produção impressa**, com o **QR code** grande. A sacola vai para a esteira "a fazer", por ordem de chegada.
5. **Produção.** O técnico pega a sacola e **lê o QR**. O status passa a **Em produção** (público), com **data, hora e técnico** registrados (produtividade). Costura, ajuste, acabamento e passadoria acontecem **dentro** deste status. Ao terminar, o técnico lê o QR de novo e leva a sacola à esteira de finalizadas. O status passa a **Aguardando controle de qualidade** (público).
6. **Controle de qualidade.** O revisor tira a sacola da esteira e **lê o QR**: **Controle de qualidade** (público). **Aprova** (vai para Pronto para retirada) ou **reprova** (vai para Reprovado pela qualidade).
7. **Pronto para retirada.** Status **público**. Sai a **segunda mensagem de WhatsApp**.
8. **Retirada.** O cliente informa o número da OS ou o nome, o atendente confere e **lê o QR**, e o cliente **assina eletronicamente** que retirou. Status **Retirado pelo cliente** (público).

## 3. Catálogo inicial de status

| # | Status | Visibilidade | Quem lê o QR | Vai para | Observações |
|---|---|---|---|---|---|
| 1 | Em aberto | Público | Ninguém (nasce na criação) | Em produção | WhatsApp 1. A aprovação do cliente não muda o status |
| 2 | Em produção | Público | Técnico, ao pegar a sacola | Aguardando controle de qualidade | Grava data, hora e técnico |
| 3 | Aguardando controle de qualidade | Público | Técnico, ao terminar | Controle de qualidade | |
| 4 | Controle de qualidade | Público | Revisor | Pronto para retirada (aprova) ou Reprovado pela qualidade (reprova) | |
| 5 | Pronto para retirada | Público | Ninguém | Retirado pelo cliente | WhatsApp 2 |
| 6 | Retirado pelo cliente | Público | Atendente, na retirada | Fim | Assinatura eletrônica |
| X1 | Reprovado pela qualidade | **Interno** | Técnica que fará a refação | Em refação | Único retorno permitido. O cliente nunca sabe |
| X2 | Em refação | **Interno** | Técnica, ao terminar | Aguardando controle de qualidade | Grava quem refez. Só uma sacola por vez |

## 4. Regras do catálogo de status

1. **Configurável.** Cada status tem parâmetros: nome interno; nome para o cliente; público ou interno; ordem; papel que pode atribuí-lo; se exige leitura de QR; se grava técnico e hora; se dispara mensagem de WhatsApp; tempo esperado e limite de alerta; se é inicial; se é final. O sistema não deve ser engessado.
2. **Sequência rígida.** Cada status só vai para o **próximo**. **Não pula, não volta.** A **reprovação** é a **única exceção** e é marcada como "retorno permitido".
3. **Quem avança.** Só o papel responsável pelo status. Quem produz (técnicas) avança os status de produção. Quem revisa (atendentes) avança o controle de qualidade.
4. **Leitura do QR: avanço automático.** O funcionário lê o QR no celular, com login próprio, e o sistema leva a OS ao **próximo status permitido ao papel de quem leu**. Se o papel não puder, o sistema **recusa e explica**. **Decidido em 05/10/2026** (substitui o "modo estação").
5. **Uma sacola por vez.** A técnica **só abre outra sacola** (lê o QR de outra OS) **depois de terminar a anterior**. O limite é configurável por papel (hoje 1).
6. **Cliente.** Vê **a última fase pública atingida**, com as datas, no link público. Em "Reprovado pela qualidade" continua vendo "Controle de qualidade".
7. **Refação.** A OS reprovada passa pelo status interno **Em refação**: volta para a mesma técnica, se estiver escalada no dia, ou outra. Quem lê o QR **assume a refação** (a OS vai para **Em refação**) e fica registrado. Ao terminar e ler de novo, a OS vai para **Aguardando controle de qualidade**.
8. **Aviso de pagamento.** Se há saldo em aberto, a tela da retirada mostra **"Falta pagamento"**. **Não é status.** O saldo bloqueia a entrega, e o **gerente libera com motivo**.
9. **Mensagens.** O cliente recebe WhatsApp **somente** em **Em aberto** (OS aberta) e **Pronto para retirada**. Só envia com **consentimento registrado**.

## 5. Reconserto e garantia

Há **dois prazos diferentes**, ambos contados **da retirada pelo cliente** (decidido em 05/10/2026):

- **7 dias corridos** para reclamar de **ajuste** (ficou curto ou largo).
- **90 dias** de **garantia de defeito de execução** (descosturou, a barra se desfez), negociável no balcão.

**Dentro do prazo:** o atendente analisa e cria **uma nova OS sem valor**, **vinculada à OS original**, mostrando o **técnico que fez a primeira vez** **[ASSUMIDO: vale para os dois tipos]**. Isso mede a eficiência por técnico.

**Depois do prazo:** a OS nova é **cobrada**. O **gerente pode liberar sem valor, com motivo**.

## 6. Prazo de entrega

- **Horário de funcionamento (Filial padrão):** segunda a sexta, 9h30 às 18h; sábado, 9h30 às 14h; domingo fechado. **Dia útil** = dia em que a Filial funciona (segunda a sábado, exceto feriados fechados) **[ASSUMIDO]**.
- **Normal:** mesmo dia da semana da semana seguinte (segunda para segunda; vale sábado). **Feriado:** o sistema **sugere o próximo dia útil** e o **atendente decide** caso a caso.
- **Expresso:** até 2 horas por peça, contadas **só no horário de funcionamento**. O que não couber **passa para a abertura do dia seguinte**.
- **Urgente:** o atendente escolhe **2 ou 3 dias úteis**, com **sugestão de 3**.
- **Sobretaxa:** **percentual configurável por tipo** de entrega.
- O sistema **sugere** a data e o atendente **pode alterar**. Feriados são cadastrados por Filial.
- **Hora de corte [EM ABERTO]:** existe, mas a hora não foi informada.

## 7. O que a produção mede

- Cada OS guarda a **quantidade de peças** (até 5; **mais de 5 divide automaticamente em uma segunda OS ligada à primeira**) e o **grau de dificuldade de 1 a 4**, definido **por serviço** (valor padrão no catálogo). **A OS mostra a maior** dificuldade entre os serviços, e o **atendente pode ajustar**.
- Isso permite estimar o **tempo médio**, dimensionar a **grade de técnicos** e calcular o **bônus por produtividade**.
- O **diário de bordo** mostra a **descrição do serviço** de cada peça, no lugar do caderno.

## 8. Aprovação e retirada

- **Aprovação do cliente** ("concordo com o serviço e o preço"), de três formas: **pelo link**, **na tela do balcão** ou **no papel** (o atendente imprime, o cliente assina, o atendente **anexa a foto** e clica **"assinado no papel"**). **Não é status.** A produção **pode começar sem assinatura**, com **liberação e motivo**. Se o cliente não aprovar, **nada é automático, mas o atendente é avisado** **[EM ABERTO: prazo do alerta]**.
- **Retirada [EM ABERTO: decisão entre token e assinatura]:** o parecer (`06-parecer-token-lgpd-entrega.md`) recomenda a **janela de confirmação controlada pelo atendente** (o atendente inicia a retirada; por 10 minutos o cliente confirma no link já enviado, uso único), com **registro de quem retirou** e **plano B** de assinatura no papel com foto.
- **Entrega em domicílio:** fora do piloto (recomendação do parecer).
