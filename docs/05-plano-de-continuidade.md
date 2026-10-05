# Plano de continuidade do ANEXSYS (versão 3)

> Cópia da versão 3 de 05/10/2026 para manter o conjunto de documentos completo. Os documentos de apoio que não estão no repositório são o diagnóstico original e as perguntas complementares. As decisões em vigor estão em `02-decisoes-do-andre.md`.

**Para:** André
**Versão:** 3, de 05/10/2026 (tarde). Substitui a versão 2 (manhã). Incorpora as suas respostas às perguntas complementares.
**Bases:**
- Suas decisões, em `02-decisoes-do-andre.md` (seções 1 a 10).
- O parecer sobre token, LGPD e entrega em domicílio, em `06-parecer-token-lgpd-entrega.md`.
- O que ainda trava o trabalho, nas perguntas complementares da segunda rodada (fora do repositório).
- O diagnóstico original, fora do repositório.

**Regra deste documento:** linguagem de negócio. Termo técnico vem explicado em uma frase.

**Sobre prazos:** a única data firme é a sua: **produção em março de 2027**. Não estimo esforço em horas ou semanas. Os "marcos" da seção 7 são uma **proposta de sequência** montada de trás para frente, para você confirmar.

**O que mudou da v2 para a v3 (resumo):** conflitos resolvidos (avanço automático, API oficial, conciliação Cielo, prazos de garantia), novo status interno **Em refação**, **divisão automática de OS**, **dificuldade por serviço**, **sobretaxa por tipo de entrega**, **conciliação em lote**, **assinatura por link, balcão ou papel**, **número de WhatsApp reconfigurável**, **Filial padrão**, e a **entrega em domicílio** posicionada **fora de março** (por recomendação do parecer). **Concierge e fila de chegada saíram do piloto**, e o **portal passou a ser o link público**. Isso **alivia o prazo**.

---

## 1. Resumo executivo

### O que mudou da versão 2 para a versão 3

| Assunto | Versão 2 | Versão 3 (suas respostas) |
|---|---|---|
| Leitura do QR | Automático ou estação (em aberto) | **Avanço automático pelo papel de quem lê.** A técnica só abre outra sacola depois de terminar a anterior |
| Reprovação | Volta para Em produção (ou "Em refação", em aberto) | **Status interno próprio "Em refação"** |
| WhatsApp | API oficial ou Web (em aberto) | **API oficial contratada direto.** Número da Vivo primeiro (uso simultâneo, se a Meta permitir), depois outro número, com **tela para reconfigurar o número** |
| Custo das mensagens | Em aberto | **O ateliê absorve**; ao comercializar, entra no preço do plano |
| Mais de 5 peças | Em aberto | **Divisão automática em segunda OS ligada à primeira** |
| Dificuldade | Por OS ou por serviço (em aberto) | **Por serviço**, com valor padrão no catálogo; a OS mostra a **maior**; o atendente ajusta |
| Prazos | Regras em aberto | Feriado: **sistema sugere, atendente decide**. Expresso: só no horário de funcionamento. Urgente: **2 ou 3 dias úteis, sugestão 3**. **Sobretaxa em percentual por tipo** |
| Garantia | 7 x 90 dias, úteis x corridos (em aberto) | **7 dias corridos** (ajuste) e **90 dias** (defeito de execução), **ambos contados da retirada.** Depois do prazo, a OS nova é cobrada; o gerente libera sem valor, com motivo |
| Maquininha | Integração com a Cielo | **Conciliação**: importar as vendas no fechamento do dia, **baixar as OS em lote** e mostrar **quem deixou de cobrar**. **QR Pix na tela**: opcional |
| Aprovação do cliente | Link | **Link, tela do balcão ou papel** (foto + "assinado no papel"). Produção pode começar sem assinatura, com liberação e motivo. Se não aprovar, **alerta ao atendente** |
| Retirada | Em aberto | **Preferência: token.** O parecer recomenda a **janela de confirmação controlada pelo atendente**. **Decisão final aguarda você** |
| Dados no link | Apagar endereço se o cliente não concordar | **Link mínimo**: nome, número da OS, entrada, previsão, status, serviços e situação do pagamento. Endereço só quando há entrega em domicílio |
| Entrega em domicílio | Não existia | **Nova.** Recomendação: **depois do piloto**, deixando só um marcador e o endereço opcional |
| Concierge e fila de chegada | Em aberto | **Fora do piloto** |
| Portal | Em aberto | **O link público é o portal** |
| Estrutura do ateliê | Em aberto | **1 CNPJ, nenhuma Filial** (será criada a **Filial padrão**), seg a sex 9h30-18h, sábado 9h30-14h. **Hora de corte: em aberto** |

### Ordem dos ciclos (visão rápida)

| Ciclo | Nome | Tamanho | O que você vê no final |
|---|---|---|---|
| **0** | Casa arrumada | P | Documentação única; falhas de segurança fechadas; ambiente de testes em nuvem; testes de integração corrigidos; cadastros externos iniciados (Meta, Cielo, nuvem) |
| **1** | Multiempresa correto | M | Duas Contas de teste isoladas; Empresa; **Filial padrão**; horário de funcionamento; usuários por escopo |
| **2** | Cadastros e catálogo de status | G | Clientes, serviços (com **dificuldade padrão**), feriados, ficha de medidas e o **catálogo de status** com **Em refação** |
| **3** | OS completa e Ordem de Produção impressa | G | OS com peças, **divisão automática**, dificuldade, **tipos de entrega com sobretaxa**, **aprovação por link, balcão ou papel**, link público seguro, Ordem de Produção impressa com QR |
| **4** | Produção por QR, diário de bordo e qualidade | G | **Avanço automático**, **uma sacola por vez**, reprovação e **Em refação**, diário de bordo |
| **5** | WhatsApp (API oficial) e acompanhamento | M | As 2 mensagens chegam com o link; **tela para trocar o número**; falhas na lista |
| **6** | Retirada, reconserto e garantia | M | Retirada com **confirmação controlada**, comprovante, plano B no papel; **reconserto e garantia** com os prazos decididos |
| **7** | Financeiro e conciliação da Cielo | G | Baixa em lote no fechamento do dia, divergências, **relatório de quem deixou de cobrar**; Pix QR se entrar |
| **8** | Dashboard e alertas | M | Painel de produção e produtividade; alertas de atraso e de **aprovação pendente** |
| **9** | Homologação em paralelo e ajustes | M | Uso paralelo com o sistema antigo; ajustes sem pressa (o portal é o link; sem concierge) |
| **10** | LGPD mínima, importação e virada | M | Consentimento, aviso de privacidade, retenção, canal do titular; importação do histórico após a validação |
| **Depois** | Entrega em domicílio, retirada por terceiros, cobrança do ANEXSYS, Pix QR (se não entrar), concierge com câmera, segundo tipo de negócio | n/a | Seção 10 |

---

## 2. As suas decisões, traduzidas em regras do sistema

### 2.1 O fluxo da OS, do balcão à retirada

```
ATENDIMENTO            APROVAÇÃO                  SACOLA + OP IMPRESSA       PRODUÇÃO               QUALIDADE             RETIRADA
Cliente chega,    ->   Link, balcão ou papel ->   Peças vão numa sacola  ->  Técnica lê o QR   ->   Revisor lê o QR  ->  Cliente retira;
mede, OS é aberta      ("concordo com serviço     (até 5 peças) com a OP     ao pegar e ao          ao pegar; aprova      atendente inicia,
e vai por WhatsApp     e preço"). Produção pode   impressa no bolso          terminar. Uma          ou reprova            cliente confirma
(Em aberto)            começar sem assinatura,    (QR grande)                sacola por vez
                       com liberação e motivo
```

### 2.2 Os status (modelo inicial, editável)

