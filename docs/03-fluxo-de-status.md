# Fluxo de status da Ordem de Serviço

**Atualizado em:** 05/10/2026 (noite)
**Substitui:** os ciclos de vida de status da documentação antiga (`docs/arquivo/`). Baseado em `02-decisoes-do-andre.md`.
**Situação:** o fluxo abaixo é o **desenho decidido**. **Ainda não está construído**: hoje o sistema só tem os status Em aberto, Aprovada e Cancelada para a OS. Os pontos que estavam **em aberto** foram resolvidos nas rodadas 2 e 3 de respostas do André.

## 1. O caminho da OS, do balcão à retirada

```
ATENDIMENTO            APROVAÇÃO               SACOLA + OP IMPRESSA       PRODUÇÃO               QUALIDADE             RETIRADA
Cliente chega,    ->   Cliente assina   ->    Peças vão numa sacola  ->  Técnico lê o QR   ->   Revisor lê o QR  ->  Cliente retira e assina
mede, OS é aberta      (link, balcão ou       (limite por versão)        ao pegar e ao          ao pegar; aprova      a Ordem de Produção
e vai por WhatsApp     papel)                 impressa no bolso          terminar               ou reprova            em papel
(Em aberto)                                   (QR grande)
```

## 2. Etapas, em palavras

1. **Atendimento e abertura da OS.** O atendente cadastra o cliente (nome e WhatsApp obrigatórios), as peças e os serviços. A OS nasce com o status **Em aberto** (público). Não há etiqueta nem leitura de QR nesta etapa. O sistema envia a **primeira mensagem de WhatsApp** com o **link público** de acompanhamento e aprovação.
2. **Medição das roupas.** Acontece no atendimento. **Não é status**, não gera QR e não manda WhatsApp.
3. **Aprovação do cliente.** O cliente **assina** "concordo com o serviço e o preço" no link público. **Não é status**: a OS continua **Em aberto**. A medida usada fica travada na aprovação.
4. **Sacola e esteira.** A sacola é só o transporte físico. Cada **versão da OS** aceita até o limite parametrizado (padrão 5) e cada linha é uma peça. **Fechar sacola** trava a versão. **Salvar** com a sacola fechada imprime a **Ordem de Produção** para o bolso transparente. **Abrir nova versão** + **Salvar** abre a próxima versão ligada em outra aba. A sacola vai para a esteira "a fazer", por ordem de chegada.
5. **Produção.** O técnico pega a sacola e **lê o QR**. O status passa a **Em produção** (público), com **data, hora e técnico** registrados (produtividade). Costura, ajuste, acabamento e passadoria acontecem **dentro** deste status. Ao terminar, o técnico lê o QR de novo e leva a sacola à esteira de finalizadas. O status passa a **Aguardando controle de qualidade** (público).
6. **Controle de qualidade.** O revisor abre a OS na tela **Controle de qualidade** (ou lê o QR, quando existir) e avalia **peça a peça**. Se **todas** forem aprovadas, a OS vai para **Pronto para retirada**. Se uma ou várias forem reprovadas, a **OS original permanece em Controle de qualidade** e nasce uma **nova versão da OP só com as peças reprovadas**, para voltar à esteira de produção. A lista da tela, **até existir o QR**, mostra as OP com sacola fechada para homologar.
7. **Pronto para retirada.** Status **público**. Sai a **segunda mensagem de WhatsApp**.
8. **Retirada (só em papel nesta fase).** O cliente informa o número da OS ou o nome, o atendente confere e **lê o QR**, o cliente **assina a Ordem de Produção em papel**, o atendente **anexa a foto à OS** e clica **"entregue assinado"**. Status **Retirado pelo cliente** (público). **Sem token e sem janela de confirmação por ora.**

## 3. Catálogo inicial de status

| # | Status | Visibilidade | Quem lê o QR | Vai para | Observações |
|---|---|---|---|---|---|
| 1 | Em aberto | Público | Ninguém (nasce na criação) | Em produção | WhatsApp 1. A aprovação do cliente não muda o status |
| 2 | Em produção | Público | Técnico, ao pegar a sacola | Aguardando controle de qualidade | Grava data, hora e técnico |
| 3 | Aguardando controle de qualidade | Público | Técnico, ao terminar | Controle de qualidade | |
| 4 | Controle de qualidade | Público | Revisor | Pronto para retirada quando **100% das peças** estão aprovadas | Reprovação **não** muda o status da OS |
| 5 | Pronto para retirada | Público | Ninguém | Retirado pelo cliente | WhatsApp 2 |
| 6 | Retirado pelo cliente | Público | Atendente, na retirada | Fim | Assinatura no papel, foto na OS e "entregue assinado" |
| — | Refação | **Interno (OP)** | Técnica que fará a refação | Volta para a qualidade na **mesma OS** | Não é status da OS. É uma **versão da OP** só com as peças reprovadas. O cliente continua vendo Controle de qualidade |

## 4. Regras do catálogo de status

