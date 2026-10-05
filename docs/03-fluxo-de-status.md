# Fluxo de status da Ordem de Serviço

**Atualizado em:** 05/10/2026
**Substitui:** os ciclos de vida de status da documentação antiga (`docs/arquivo/`). Baseado em `02-decisoes-do-andre.md`.
**Situação:** o fluxo abaixo é o **desenho decidido**. **Ainda não está construído**: hoje o sistema só tem os status Em aberto, Aprovada e Cancelada para a OS. Pontos marcados **[EM ABERTO]** aguardam resposta do André.

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
| X | Reprovado pela qualidade | **Interno** | Técnica que fará a refação | Em produção **[EM ABERTO: ou um status "Em refação"]** | Único retorno permitido. O cliente nunca sabe |

## 4. Regras do catálogo de status

1. **Configurável.** Cada status tem parâmetros: nome interno; nome para o cliente; público ou interno; ordem; papel que pode atribuí-lo; se exige leitura de QR; se grava técnico e hora; se dispara mensagem de WhatsApp; tempo esperado e limite de alerta; se é inicial; se é final. O sistema não deve ser engessado.
2. **Sequência rígida.** Cada status só vai para o **próximo**. **Não pula, não volta.** A **reprovação** é a **única exceção** e é marcada como "retorno permitido".
3. **Quem avança.** Só o papel responsável pelo status. Quem produz (técnicas) avança os status de produção. Quem revisa (atendentes) avança o controle de qualidade.
4. **Leitura do QR.** O funcionário lê o QR no celular, com login próprio. **[EM ABERTO]**: a leitura **avança sozinha para o próximo status permitido** ao papel (modo automático, o que o fluxo descreve) ou o funcionário **escolhe a estação** antes de ler (resposta 34 do questionário)? Recomendação: automático.
5. **Cliente.** Vê **a última fase pública atingida**, com as datas, no link público. Em "Reprovado pela qualidade" continua vendo "Controle de qualidade".
6. **Refação.** A OS reprovada volta para a mesma técnica, se estiver escalada no dia, ou outra. Quem lê o QR **assume a refação** e fica registrado.
7. **Aviso de pagamento.** Se há saldo em aberto, a tela da retirada mostra **"Falta pagamento"**. **Não é status.** O saldo bloqueia a entrega, e o **gerente libera com motivo**.
8. **Mensagens.** O cliente recebe WhatsApp **somente** em **Em aberto** (OS aberta) e **Pronto para retirada**. Só envia com **consentimento registrado**.

## 5. Reconserto

Se o cliente volta em até **7 dias** reclamando (curto ou largo), o atendente analisa e cria **uma nova OS sem valor**, **vinculada à OS original**, mostrando o **técnico que fez a primeira vez**. Isso mede a eficiência por técnico. As regras exatas (dias úteis ou corridos, relação com a garantia de 90 dias) estão **em aberto**.

## 6. Prazo de entrega

- **Normal:** mesmo dia da semana da semana seguinte (segunda para segunda; vale sábado). Feriado antecipa ou adia **[EM ABERTO: qual dos dois]**.
- **Expresso:** até 2 horas por peça.
- **Urgente:** 2 a 3 dias depois, fora da regra do mesmo dia da semana **[EM ABERTO: 2, 3 ou escolha do atendente]**.
- O sistema **sugere** a data e o atendente **pode alterar**. Feriados são cadastrados por Filial. Há horário de corte (hora ainda não informada).

## 7. O que a produção mede

- Cada OS guarda a **quantidade de peças** (até 5) e o **grau de dificuldade de 1 a 4** **[EM ABERTO: por OS ou por serviço]**.
- Isso permite estimar o **tempo médio**, dimensionar a **grade de técnicos** e calcular o **bônus por produtividade**.
- O **diário de bordo** mostra a **descrição do serviço** de cada peça, no lugar do caderno.