| # | Status | Público? | Quem lê o QR | Muda para | Observação |
|---|---|---|---|---|---|
| 1 | **Em aberto** | Público | Ninguém (nasce na criação da OS) | Em produção | WhatsApp sai aqui. A aprovação do cliente **não** muda o status |
| 2 | **Em produção** | Público | Técnica, ao pegar a sacola | Aguardando controle de qualidade | Grava data, hora e técnica. **Só uma sacola por vez** |
| 3 | **Aguardando controle de qualidade** | Público | Técnica, ao terminar e levar à esteira de finalizadas | Controle de qualidade | |
| 4 | **Controle de qualidade** | Público | Revisor, ao tirar a sacola da esteira | Pronto para retirada (aprova) ou Reprovado pela qualidade (reprova) | |
| 5 | **Pronto para retirada** | Público | Ninguém | Retirado pelo cliente | WhatsApp sai aqui |
| 6 | **Retirado pelo cliente** | Público | Atendente, na retirada | Final | Confirmação de retirada (seção 4.4) |
| X1 | **Reprovado pela qualidade** | **Interno** | Técnica que fará a refação | Em refação | O cliente nunca sabe. **Único retorno permitido** |
| X2 | **Em refação** | **Interno** | Técnica, ao terminar | Aguardando controle de qualidade | Grava quem refez. **Só uma sacola por vez** |

**Regras do catálogo de status (os "parâmetros"):**

- Cada status tem: **nome interno**, **nome para o cliente**, **público ou interno**, **ordem**, **papel que pode atribuí-lo**, **exige leitura de QR**, **grava técnica e hora** (produtividade), **dispara WhatsApp**, **tempo esperado e limite de alerta**, **é inicial**, **é final**.
- **Sequência rígida:** cada status só vai para o **próximo**. **Não pula, não volta.** A **reprovação** é a única exceção, marcada como "retorno permitido".
- **Avanço automático:** ao ler o QR, o sistema **leva a OS ao próximo status permitido ao papel de quem leu**. Se o papel não puder (por exemplo, uma técnica lendo uma OS em "Controle de qualidade"), o sistema **recusa e explica**. Isso garante o fluxo completo sem pular etapas.
- **Uma sacola por vez:** a técnica **não consegue abrir outra OS** (ler o QR de outra) enquanto tiver uma em "Em produção" ou "Em refação". O limite é **configurável por papel** (hoje 1).
- O cliente vê **a última fase pública atingida**, com as datas, no link público. Em "Reprovado pela qualidade" e em "Em refação", continua vendo "Controle de qualidade".
- **Aviso de falta de pagamento** não é status: aparece na OS e na retirada quando o saldo é maior que zero.

### 2.3 Regras de prazo

- **Dia útil** = dia em que a Filial funciona: segunda a sábado, exceto feriados fechados. **[ASSUMIDO, a confirmar]**
- **Horário de funcionamento (Filial padrão):** segunda a sexta, 9h30 às 18h; sábado, 9h30 às 14h; domingo fechado.
- **Normal:** mesmo dia da semana da semana seguinte (segunda para segunda; vale sábado). **Feriado:** o sistema **sugere o próximo dia útil** e o **atendente decide** caso a caso.
- **Expresso:** até **2 horas por peça**, contadas **só no horário de funcionamento**. O que não couber **passa para a abertura do dia seguinte**.
- **Urgente:** o atendente escolhe **2 ou 3 dias úteis**, com **sugestão de 3**.
- **Sobretaxa:** **percentual configurável por tipo** de entrega (Normal, Expresso, Urgente).
- O sistema **sugere** a data e o atendente **pode alterar** (fica registrado quem alterou e por quê).
- **Hora de corte:** em aberto (você respondeu que existe, sem informar a hora).

### 2.4 Garantia e reconserto

- **Dois prazos diferentes**, ambos contados **da retirada pelo cliente**:
  - **7 dias corridos** para reclamar de **ajuste** (curto, largo);
  - **90 dias** de **garantia de defeito de execução** (descosturou, a barra se desfez), negociável no balcão.
- **Dentro do prazo:** o atendente analisa e cria uma **nova OS sem valor, vinculada à OS original**, mostrando o **técnico que fez a primeira vez**. **[ASSUMIDO]** Vale para os dois tipos.
- **Depois do prazo:** a OS nova é **cobrada**. O **gerente pode liberar sem valor, com motivo**.

### 2.5 Técnica e produtividade

- Cada técnica (inclusive **diaristas e terceiros**) tem **login próprio** e lê o QR no celular. Isso vira o **diário de bordo**: o que cada uma produziu, em quanto tempo, com a **descrição do serviço** de cada peça.
- A **dificuldade** (1 a 4) é definida **por serviço**, com valor padrão no catálogo. A **OS mostra a maior** entre seus serviços, e o **atendente pode ajustar**. Com a **quantidade de peças**, isso estima o **tempo médio**, dimensiona a **grade de costureiras** e alimenta o **bônus por produtividade**.
- **Dashboard** por técnica e por quantidade de peças. **Alertas de atraso** antes de vencer, com parâmetros configuráveis. **Tempos médios por grau: não informados**; o sistema os **mede** durante a homologação em paralelo, se você preferir.

### 2.6 O que o cliente recebe e faz

- **WhatsApp 1 (OS aberta):** mensagem configurável pela plataforma, com **link**. Modelo seu: "Olá, [nome do cliente], aqui é do [nome do estabelecimento], você está recebendo a sua ordem de serviço digital, acompanhe o status de produção, mas fique tranquila que por este canal avisaremos quando estiver pronto, entre agora para aprovar o que ficou combinado."
- **Link público (sem login):** mostra **só**: nome (sugestão: **primeiro nome**), número da OS, data de entrada, previsão de entrega, status, serviços combinados e situação do pagamento (a conciliação atualiza o recebido). Permite **assinar a aprovação**. É o **portal** do piloto.
- **WhatsApp 2 (Pronto para retirada):** avisa que a peça está pronta, com o mesmo link.
- **Nenhuma outra mensagem automática.** Não há registro de conversas no sistema; aprovações ficam na OS.
- **Se o cliente não aprovar:** nada automático, mas o **atendente é avisado** (alerta). O prazo em dias **está em aberto** (a recomendação é 2 dias).
- **Mais de 5 peças:** o sistema **divide em uma segunda OS ligada à primeira**. **[ASSUMIDO]** As OS ligadas formam um **grupo**: o cliente recebe **um só link** com as duas OS, **um só aviso** de OS aberta e **um só pagamento**; cada OS tem sua sacola, sua Ordem de Produção e seu QR.

### 2.7 Privacidade e LGPD, em resumo

- Só envia mensagem com **consentimento registrado**.
- **Roupa infantil só com responsável cadastrado**; **fotos só da peça**, nunca da criança.
- Controlador: o **ateliê**; operador: o **ANEXSYS**. Guarda de inativos: **5 anos**.
- **Endereço só é coletado quando a OS for para entrega em domicílio.** A regra anterior ("apagar o endereço se o cliente não concordar") foi **substituída** por essa minimização.
- **A LGPD não fica "livre"** com o link mínimo. O parecer lista o que continua necessário (contrato com o ateliê, aviso de privacidade, canal do titular, retenção, segurança, incidente, fornecedores) e vira **escopo do Ciclo 10**.

---

## 3. O piloto completo: o que significa

**Definição (a sua):** o ateliê só entra em produção em **março de 2027**, com **financeiro, portal e concierge** prontos. **Atualização de 05/10:** **nenhum concierge nem fila de chegada**; o **portal é o link público**. Você é o homologador de tudo, **não tem pressa de ajustes**, e o **sistema antigo roda em paralelo até você ter confiança**.

**O que entra (em ordem de ciclo):**

1. Multiempresa (Conta, Empresa, Filial padrão) e acesso por papel e escopo.
2. Clientes completos (WhatsApp obrigatório, CEP, busca multicritério, consentimento, responsável por menor; endereço opcional).
3. Catálogo de serviços com preço fixo, **dificuldade padrão** e ajuste manual com permissão; ficha de medidas em lista; feriados e **horário de funcionamento** por Filial.
4. **Catálogo de status configurável** (com **Em refação**).
5. OS completa: peças (até 5, com **divisão automática**), serviços, dificuldade, **Normal, Expresso e Urgente com sobretaxa**, fotos opcionais (máximo 3 por peça).
6. **Aprovação por link, balcão ou papel.**
7. Ordem de Produção impressa com QR grande (**sem endereço**).
8. Produção por QR com **avanço automático**, **uma sacola por vez**, diário de bordo, reprovação e refação.
9. **WhatsApp pela API oficial** (2 mensagens), com **tela de número**.
10. **Retirada** com confirmação controlada, comprovante e plano B no papel.
11. **Reconserto e garantia** como nova OS vinculada.
12. **Financeiro com conciliação da Cielo** (baixa em lote, divergências, quem deixou de cobrar).
13. Dashboard e alertas.
14. LGPD mínima, importação do histórico (após validação), homologação em paralelo.