1. **Configurável.** Cada status tem parâmetros: nome interno; nome para o cliente; público ou interno; ordem; papel que pode atribuí-lo; se exige leitura de QR; se grava técnico e hora; se dispara mensagem de WhatsApp; tempo esperado e limite de alerta; se é inicial; se é final. O sistema não deve ser engessado.
2. **Sequência rígida.** Cada status só vai para o **próximo**. **Não pula, não volta.** A **reprovação** é a **única exceção**, mas ela **não devolve a OS** para um status anterior: as peças reprovadas saem numa **nova OP** e a OS original **permanece em Controle de qualidade**.
3. **Quem avança.** Só o papel responsável pelo status. Quem produz (técnicas) avança os status de produção. Quem revisa (atendentes) avança o controle de qualidade.
4. **Leitura do QR: avanço automático.** O funcionário lê o QR no celular, com login próprio, e o sistema leva a OS ao **próximo status permitido ao papel de quem leu**. Se o papel não puder, o sistema **recusa e explica**. **Decidido em 05/10/2026** (substitui o "modo estação").
5. **Uma sacola por vez.** A técnica **só abre outra sacola** (lê o QR de outra OS) **depois de terminar a anterior**. O limite é configurável por papel (hoje 1).
6. **Cliente.** Vê **a última fase pública atingida**, com as datas, no link público. Em "Reprovado pela qualidade" continua vendo "Controle de qualidade".
7. **Refação.** Só as peças reprovadas voltam para a esteira, numa **nova versão da OP** (versão 2, 3…). A OS original **continua em Controle de qualidade**. Quando a sacola retorna, o revisor puxa a **mesma OS**; a tela mostra a versão da refação para aprovar ou reprovar de novo. 100% aprovado avança a OS; nova reprovação gera a próxima OP.
8. **Aviso de pagamento.** Se há saldo em aberto, a tela da retirada mostra **"Falta pagamento"**. **Não é status.** O saldo bloqueia a entrega, e o **gerente libera com motivo**.
9. **Mensagens.** O cliente recebe WhatsApp **somente** em **Em aberto** (OS aberta) e **Pronto para retirada**. Só envia com **consentimento registrado**.

## 5. Reconserto e garantia

Há **dois prazos diferentes**, ambos contados **da retirada pelo cliente** (decidido em 05/10/2026):

- **7 dias corridos** para reclamar de **ajuste** (ficou curto ou largo).
- **90 dias** de **garantia de defeito de execução** (descosturou, a barra se desfez), negociável no balcão.

**Dentro do prazo:** o atendente analisa e cria **uma nova OS sem valor**, **vinculada à OS original**, mostrando o **técnico que fez a primeira vez** (vale para os dois tipos). Isso mede a eficiência por técnico.

**Depois do prazo:** a OS nova é **cobrada**. O **gerente pode liberar sem valor, com motivo**.

## 6. Prazo de entrega

- **Horário de funcionamento (Filial padrão):** segunda a sexta, 9h30 às 18h; sábado, 9h30 às 14h; domingo fechado. **Dia útil** = dia em que a Filial funciona (segunda a sábado, exceto feriados fechados).
- **Normal:** mesmo dia da semana da semana seguinte (segunda para segunda; vale sábado). **Feriado:** o sistema **sugere o próximo dia útil** e o **atendente decide** caso a caso.
- **Expresso:** até 2 horas por peça, contadas **só no horário de funcionamento**. O que não couber **passa para a abertura do dia seguinte**.
- **Urgente:** o atendente escolhe **2 ou 3 dias úteis**, com **sugestão de 3**.
- **Sobretaxa:** **percentual configurável por tipo** de entrega.
- O sistema **sugere** a data e o atendente **pode alterar**. Feriados são cadastrados por Filial.
- **Hora de corte:** o **próprio fechamento** (18h de segunda a sexta; 14h no sábado). Uma OS aberta depois do fechamento conta como aberta no próximo dia útil.
- **Todos esses valores são parâmetros** editáveis numa tela de parâmetros.

## 7. O que a produção mede

- Cada **versão da OS** guarda as peças até o limite parametrizado (padrão 5), uma peça por linha. Mais peças: fecha a sacola, marca **Abrir nova versão** e **Salvar**. Se errou, **Abrir sacola**. O **grau de dificuldade de 1 a 4** é definido **por serviço** (valor padrão no catálogo). **A OS mostra a maior** dificuldade entre os serviços, e o **atendente pode ajustar**.
- **Tempos médios por grau:** grau 1 = 30 minutos, grau 2 = 60, grau 3 = 90, grau 4 = 180. **Os graus são configuráveis** (aumentar ou diminuir graus, mudar tempos) na tela de parâmetros.
- Isso permite estimar o **tempo médio**, dimensionar a **grade de técnicos** e calcular o **bônus por produtividade**.
- O **diário de bordo** mostra a **descrição do serviço** de cada peça, no lugar do caderno.

## 8. Aprovação e retirada

- **Aprovação do cliente** ("concordo com o serviço e o preço"), de três formas: **pelo link**, **na tela do balcão** ou **no papel** (o atendente imprime, o cliente assina, o atendente **anexa a foto** e clica **"assinado no papel"**). **Não é status.** A produção **pode começar sem assinatura**, com **liberação e motivo**.
- **Aprovação pendente:** o sistema **avisa todos os dias**, **até o cliente assinar**, o **atendente e o gerente**, e mantém uma **lista sempre visível** na tela. Não é por prazo.
- **Retirada (decidido):** **só assinatura no papel** nesta fase, com **foto anexada na OS** e botão **"entregue assinado"**. Token ou janela de confirmação ficam para uma versão futura (ver `06-parecer-token-lgpd-entrega.md`).
- **Entrega em domicílio:** depois do piloto; por ora só um marcador e o endereço opcional.

## 9. Tela de parâmetros

**Para todas as regras deve existir uma tela de parâmetros**, administrável pelo André: graus de dificuldade e tempos, logística de produção, prazos, cortes, sobretaxas, status, alertas, garantia e reconserto, pagamento, mensagens e link público. Cada alteração registra **quem mudou, quando e os valores anterior e novo**.