**O que fica de fora (decidido):** concierge e fila de chegada, retirada por terceiros (próxima versão), concierge com câmera e reconhecimento facial, entrega em domicílio (recomendado para depois), cartão online com cartão cadastrado pelo cliente, segundo tipo de negócio, registro de conversas, aprovação por resposta de WhatsApp.

---

## 4. A base técnica que precisa ficar certa primeiro

### 4.1 Multiempresa: Conta, Empresa, Filial (decidido)

| Nível | Nome | O que é | Exemplo |
|---|---|---|---|
| 1 | **Conta** (no código: "tenant") | Quem assina o ANEXSYS; dona dos dados | "Grupo Ateliê Silva" |
| 2 | **Empresa** | Pessoa jurídica (CNPJ) | "Silva Costuras ME" |
| 3 | **Filial** | Unidade física | "Matriz" |

- **Seu ateliê hoje: 1 CNPJ e nenhuma Filial.** O sistema **exige ao menos uma Filial**, então a **Filial padrão** é criada automaticamente junto com a Empresa, com o **horário de funcionamento** informado (seg a sex 9h30 às 18h; sábado 9h30 às 14h). Você pode **renomeá-la** e **acrescentar outras** depois.
- **Cliente é da Conta** e pode ser atendido em qualquer Empresa ou Filial dela. **Entre Contas nunca há compartilhamento.**
- **CNPJ, numeração de OS e dados de pagamento pertencem à Empresa.** OS, produção e entrega acontecem **numa Filial**.
- **Usuário novo nasce sem nenhuma Filial** até o administrador marcar. **Comunidades ficam congeladas**: permissão vem do **papel** e do **escopo**.
- **Só você cria Contas**, por enquanto.
- **Isolamento no banco:** hoje o isolamento depende de cada consulta lembrar de filtrar pela Conta. A proposta é colocar um **porteiro no próprio banco** (*Row Level Security*): mesmo que o programa erre, o banco só entrega as linhas da Conta logada. Um **teste automático de vazamento** falha a construção se alguma tabela ficar sem o porteiro.

### 4.2 QR por OS, assinado, na Ordem de Produção impressa

- O QR **identifica a OS** (e sua Ordem de Produção). Está **impresso grande** na **Ordem de Produção**, no bolso transparente da sacola. **Sem etiqueta adesiva e sem impressora de etiqueta**: impressão comum.
- A Ordem de Produção traz: número da OS, **QR grande**, **quantidade de peças**, **dificuldade (a maior)**, **descrição de cada peça e serviço**, **tipo e data de entrega**. **Nunca traz preço** e, por recomendação do parecer, **não traz o endereço de entrega** (só um indicador "entrega em domicílio", quando existir).
- O QR guarda **só um código longo e aleatório**, sem dado pessoal, **assinado** pelo sistema: QR inventado ou alterado é **recusado e registrado**.
- **Reimpressão** só pelo **gerente**, com motivo; a versão anterior **deixa de funcionar**.
- **Quem lê:** funcionária com **login no celular** (alguns celulares são pessoais, outros da loja; Android e iPhone). **Leitura exige internet**; o Wi-Fi é bom, então **modo offline não é prioridade**.
- **Duas leituras seguidas** não duplicam a mudança. **Quem não está logado** lendo o QR **não avança nada**.

### 4.3 WhatsApp (API oficial direta, 2 mensagens) e link público

- **API oficial contratada direto** com a Meta (decidido). Cadastro da **Empresa** (CNPJ) na Meta, **modelos aprovados**, **pago por mensagem**; **o ateliê absorve** o custo (ao comercializar, entra no plano).
- **Número:** **começa com o número atual da Vivo**, usando o **uso simultâneo** (aplicativo e API no mesmo número) **se a Meta permitir** para ele. Se não permitir, usa-se **outro número** desde o início. Depois **compra outro número**.
- **Tela para reconfigurar o número:** o administrador vê a **conta do WhatsApp Business** e o **número ativo**, **troca de número**, **testa o envio** e consulta o **histórico de números**. **Os modelos de mensagem pertencem à conta, não ao número**, então **trocar o número não exige nova aprovação dos textos** (**confirmar com a Meta no cadastro**).
- **Fila e falha:** a mensagem entra numa **fila**, um "carteiro" envia, tenta de novo se falhar, e depois de algumas tentativas vai para a **lista de falhas** (decidido) com o motivo, para o atendente reenviar ou ligar. O sistema **só marca "enviada" quando a Meta confirma**.
- **Consentimento:** só envia com consentimento registrado. **Um número por Conta.**
- **Texto configurável** na plataforma, com variáveis (nome do cliente, nome do estabelecimento, link). **Sem registro de conversas.**
- **Link público seguro** (recomendações do parecer): código **longo e aleatório (pelo menos 128 bits)**, **sem relação com o número da OS**; **expira** (retirada + período de garantia, com margem); **revogável**; **limite de tentativas**; **bloqueado para buscadores**; **só os campos mínimos**; aprovação com **confirmação**; **registro** de acessos.

### 4.4 Aprovação e retirada (assinaturas e confirmações)

**Aprovação do cliente ("concordo com o serviço e o preço")** — três formas, todas registradas na OS:

1. **Pelo link**, no celular do cliente.
2. **Na tela do balcão**, o atendente passa o aparelho.
3. **No papel:** o atendente imprime a OS, o cliente assina, o atendente **anexa a foto** e clica **"assinado no papel"** (fica registrado quem clicou e quando).

- Cada registro guarda: **quem**, **data e hora**, **o texto exato aceito**, **valor e serviços na hora**, **aparelho e rede** (para link e balcão), e a **foto** (no papel). A **medida usada fica travada** na aprovação.
- **A produção pode começar sem assinatura**, com **liberação e motivo** (quem libera e por quê ficam registrados). Se o cliente **não aprovar**, **nada acontece automaticamente**, mas o **atendente é avisado**.
- **Cláusula de aceite** nos termos que o cliente assina: aceita a **confirmação eletrônica de retirada** como comprovante (ver o parecer).

**Retirada** — **decisão final aguardando você** (pergunta 4 da segunda rodada). Sua preferência é o **token**; o parecer concluiu que ele **sozinho não basta** e recomenda a **janela de confirmação controlada pelo atendente**:

- O **atendente inicia a retirada** na tela. Por **10 minutos** (configurável), o **link do cliente** mostra o botão **"Confirmo que retirei"** (uso único) ou um **código de 6 dígitos**. **Não gera terceira mensagem de WhatsApp.**
- O atendente registra **quem retirou** (se não for o cliente: **nome e documento**). O link mostra o **comprovante** ("Retirado em [data e hora] por [nome]").
- **Plano B:** **assinatura na Ordem de Produção em papel**, **foto anexada** e **"entregue assinado"**.
- **Saldo em aberto:** aviso "Falta pagamento"; **bloqueia a entrega, e o gerente libera com motivo.**
- Para **terceiros** (próxima versão): o cliente **autoriza antes**, pelo link, **indicando o nome**; o terceiro mostra documento e o atendente registra.

---

## 5. Mudanças propostas no banco de dados (revisadas pela v3)

**Como ler:** o banco é onde o sistema guarda tudo. Cada mudança traz o que muda, por quê, e o que acontece com o que existe. Como **não há dado real a preservar** (decisão 4), todo o conteúdo atual é teste e pode ser recriado; mesmo assim, cada migração é feita em passos reversíveis, com cópia e conferência.

### 5.1 Quadro resumo

Legenda: **Mantida**, **Alterada**, **Reduzida**, **Nova**. As colunas "v3" mostram o que mudou nesta versão.

| # | Mudança | Situação | O que a v3 acrescentou | Ciclo | Risco |
|---|---|---|---|---|---|
| D1 | Nível **Empresa** entre Conta e Filial | Mantida | **Filial padrão** criada junto | 1 | Médio |
| D2 | **Porteiro no banco** (isolamento por Conta) | Mantida | | 1 | Alto |
| D3 | **Catálogo de status** com parâmetros, regras de passagem e histórico por OS | Alterada | Status **Em refação**; **limite de sacolas por técnica**; avanço automático por papel | 2 | Médio |
| D4 | **Peças da OS**, quantidade (até 5) e **dificuldade** | Alterada | **Dificuldade por serviço**, **maior na OS**, ajuste pelo atendente | 3 | Médio |
| D5 | **Catálogos**: serviços (preço, **dificuldade padrão**, tempo médio), tipos de peça, formas de pagamento, feriados | Alterada | Dificuldade padrão no serviço | 2 | Baixo |
| D6 | **Cliente completo** | Alterada | **Endereço opcional**; regra "apagar endereço" substituída por minimização | 2 | Baixo |
| D7 | **Anexos e fotos** (até 3 por peça) | Alterada | Foto da **assinatura em papel** | 3 | Baixo |
| D8 | **Medida travada** na aprovação | Mantida | | 3 | Baixo |
| D9 | **QR por OS assinado** | Reduzida | **Sem endereço na Ordem de Produção** | 3 | Baixo |
| D10 | **WhatsApp**: conta, **números reconfiguráveis**, 2 modelos, consentimento, fila, recibos | Alterada | **Tela e histórico de números**; API oficial direta | 5 | Médio |
| D11 | **Acesso** (escopo explícito, papéis, comunidades congeladas) | Mantida | | 1 | Médio |
| D12 | **Módulos ativos** por Conta | Mantida | | 1 | Baixo |
| D13 | **Numeração**, fuso, **horário de funcionamento por dia da semana**, **hora de corte**, feriados | Alterada | **Horário por dia da semana** (seg a sex, sábado, domingo fechado) | 1 e 2 | Baixo |
| D14 | **Segurança de login** | Mantida | Parte no Ciclo 0 (PR #8) | 0 e 1 | Baixo |
| D15 | **Auditoria antes/depois** | Mantida | | 2 a 4 | Baixo |
| D16 | **Plano e assinatura** (estado da Conta) | Alterada | Detalhado em D24 | Depois | Médio |
| D17 | **Link público e assinaturas/confirmações** | Alterada | **Três formas de aprovação**, liberação sem assinatura, **confirmação de retirada** (janela, código, papel), **link seguro** | 3, 5 e 6 | Médio |
| D18 | **Diário de bordo e produtividade** | Nova | | 4 | Médio |
| D19 | **Reconserto e garantia** | Alterada | **7 dias corridos e 90 dias, da retirada**; depois do prazo cobra; liberação do gerente | 6 | Médio |
| D20 | **Tipos de entrega** e **data sugerida x final** | Alterada | **Sobretaxa percentual por tipo**; regras de feriado, Expresso e Urgente | 3 | Médio |
| D21 | **Alertas e indicadores** | Nova | **Alerta de aprovação pendente** | 8 | Baixo |
| D22 | **Financeiro e conciliação da Cielo** | Alterada | **Importação de vendas, baixa em lote, divergências, fechamento do dia, relatório por atendente**; **Pix QR opcional** | 7 | Médio |
| D23 | **Liberação de entrega com saldo** | Nova | | 6 | Baixo |
| D24 | **Cobrança do ANEXSYS** | Nova | | Depois | Médio |
| D25 | **LGPD operacional** | Alterada | Retenção por tipo; registro das operações; expiração do link | 10 | Médio |
| D26 | **Importação do histórico** | Nova | | 10 | Médio |
| D27 | **Divisão automática de OS e grupo de OS** | **Nova** | OS ligadas, um link, um pagamento | 3 | Médio |
| D28 | **Entrega em domicílio** | **Nova (depois do piloto)** | Agora entra **só o marcador e o endereço opcional**; o restante vem depois | Depois | Alto |

### 5.2 Detalhe das mudanças alteradas ou novas na v3

#### D1 e D13. Empresa, Filial padrão e horários (alteradas)

- **O que muda:** nova tabela **Empresas** (CNPJ, razão social, nome fantasia, endereço fiscal). Cada **Filial** aponta para uma **Empresa**. A **Filial padrão** é criada automaticamente. Nova tabela de **horário de funcionamento por dia da semana** (abertura e fechamento; domingo fechado) e **hora de corte** (quando informada). **Feriados por Filial.**
- **Por quê:** hoje o seu ateliê tem 1 CNPJ e nenhuma Filial; o sistema exige ao menos uma. O horário de funcionamento alimenta o Expresso e o prazo.
- **Impacto no que existe:** para cada Conta existente, o sistema cria **1 Empresa** e liga as Filiais atuais; se não houver Filial, cria a **Filial padrão** (nome "Matriz", editável). CNPJ pendente até ser preenchido. Telas "Empresas" (que são Contas) passam a "Contas".
- **Risco:** o login (Conta, Empresa, Filial) muda e será refeito com testes.

#### D3. Catálogo de status (alterada)

- **O que muda:** **Status** (nome interno, nome para o cliente, público ou interno, ordem, papel responsável, exige QR, grava técnica e hora, dispara mensagem, tempo esperado, é inicial, é final), **Regras de passagem** (de qual para qual; **retorno permitido** só na reprovação), **Histórico de status da OS** (imutável) e **limite de OS simultâneas por papel** (hoje 1 para técnica).
- **Novo na v3:** o status interno **Em refação** e a regra do **avanço automático** (o próximo status permitido ao papel de quem leu).
- **Impacto:** a tabela `status_visibility_mappings` é substituída. Os estados atuais da OS são convertidos. Os 6 estados da Ordem de Produção ficam como **estado técnico interno**.

#### D4. Peças, quantidade e dificuldade (alterada)

- **O que muda:** nova tabela **Peças da OS** (descrição, tipo, observação). A **OS** ganha **quantidade de peças (até 5)** e **dificuldade** (a **maior** entre os serviços, **ajustável** pelo atendente). Cada **serviço** do catálogo tem **dificuldade padrão**.
- **Impacto no que existe:** cada **item existente** vira **uma peça com um serviço**; a dificuldade assume o padrão do serviço (2, até você definir).

#### D17. Link público, aprovação e retirada (alterada)

- **O que muda:** **Links públicos** (código **longo e aleatório**, **validade**, **revogação**, **limite de tentativas**, ações: acompanhar, aprovar, confirmar retirada) e **Assinaturas e confirmações** com **método** (link, balcão, papel, janela de retirada, código, papel na retirada), **quem registrou**, **texto aceito**, **valor e serviços no momento**, **data e hora**, **aparelho e rede**, **anexo (foto do papel)**, **nome e documento de quem retirou** (terceiros) e **motivo da liberação** (produção sem assinatura).
- **Aproveitamento:** o servidor já tem tabelas de **credenciais e códigos temporários de retirada** (das sprints antigas). Serão **reaproveitadas** sempre que servirem.
- **Impacto:** nada existente em produção.

#### D19. Reconserto e garantia (alterada)

- **O que muda:** a OS ganha **tipo** (normal, reconserto de ajuste, garantia de defeito), **OS original vinculada**, **técnica original** e marca **sem valor**. **Regras configuráveis por Conta:** 7 dias corridos e 90 dias, **contados da retirada**; **depois do prazo**, a OS nova é **cobrada**, com **liberação do gerente com motivo**.
- **Impacto:** os campos de garantia atuais (7 dias por Conta, contados de datas da OS) são **ajustados**.

#### D20. Tipos de entrega e sobretaxa (alterada)

- **O que muda:** **tipos de entrega configuráveis** (Normal, Expresso, Urgente) com **sobretaxa percentual** por tipo e a regra de data de cada um (Normal: mesmo dia da semana seguinte; Expresso: até 2 horas por peça no horário de funcionamento; Urgente: 2 ou 3 dias úteis, sugestão de 3). A OS guarda **data sugerida**, **data final** e **quem alterou**, com motivo.
- **Impacto:** valores atuais **Standard, Priority, Express** são convertidos para **Normal, Urgente, Expresso**. O motor de data atual (domingo fechado) é ampliado.

#### D22. Financeiro e conciliação da Cielo (alterada)

- **O que muda:** reaproveita pagamentos e pagamentos parciais já existentes. Acrescenta: **lotes de importação** de vendas da Cielo; **vendas do adquirente** (número de autorização, valor, bandeira, parcelas, data e hora); **casamentos** (venda x pagamento da OS: automático, manual ou sem OS); **fechamento do dia por Filial** (quem fechou, diferenças); **baixa em lote**; e leitura para o **relatório "quem deixou de cobrar"** (OS retiradas sem pagamento conciliado, por atendente). **Pix QR** (cobrança com valor, situação) **se entrar**.
- **Como a venda se liga à OS:** **depende do modelo da maquininha e da regra escolhida** (pergunta 3 da segunda rodada). A recomendação é o atendente **registrar o pagamento na OS** e o sistema **conferir com a Cielo**.
- **Impacto:** o servidor hoje só tem **contratos** para Stone, Cielo e PagBank, sem integração real. A conciliação por arquivo ou consulta **é bem menos trabalhosa** que a integração em tempo real.
- **Risco:** o formato de arquivo ou a consulta da Cielo dependem do **modelo e do contrato**.

#### D27. Divisão automática de OS (nova)

- **O que muda:** um **grupo de OS** liga as OS irmãs (a primeira e a(s) criada(s) pela divisão). A divisão acontece quando a OS passa de 5 peças: as peças excedentes vão para **uma nova OS** do mesmo cliente, mesmo tipo de entrega e mesma data sugerida. O grupo tem **um link**, **um aviso de OS aberta** e **um pagamento** (**assumido, a confirmar**). Cada OS mantém sacola, Ordem de Produção e QR.
- **Impacto:** nada existente.
- **Risco:** regras de preço, desconto e cancelamento dentro do grupo (a OS cancelada afeta o grupo?). Serão definidas no Ciclo 3.

#### D28. Entrega em domicílio (nova, depois do piloto)

- **O que muda (agora):** apenas o **marcador** "entrega em domicílio" na OS e o **endereço opcional** do cliente.
- **O que muda (depois):** **solicitações de entrega** (OS, endereço, coordenadas, distância, valor calculado, situação), **regras e faixas de preço**, **comprovante de entrega**. O **endereço não é impresso na Ordem de Produção**; usa-se uma **Guia de entrega separada**.
- **Por quê:** o parecer recomenda deixar para depois por prazo, privacidade (geolocalização é dado pessoal), responsabilidade e prova de entrega.
- **Risco:** alto (novo fornecedor de mapas, contrato, transporte).

#### Mudanças mantidas das versões anteriores (resumo)

- **D2 Porteiro no banco:** o banco recusa linhas de outra Conta mesmo que o programa peça; vínculos entre Contas diferentes ficam travados; **modo de observação** antes de bloquear; **teste automático de vazamento**. Nenhuma mudança nos dados; muda como o programa fala com o banco.
- **D5 Catálogos:** serviços (preço, **dificuldade padrão**, tempo médio), tipos de peça, formas de pagamento e feriados por Filial. Itens antigos ficam em texto; novos itens exigem catálogo.
- **D6 Cliente completo:** WhatsApp obrigatório (formato internacional), CEP com endereço **opcional**, consentimentos (finalidade, autorizou ou recusou, quando, como, quem registrou), responsável para menores. O campo atual "celular/WhatsApp" é copiado; consentimentos nascem "não informado" (sem envio automático até registrar).
- **D7 Anexos e fotos:** fotos opcionais, até 3 por peça, só da peça; arquivos fora do banco.
- **D8 Medida travada:** a OS guarda o conjunto de medidas usado e o trava na aprovação.
- **D9 QR por OS assinado:** o QR que já existe por Ordem de Produção ganha código longo e aleatório, assinatura, estado (ativo, revogado, substituído), motivo, contagem de impressões e eventos de leitura com resultado e chave de repetição. Como não há impressão real em circulação, os atuais são reemitidos.
- **D10 WhatsApp:** tabela da **conta do WhatsApp Business** e tabela de **números** (ativo, desde quando, até quando), **2 modelos** (OS aberta e Pronto), **consentimento**, **fila** (pendente, enviando, enviada, entregue, lida, falhou, cancelada; tentativas; motivo do erro) e **recibos**. Registros antigos "enviado" são reclassificados como "registro interno, não enviado".
- **D11 Acesso:** escopo explícito (Empresas e Filiais permitidas; "todas" é marca visível), 5 papéis prontos, comunidades congeladas, relatório "quem perde o quê" aprovado por você antes de aplicar.
- **D12 Módulos ativos por Conta:** liga e desliga OS, produção, WhatsApp, financeiro etc. O que está fora do piloto fica desligado.
- **D14 Segurança de login:** limite de tentativas (**já no PR #8**), recuperação de senha, convite por e-mail, cookie seguro no lugar de `localStorage`.
- **D15 Auditoria antes/depois:** o registro guarda o valor antigo e o novo nos cadastros e na OS.
- **D16 Plano e assinatura:** no começo, só o estado da Conta (ativa, em teste, suspensa). O módulo de cobrança é a D24.
- **D18 Diário de bordo:** vínculo do usuário (funcionária, diarista, terceiro), responsável técnica por OS (original e refação) e registros de trabalho alimentados pelas leituras de QR.
- **D21 Alertas e indicadores:** regras de alerta (por exemplo, faltam X horas), alertas gerados e **alerta de aprovação pendente**; leituras para o dashboard.
- **D23 Liberação de entrega com saldo:** registro de liberações (OS, gerente, motivo, data).
- **D24 Cobrança do ANEXSYS:** planos, preços configuráveis (à vista ou parcelado), contratos de 1 ano, faturas e tentativas de cobrança (cartão online, Pix, boleto). Antes do segundo cliente.
- **D25 LGPD operacional:** pedidos do titular, retenção (5 anos para inativos; prazos menores para endereço de entrega e coordenadas), registro das operações de tratamento, expiração do link.
- **D26 Importação do histórico:** áreas temporárias para receber as planilhas do sistema atual, validar e só então efetivar, com desfazer; depois da sua validação.

### 5.3 Garantias para a migração

- **Cópia de segurança antes** de cada mudança e **ensaio numa cópia**.
- **Passos:** adicionar o novo sem tirar o antigo; copiar; mudar o programa; só no fim remover o antigo.
- **Cada migração com "desfazer"** testado.
- **Relatório de conferência** em português depois de cada migração.
- Como **não há dado real**, os dados de teste podem ser **recriados** por um script de demonstração.

---

## 6. Ciclos de evolução (reordenados na v3)

Cada ciclo traz: **objetivo**, **o que será feito**, **banco**, **o que você vê**, **como valida**, **aprovado se**, **fora do ciclo**, **decisões antes**.

### Ciclo 0. Casa arrumada (tamanho P)

**Objetivo:** terreno confiável: documentação única, falhas gritantes de segurança fechadas, ambiente de testes em nuvem e cadastros externos iniciados.

**O que será feito**

1. **Documentação consolidada em português** (PR #8): glossário, decisões, fluxo de status, estado atual; antigos em `docs/arquivo/`.
2. **Segurança rápida** (PR #8): criar Conta fechado ao público; senhas de exemplo removidas; limite de tentativas de login.
3. **Ambiente de testes em nuvem** (você cria a conta; nós montamos), com **dados de demonstração**.
4. **Cadastros externos em paralelo** (seção 8): **Meta/WhatsApp (API oficial, número da Vivo)**, **Cielo (modelo e formato de conciliação)**, **e-mail (anexsys.com.br)**.
5. **Corrigir os testes de integração** (hoje 15 de 39 passam, **antes e depois do PR**): atualizar a preparação das suítes para o cadastro de cliente atual e republicar o resultado em português.
6. Reclassificação das mensagens "enviadas" sem envio.

**Banco:** parte de D14; reclassificação de D10. **Sem mudar o esquema** no PR #8.

**Como valida:** abre o link de testes; tenta criar Conta sem estar logado (recusado); erra a senha seis vezes (bloqueia); abre o documento oficial e confere o glossário; vê o relatório de testes de integração.

**Aprovado se:** os testes acima passam e você lê o documento oficial sem precisar de outro.

**Decisões antes:** **perguntas 1 e 3 da segunda rodada** (valor da nuvem e domínio; modelo da Cielo).

---

### Ciclo 1. Multiempresa correto (tamanho M)

**Objetivo:** Conta, Empresa e Filial separados, com a **Filial padrão** e o isolamento garantido no banco.

**Feito:** D1, D2, D11, D12, D13 (parte). **Telas:** **Contas** (só você), **Empresas, Filiais e Usuários** (por Conta); **Filial padrão** com **horário de funcionamento**; **5 papéis** do ateliê; relatório **"quem perde o quê"**; **teste automático de vazamento**.

**Você vê:** duas Contas de teste ("Ateliê A" e "Ateliê B"), cada uma com Empresa e **Filial padrão**; o seu ateliê configurado com o **horário de funcionamento** (seg a sex 9h30 às 18h; sábado 9h30 às 14h); relatório de isolamento.

**Valida ("teste do espelho"):** cria "Maria Teste A" na Conta A; entra na B e busca "Maria": não aparece; tenta abrir uma tela da A com o usuário de B: nega; cria um usuário de recepção só na Filial padrão e confere que **não vê** outra Filial; lê o relatório automático de isolamento.

**Aprovado se:** nenhum dado de A aparece em B e o relatório mostra todas as tabelas do núcleo protegidas.

**Decisões antes:** **pergunta 2 da segunda rodada** (hora de corte).

---

### Ciclo 2. Cadastros e catálogo de status (tamanho G)

**Objetivo:** cadastros completos e o **catálogo de status configurável**, o coração do negócio.

**Feito:** D3, D5, D6, D13, D15. **Telas:** Cliente (busca multicritério; CEP; **WhatsApp obrigatório**; consentimento; responsável por menor; **endereço opcional**); **Serviços** (preço fixo, **dificuldade padrão**, tempo médio); **Tipos de peça**; **Formas de pagamento**; **Feriados por Filial**; **Ficha de medidas em lista**; **Catálogo de status** com o **modelo da seção 2.2 já carregado**, incluindo **Em refação**.

**Você vê:** a tela de status com os 6 status públicos mais os 2 internos.

**Valida:** edita um nome público; tenta criar uma regra que **pula** um status (recusa); confere que a **reprovação** é o único retorno; cadastra cliente **menor sem responsável** (recusa) e sem WhatsApp (recusa); cadastra 3 serviços com **dificuldades diferentes**.

**Aprovado se:** você reproduz o fluxo real do ateliê na tela de status sem pedir ajuda.

---

### Ciclo 3. OS completa e Ordem de Produção impressa (tamanho G)

**Objetivo:** abrir uma OS de verdade, aprovada, com a Ordem de Produção impressa e o QR.

**Feito:** D4, D7, D8, D9, D17 (aprovação e link), D20, D27. **Formulário de OS** (cliente, Filial, atendente, **peças até 5**, **serviços do catálogo**, **dificuldade (a maior, ajustável)**, fotos opcionais até 3 por peça, **tipo de entrega (Normal, Expresso, Urgente) com sobretaxa e data sugerida editável**, resumo financeiro). **Divisão automática** em segunda OS ligada. **Aprovação por link, balcão ou papel** (com foto e "assinado no papel"). **Produção sem assinatura com liberação e motivo.** **Link público seguro** (campos mínimos, expira, revogável). **Medida travada.** **Ordem de Produção impressa** (QR grande, quantidade de peças, dificuldade, descrição, data de entrega; **sem preço e sem endereço**). Botões de **aprovar, cancelar, recalcular prazo**.

**Você vê:** a Ordem de Produção em papel comum, com QR grande.

**Valida:** abre uma OS com 3 peças; assina pelo link no celular; faz outra OS e **assina na tela do balcão**; faz outra e **imprime, assina no papel, anexa a foto e clica "assinado no papel"**; abre uma OS com **7 peças** e confere que o sistema **divide em duas OS ligadas**; confere que o cliente recebe **um só link** com as duas; troca o tipo para **Expresso** e **Urgente** e confere data sugerida e sobretaxa; **altera a data** e confere o registro; tenta iniciar a produção **sem assinatura** (exige liberação e motivo); abre o link com um código errado (recusa); imprime a Ordem de Produção e confere o conteúdo.

**Aprovado se:** você abre uma OS real, o prazo faz sentido e a Ordem de Produção impressa substitui a atual.

**Decisões antes:** **perguntas 2, 6 e 7 da segunda rodada** (hora de corte, alerta de aprovação, suposições de grupo, dia útil e primeiro nome).

---

### Ciclo 4. Produção por QR, diário de bordo e qualidade (tamanho G)

**Objetivo:** produção controlada pelo celular, com técnicas identificadas.

**Feito:** D18 e parte de D3 e D9. **Tela de leitura** (câmera, mostra a OS, confirma). **Avanço automático** pelo papel de quem leu. **Uma sacola por vez.** **Reprovação**, **Reprovado pela qualidade** e **Em refação**. **Diário de bordo** (o que produziu, descrição, tempo). **Painel de produção** (OS por status; esteira "a fazer" e "finalizadas"). **Login próprio** para técnicas, inclusive diaristas.

**Você vê:** o celular lendo a Ordem de Produção e o painel se atualizando.

**Valida:** com técnica de teste, lê ao pegar (**Em produção**, com hora e nome); tenta **abrir outra sacola** sem terminar a primeira (recusa); lê ao terminar (**Aguardando controle de qualidade**); com revisor, lê (**Controle de qualidade**) e **reprova**; confere que o link público continua mostrando "Controle de qualidade"; uma técnica lê e a OS vai para **Em refação**; ela termina e lê, indo para **Aguardando controle de qualidade**; **lê duas vezes seguidas** (uma só mudança); usuário **sem papel** tenta avançar (nega); QR **alterado** é recusado e registrado.

**Aprovado se:** a leitura é rápida o bastante para o ritmo da oficina (você cronometra) e o diário de bordo substitui o caderno.

---

### Ciclo 5. WhatsApp (API oficial) e acompanhamento (tamanho M)

**Objetivo:** as 2 mensagens chegam ao cliente com o link, com fila e tratamento de falha.

**Feito:** D10, D17 (link completo). **Conta do WhatsApp Business**, **tela para reconfigurar o número** (com histórico e teste de envio), **2 modelos** editáveis, **consentimento**, **fila e tentativas**, **lista de falhas**, **recibos**. **Depende de contrato e aprovação** (seção 8).

**Valida:** cadastra um cliente com **o seu número** e consentimento; abre uma OS: chega a **mensagem 1** com o link; leva a OS até **Pronto para retirada**: chega a **mensagem 2**; passa por "Em produção" e "Controle de qualidade": **nenhuma mensagem**; cliente **sem consentimento**: não envia e mostra o motivo; **simula falha**: aparece na lista de falhas e pode reenviar; **na tela de número**, troca para o número de teste e confere que os modelos continuam valendo e que o envio sai pelo novo número; o sistema **nunca mostra "enviada"** sem confirmação.

**Aprovado se:** os testes passam e o texto das mensagens está do jeito que você quer falar com seus clientes.

**Decisões antes:** a **elegibilidade do número da Vivo** (a Meta confirma no cadastro, no Ciclo 0).

---

### Ciclo 6. Retirada, reconserto e garantia (tamanho M)

**Objetivo:** fechar a OS com retirada comprovada e tratar o retorno do cliente.

**Feito:** D17 (confirmação de retirada), D19, D23. **Retirada** (atendente inicia, cliente confirma pela **janela de confirmação** ou **código**, comprovante no link, **registro de quem retirou**; **plano B** no papel com foto e "entregue assinado"). **Aviso "Falta pagamento"** (não é status). **Bloqueio de entrega com saldo**, **liberação pelo gerente com motivo**. **Reconserto e garantia:** nova **OS sem valor, vinculada**, com a **técnica original**; **7 dias corridos** (ajuste) e **90 dias** (defeito), **da retirada**; **depois do prazo**, OS cobrada, com liberação do gerente.

**Valida:** tenta retirar com saldo em aberto (aviso e bloqueio); gerente libera com motivo; atendente **inicia a retirada**; confere que o botão do link **não funciona antes** da retirada ser iniciada e **expira em 10 minutos** (uso único); confirma e confere o **comprovante** com data, hora e nome; retira por **outra pessoa** (nome e documento obrigatórios); faz uma retirada pelo **plano B**; abre um reconserto no **dia 7** (sem valor) e outro no **dia 8** (cobrado), com liberação do gerente; abre uma garantia no **dia 60** (sem valor) e confere o vínculo e a **técnica original**.

**Aprovado se:** o fluxo da OS fecha sem papel (exceto no plano B) e o reconserto mostra a técnica original.

**Decisões antes:** **pergunta 4 da segunda rodada** (token ou assinatura).

---

### Ciclo 7. Financeiro e conciliação da Cielo (tamanho G)

**Objetivo:** controlar o dinheiro do ateliê, baixar as OS em lote no fechamento do dia e saber **quem deixou de cobrar**.

**Feito:** D22. **Recebimentos** (sinal e saldo), **formas de pagamento**, **contas a receber**, **fluxo de caixa**. **Conciliação da Cielo:** **importar as vendas**, **casar com os pagamentos das OS**, **baixar em lote**, **lista de divergências**, **fechamento do dia por Filial**, **relatório "quem deixou de cobrar"** por atendente. **Pix QR** só se você decidir que entra. **Depende de contrato e do modelo** (seção 8).

**Valida:** registra recebimentos em 3 OS (dinheiro e cartão); no fechamento, **importa as vendas** de teste e confere que **baixou as OS casadas**; **deixa uma OS entregue sem cobrar** e confere que aparece em **"quem deixou de cobrar"**, com o nome do atendente; cria uma **divergência** (venda sem OS) e confere a lista; fecha o dia e confere os totais com o relatório da Cielo.

**Aprovado se:** o caixa do dia fecha com a Cielo e com as OS, e a lista de divergências é compreensível.

**Decisões antes:** **pergunta 3 da segunda rodada.**

---

### Ciclo 8. Dashboard e alertas (tamanho M)

**Objetivo:** acompanhar produção e produtividade pelo próprio sistema.

**Feito:** D21. **Dashboard** por técnica, por quantidade de peças e dificuldade; **tempo médio** por grau (medido ou informado); **dimensionamento de grade**; **alertas de atraso** antes de vencer; **alerta de aprovação pendente** ao atendente; base do **bônus por produtividade** (regra de cálculo a definir).

**Valida:** configura o alerta de "2 horas antes do prazo"; deixa uma OS atrasar e confere o alerta; deixa uma OS **sem aprovação** e confere o alerta ao atendente que a abriu; compara o dashboard com o diário de bordo de um dia.

**Aprovado se:** o painel responde, sem planilha, "quem produziu quanto" e "o que vai atrasar".

**Decisões antes:** **perguntas 6 e 8 da segunda rodada** (prazo do alerta; tempos médios).

---

### Ciclo 9. Homologação em paralelo e ajustes (tamanho M)

**Objetivo:** usar o sistema ao lado do sistema antigo, sem pressa, e ajustar o que aparecer.

**Situação:** **não há concierge nem fila de chegada** no piloto e **o portal é o link público** (já construído nos ciclos 3, 5 e 6). Este ciclo é de **uso real e ajuste**: você e a equipe usam o novo com OS reais, **em paralelo** com o sistema atual, **até ter confiança**.

**Valida:** lista diária de diferenças entre o novo e o antigo; erros de leitura de QR; mensagens que falharam; tempo por OS no balcão.

**Aprovado se:** você diz por escrito "posso virar" (ou "preciso de mais um ajuste").

---

### Ciclo 10. LGPD mínima, importação e virada (tamanho M)

**Objetivo:** entrar em produção com segurança jurídica mínima e dados migrados.

**Feito:** D25, D26. **Termos** (inclusive a **cláusula de aceite eletrônico**), **aviso de privacidade em português**, **canal do titular**, **retenção** (5 anos para inativos; prazos menores para endereço de entrega), **registro das operações de tratamento**, **plano de incidente**, **contrato do ANEXSYS como operador**. **Importação do histórico** (planilhas do sistema atual) **depois da sua validação**. **Backup diário com restauração testada**, **monitoramento** com alerta simples. **Treinamento** (1 página por papel). **Revisão por advogado** (recomendada pelo parecer).

**Valida:** importa uma amostra, confere totais; restaura um backup numa cópia; pede a um colega para **exercer o direito de acesso** de um cliente de teste; lê o aviso de privacidade como se fosse cliente.

**Aprovado se:** nenhum dado se perde, nenhuma informação vaza, e você diz por escrito "pode virar".

---

### Depois do piloto (Ciclo 11 em diante)

Entrega em domicílio completa (com a Guia de entrega, preço por faixa ou geolocalização, comprovante), retirada por terceiros, cobrança do ANEXSYS (D24), Pix QR (se não entrou), concierge com câmera e reconhecimento facial, segundo tipo de negócio, Stone e Rede.

---

## 7. Proposta de marcos até março de 2027 (a confirmar)

**Não é estimativa de esforço.** É a ordem em que as coisas precisam estar prontas para março caber.

| Marco | O que precisa estar pronto |
|---|---|
| **Outubro de 2026** | Ciclos 0 e 1. **Todos os cadastros externos iniciados** (Meta, Cielo, nuvem, e-mail) |
| **Novembro de 2026** | Ciclos 2 e 3 (cadastros, catálogo de status, OS completa, divisão, aprovação, Ordem de Produção impressa) |
| **Dezembro de 2026** | Ciclos 4 e 5 (produção por QR, WhatsApp e link público) |
| **Janeiro de 2027** | Ciclos 6 e 7 (retirada, reconserto, financeiro e conciliação). **Congelamento de funcionalidades do piloto** |
| **Fevereiro de 2027** | Ciclos 8, 9 e 10: dashboard, homologação em paralelo, LGPD, importação |
| **Março de 2027** | **Produção**, com a sua autorização escrita |

### Impacto das respostas de hoje no prazo

| O que muda | Efeito no prazo |
|---|---|
| **Cielo por conciliação** (em vez de integração em tempo real) | **Alivia.** É menos trabalhoso e menos dependente de contrato |
| **Sem concierge e sem fila de chegada**; **portal = link** | **Alivia bastante** (o Ciclo 9 deixa de ser construção) |
| **Avanço automático** (sem modo estação) | **Alivia** (uma regra só) |
| **API oficial decidida** | **Reduz incerteza**, mas **a aprovação da Meta e a elegibilidade do número** continuam sendo o risco externo |
| **Divisão automática de OS** | **Acrescenta** trabalho no Ciclo 3 (regras do grupo) |
| **Em refação**, **sobretaxa**, **aprovação por três formas**, **uma sacola por vez**, **tela de número** | **Acrescentam** pouco cada um |
| **Conciliação em lote com "quem deixou de cobrar"** | **Acrescenta** no Ciclo 7, mas é o que você mais quer ver |
| **Pix QR** | **Acrescenta** se entrar (contrato com banco ou serviço de Pix). **Recomendo deixar fora** do piloto |
| **Entrega em domicílio** | **Ameaça março se entrar.** **Recomendo depois do piloto**, deixando só o marcador e o endereço opcional |
| **Retirada com token** | **Acrescenta pouco** se for a janela de confirmação. Se for token novo por WhatsApp, acrescenta uma mensagem |

**Saldo:** **neutro a levemente positivo**, **desde que a entrega em domicílio e o Pix QR fiquem fora do piloto**. Se a entrega em domicílio entrar, o prazo de março **deixa de ser seguro** e algo precisa sair (ver plano de corte).

**O que mais pode atrasar** continua **não sendo a programação**: é **aprovação externa** (Meta, Cielo) e a **sua disponibilidade para validar** (você indicou 4 a 8 horas por dia, o que ajuda muito). Mais dois cuidados: **as respostas pendentes da segunda rodada** (principalmente nuvem, hora de corte e modelo da Cielo) **precisam chegar logo**, e **os testes de integração** precisam ser corrigidos antes do Ciclo 1.

**Plano de corte, se estiver atrasado no congelamento de janeiro** (o que sai do piloto, em ordem):

1. **Importação do histórico completo** (entram só clientes e medidas).
2. **Pix QR** (se tiver entrado).
3. **Dashboard avançado** (ficam o painel de produção e os alertas de atraso).
4. **Bônus de produtividade** (fica o diário de bordo).
5. **Stone e Rede** (fica só a Cielo).
6. **Divisão automática de OS** (volta a ser um bloqueio com orientação para abrir outra OS).

**O que não sai de jeito nenhum:** isolamento por Conta, catálogo de status, QR assinado, avanço automático, 2 mensagens de WhatsApp, aprovação, retirada comprovada, aviso e bloqueio de pagamento, conciliação da Cielo com baixa em lote, LGPD mínima, backup testado.

---

## 8. O que depende de contrato ou cadastro externo

| Item | O que é preciso | Quem faz | Quando começar |
|---|---|---|---|
| **WhatsApp (API oficial direta)** | Cadastro da **Empresa** (CNPJ) na Meta e **verificação**; **número da Vivo** com **uso simultâneo** (**a Meta confirma a elegibilidade no cadastro**); **aprovação dos 2 modelos**. Se o número não for elegível, **comprar outro** | Você (titular do CNPJ), com apoio nosso | **Já, no Ciclo 0** |
| **Maquininha Cielo (conciliação)** | **Modelo da maquininha** (pergunta 3); **forma de obter as vendas** (arquivo, portal ou consulta) no seu contrato; **regra de ligação venda e OS**; **QR Pix** (se entrar) com banco ou serviço de Pix | Você, com a Cielo | **Ciclo 0** |
| **Nuvem** | Você cria a conta e dá acesso a quem operar; **valor máximo** (pergunta 1) | Você | **Ciclo 0** |
| **Domínio anexsys.com.br** | **Onde está registrado** e **acesso ao painel** (pergunta 1) | Você | **Ciclo 0** |
| **E-mail** | Serviço de e-mail transacional ligado ao domínio | Nós, com acesso ao domínio | Ciclo 0 |
| **Stone e Rede** | Mesmos itens, em segundo plano | Você | Depois da Cielo funcionar |
| **Cobrança do ANEXSYS** | Conta em um **gateway** com cartão recorrente, Pix e boleto; contrato de 1 ano | Você | Antes do segundo cliente |
| **Mapas (entrega em domicílio)** | Fornecedor de cálculo de distância e contrato | Decisão sua | Só se a entrega entrar |
| **Advogado** | Revisão do aviso de privacidade, termos, cláusula de aceite eletrônico e contrato de operador | Você | Antes do Ciclo 10 |
| **Fiscal (nota)** | Você **não mencionou nota fiscal** | Decisão sua | Quando decidir |

---

## 9. Consolidação da documentação

**Estrutura em `docs/` (PR #8, em rascunho):** `00-leia-primeiro`, `01-glossario`, `02-decisoes-do-andre`, `03-fluxo-de-status`, `04-estado-atual`, `05-plano-de-continuidade` e `arquivo/` (somente leitura).

**Cada ciclo termina atualizando** `02`, `03` e `04`. **Sem percentual de prontidão sem critério**: só "demonstrado? testado com banco? aceito pelo André?". **Todo documento tem data e "substitui/substituído por".**

---

## 10. O que fica de fora do piloto (e para quando)

| Item | Quando |
|---|---|
| **Entrega em domicílio** (com preço por geolocalização) | **Depois do piloto**, com a Guia de entrega separada e análise de privacidade |
| **Retirada por terceiros** (token por WhatsApp; portador informa número da OS e token) | "Próxima versão" |
| **Concierge e fila de chegada** | Fora do piloto |
| **Concierge com câmera e reconhecimento facial** | Versão futura, com análise de privacidade |
| **Cartão online com cartão cadastrado pelo cliente** | Não previsto (você não vê como boa saída) |
| **Pix QR** | Opcional; recomendação: depois do piloto |
| **Cobrança do ANEXSYS** | Antes do segundo cliente |
| **Segundo tipo de negócio** | Depois do piloto do ateliê |
| **Registro de conversas de WhatsApp e aprovação por resposta de mensagem** | Não previsto |
| **Modo offline de leitura** | Não necessário |
| **Fiscal (notas)** | A decidir |

---

## 11. Riscos e como reduzi-los

| # | Risco | Impacto | Como reduzimos |
|---|---|---|---|
| 1 | **Prazo de março** com escopo de piloto completo | Alto | Marcos, congelamento em janeiro e plano de corte (seção 7) |
| 2 | **Meta não aprova o número da Vivo para uso simultâneo** ou recusa modelos | Alto | Cadastro já no Ciclo 0; plano B com **outro número**; texto sóbrio |
| 3 | **Formato da Cielo** indefinido (modelo da maquininha) | Médio | Perguntar à Cielo no Ciclo 0; camada comum para Stone e Rede |
| 4 | **Casar venda com OS** na conciliação gera divergências | Médio | Atendente registra o pagamento na OS; lista de divergências; fechamento do dia |
| 5 | **Isolamento no banco (D2) quebra telas** | Alto | Modo de observação, teste de vazamento, ciclo próprio |
| 6 | **Testes de integração quebrados** escondem regressões | Alto | **Corrigir no Ciclo 0** (hoje 15 de 39) |
| 7 | **QR por OS** não mostra a peça atrasada numa OS de várias peças | Médio | Aceito por você; quantidade e dificuldade medem; revisão após o piloto |
| 8 | **Retirada com token** vira disputa com o cliente | Alto | **Janela controlada pelo atendente**, registro de quem retirou, comprovante, plano B no papel, cláusula de aceite, revisão por advogado |
| 9 | **Link público** vaza ou é adivinhado | Alto | Código longo e aleatório, expiração, revogação, limite de tentativas, campos mínimos |
| 10 | **LGPD tratada como "livre"** | Alto | Parecer; escopo do Ciclo 10; aviso, canal do titular, retenção, incidente, advogado |
| 11 | **Entrega em domicílio entra no piloto** | Alto | Recomendação: depois do piloto; marcador e endereço opcional agora |
| 12 | **Endereço impresso na Ordem de Produção** | Médio | **Não imprimir**; Guia de entrega separada |
| 13 | **Divisão automática** causa confusão de preço ou de cancelamento no grupo | Médio | Regras do grupo no Ciclo 3; teste dedicado |
| 14 | **Uma sacola por vez** trava a produção em casos reais | Médio | Limite configurável por papel; ouvir no paralelo |
| 15 | **Funcionários resistem a ler QR** | Alto | Medir tempo; treinamento curto; login simples; ouvir no paralelo |
| 16 | **Hora de corte e tempos médios** não informados | Baixo a médio | Perguntas da segunda rodada; o sistema **mede** os tempos |
| 17 | **Dependência da sua disponibilidade** como único homologador | Médio | Roteiros curtos; vídeo; reunião opcional |
| 18 | **Documentação nova também envelhece** | Médio | Ciclo só fecha com documentação atualizada |

---

## 12. Pontos que ainda dependem de você

Todos estão nas perguntas complementares da segunda rodada (fora do repositório), do mais bloqueante para o menos:

1. **Valor máximo da nuvem e onde o domínio está registrado** (pergunta 1). **Bloqueia o Ciclo 0.**
2. **Hora de corte** (pergunta 2). **Bloqueia o prazo da OS (Ciclo 3) e a configuração do Ciclo 1.**
3. **Modelo da maquininha Cielo e como ligar a venda à OS**, mais **Pix QR agora ou depois** (pergunta 3). **Bloqueia a consulta à Cielo no Ciclo 0 e o Ciclo 7.**
4. **Retirada: token ou assinatura** (pergunta 4). **Bloqueia o Ciclo 6** e o texto da cláusula de aceite.
5. **Entrega em domicílio** (pergunta 5): fora de março (recomendado) ou com quais regras.
6. **Prazo do alerta de aprovação pendente** (pergunta 6).
7. **Cinco suposições** a confirmar (pergunta 7).
8. **Tempos médios por dificuldade** (pergunta 8). Não bloqueia o início.
