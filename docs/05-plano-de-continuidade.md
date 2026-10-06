# Plano de continuidade do ANEXSYS (versão 4)

> Cópia da versão 4 de 05/10/2026 para manter o conjunto de documentos completo. Os documentos de apoio que não estão no repositório são o diagnóstico original e as perguntas complementares. As decisões em vigor estão em `02-decisoes-do-andre.md`.

**Para:** André
**Versão:** 4, de 05/10/2026 (noite). Substitui a versão 3 (tarde). Incorpora as suas respostas da terceira rodada, a **mudança do pagamento para integração online com a maquininha** e o princípio da **tela de parâmetros**.
**Bases:**
- Suas decisões, em `02-decisoes-do-andre.md` (seções 1 a 11).
- O parecer sobre a integração com a maquininha, em `07-parecer-integracao-maquininha.md`.
- O parecer sobre token, LGPD e entrega em domicílio, em `06-parecer-token-lgpd-entrega.md`.
- O que ainda precisa de resposta, nas perguntas complementares da terceira rodada (fora do repositório).
- O diagnóstico original, fora do repositório.

**Regra deste documento:** linguagem de negócio. Termo técnico vem explicado em uma frase.

**Sobre prazos:** a única data firme é a sua: **produção em março de 2027**. Não estimo esforço em horas ou semanas. Os "marcos" da seção 7 são uma **proposta de sequência**, montada de trás para frente, para você confirmar.

**O que mudou da v3 para a v4 (resumo):** o **pagamento** passa a ser **integrado online à maquininha**: o sistema aciona a maquininha com o valor da OS e recebe o resultado (a **conciliação** e o **QR Pix** na tela **saíram**). Isso vira um **ciclo grande, com dependência de contrato e risco de prazo explícito**, com **ponto de decisão em dezembro de 2026** e **baixa manual como plano B**. A **retirada** nesta fase é **só assinatura no papel**. O **alerta de aprovação pendente** é **diário e sempre visível**. A **hora de corte** é o **horário de fechamento**. O ambiente de testes usa o domínio **atelierizagusmao.com.br**. Os **tempos médios** estão definidos (30, 60, 90 e 180 minutos). E há um novo **requisito transversal: para todas as regras deve existir uma tela de parâmetros**, administrável por você.

---

## 1. Resumo executivo

### O que mudou da versão 3 para a versão 4

| Assunto | Versão 3 | Versão 4 (suas respostas da rodada 3) |
|---|---|---|
| Pagamento na maquininha | Conciliação da Cielo (importar vendas, baixar em lote) e Pix QR opcional | **Integração online:** a partir da OS, o sistema **aciona a maquininha já com o valor da OS** e recebe o resultado. **Conciliação e Pix saíram.** É o "maior trunfo" do sistema, "mesmo que demore mais" |
| Maquininha | Cielo, modelo não informado | **Cielo LIO** atual; **aceita trocar de operadora** se outra integrar melhor. Prefere Bluetooth (aceita cabo USB), mas o parecer mostra que **sistema web integra pela internet**, sem Bluetooth nem cabo no computador |
| Retirada | Em aberto (token, janela de confirmação ou papel) | **Só assinatura no papel** nesta fase: **foto anexada na OS e botão "entregue assinado"**. Sem token nem janela por ora |
| Entrega em domicílio | Recomendação: depois do piloto | **Depois do piloto**, só o **marcador** e o **endereço opcional**. Você ainda não trabalha com entrega |
| Aprovação pendente | Em aberto (prazo do alerta) | **Aviso todos os dias até o cliente assinar**, para **atendente e gerente**, com **lista sempre visível** na tela. **Não é por prazo** |
| Hora de corte | Em aberto | **O próprio fechamento:** 18h de segunda a sexta; 14h no sábado |
| Ambiente de testes | Até R$ 150/mês (a confirmar) | **Até R$ 150/mês.** Domínio **atelierizagusmao.com.br** (Registro.br), **só para homologação e uso próprio**; para comercializar, outro domínio. O `anexsys.com.br` fica para depois. Você controla o painel |
| Suposições | A confirmar | **Todas confirmadas:** sábado é dia útil; OS dividida forma grupo; reconserto e garantia são a mesma coisa (7 dias corridos e 90 dias); fuso de Brasília e reais; link mostra só o primeiro nome |
| Tempos médios por dificuldade | Em aberto | **Grau 1 = 30 min, 2 = 60, 3 = 90, 4 = 180** (configuráveis) |
| Tela de parâmetros | Parcial | **Requisito transversal:** **toda regra de negócio tem tela de parâmetros** (graus e tempos, inclusive **aumentar ou diminuir graus**, logística de produção, prazos, cortes, sobretaxas, status etc.), administrável por você |

### Ordem dos ciclos (visão rápida)

| Ciclo | Nome | Tamanho | O que você vê no final |
|---|---|---|---|
| **0** | Casa arrumada | P | Documentação única; falhas de segurança fechadas; ambiente de testes em nuvem em **atelierizagusmao.com.br**; testes de integração corrigidos; cadastros externos iniciados |
| **1** | Multiempresa correto | M | Duas Contas de teste isoladas; Empresa; **Filial padrão** com horário e **corte no fechamento**; usuários por escopo |
| **2** | Cadastros, catálogo de status e **tela de parâmetros** | G | Clientes, serviços, feriados, ficha de medidas, **catálogo de status** e a **tela de parâmetros** com os primeiros grupos |
| **3** | OS completa, Ordem de Produção impressa e aprovação | G | OS com peças, divisão, dificuldade, entrega Normal/Expresso/Urgente, aprovação por link, balcão ou papel, **lista e aviso diário de aprovação pendente**, link público, OP impressa com QR |
| **4** | Produção por QR, diário de bordo e qualidade | G | Avanço automático, uma sacola por vez, reprovação e **Em refação**, diário de bordo |
| **5** | WhatsApp (API oficial) e acompanhamento | M | As 2 mensagens com o link; tela de número; falhas na lista |
| **6** | Retirada em papel, reconserto e garantia | M | **Retirada com assinatura no papel** (foto + "entregue assinado"); aviso de pagamento; reconserto e garantia |
| **7** | **Pagamento integrado na maquininha** | G | A OS **aciona a maquininha com o valor**; resultado gravado na OS; **baixa manual como plano B**. **Depende de contrato** |
| **8** | Dashboard e alertas | M | Painel de produção e produtividade; alertas de atraso |
| **9** | Homologação em paralelo e ajustes | M | Uso paralelo com o sistema antigo; ajustes sem pressa |
| **10** | LGPD mínima, importação e virada | M | Consentimento, aviso de privacidade, retenção, canal do titular; importação do histórico após a validação |
| **Depois** | Entrega em domicílio, retirada por token, cobrança do ANEXSYS, segunda operadora de maquininha, concierge com câmera, segundo tipo de negócio | n/a | Seção 10 |


---

## 2. As suas decisões, traduzidas em regras do sistema

### 2.1 O fluxo da OS, do balcão à retirada

```
ATENDIMENTO            APROVAÇÃO                  SACOLA + OP IMPRESSA       PRODUÇÃO               QUALIDADE             RETIRADA
Cliente chega,    ->   Link, balcão ou papel ->   Peças vão numa sacola  ->  Técnica lê o QR   ->   Revisor lê o QR  ->  Cliente retira e
mede, OS é aberta      ("concordo com serviço     (até 5 peças) com a OP     ao pegar e ao          ao pegar; aprova      assina a Ordem de
e vai por WhatsApp     e preço"). Produção pode   impressa no bolso          terminar. Uma          ou reprova            Produção em papel
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

- **Dia útil** = dia em que a Filial funciona: segunda a sábado, exceto feriados fechados. **Confirmado.**
- **Horário de funcionamento (Filial padrão):** segunda a sexta, 9h30 às 18h; sábado, 9h30 às 14h; domingo fechado.
- **Hora de corte:** **o próprio fechamento** (18h de segunda a sexta; 14h no sábado). Uma OS aberta **depois do fechamento** conta como aberta no **próximo dia útil**. **Decidido.** Parametrizável.
- **Normal:** mesmo dia da semana da semana seguinte (segunda para segunda; vale sábado). **Feriado:** o sistema **sugere o próximo dia útil** e o **atendente decide** caso a caso.
- **Expresso:** até **2 horas por peça**, contadas **só no horário de funcionamento**. O que não couber **passa para a abertura do dia seguinte**.
- **Urgente:** o atendente escolhe **2 ou 3 dias úteis**, com **sugestão de 3**.
- **Sobretaxa:** **percentual configurável por tipo** de entrega (Normal, Expresso, Urgente).
- O sistema **sugere** a data e o atendente **pode alterar** (fica registrado quem alterou e por quê).
- **Todos os valores acima são parâmetros** editáveis na tela de parâmetros (seção 4.5).

### 2.4 Garantia e reconserto

- **Dois prazos diferentes**, ambos contados **da retirada pelo cliente**:
  - **7 dias corridos** para reclamar de **ajuste** (curto, largo);
  - **90 dias** de **garantia de defeito de execução** (descosturou, a barra se desfez), negociável no balcão.
- **Dentro do prazo:** o atendente analisa e cria uma **nova OS sem valor, vinculada à OS original**, mostrando o **técnico que fez a primeira vez**. **Confirmado:** vale para os dois tipos (reconserto de ajuste e garantia de defeito).
- **Depois do prazo:** a OS nova é **cobrada**. O **gerente pode liberar sem valor, com motivo**.

### 2.5 Técnica e produtividade

- Cada técnica (inclusive **diaristas e terceiros**) tem **login próprio** e lê o QR no celular. Isso vira o **diário de bordo**: o que cada uma produziu, em quanto tempo, com a **descrição do serviço** de cada peça.
- A **dificuldade** é definida **por serviço**, com valor padrão no catálogo. A **OS mostra a maior** entre seus serviços, e o **atendente pode ajustar**.
- **Graus e tempos médios (decidido):** **grau 1 = 30 minutos, grau 2 = 60, grau 3 = 90, grau 4 = 180.** **Os graus são configuráveis**: você pode **aumentar ou diminuir a quantidade de graus** e mudar os tempos na tela de parâmetros.
- Com a **quantidade de peças**, isso estima o **tempo médio**, dimensiona a **grade de costureiras** e alimenta o **bônus por produtividade**. Os **parâmetros de logística de produção** (peças por sacola, sacolas por técnica, grade de técnicas) também ficam na tela de parâmetros.
- **Dashboard** por técnica e por quantidade de peças. **Alertas de atraso** antes de vencer, com parâmetros configuráveis.

### 2.6 O que o cliente recebe e faz

- **WhatsApp 1 (OS aberta):** mensagem configurável pela plataforma, com **link**. Modelo seu: "Olá, [nome do cliente], aqui é do [nome do estabelecimento], você está recebendo a sua ordem de serviço digital, acompanhe o status de produção, mas fique tranquila que por este canal avisaremos quando estiver pronto, entre agora para aprovar o que ficou combinado."
- **Link público (sem login):** mostra **só**: **primeiro nome** (confirmado), número da OS, data de entrada, previsão de entrega, status, serviços combinados e situação do pagamento. Permite **assinar a aprovação**. É o **portal** do piloto.
- **WhatsApp 2 (Pronto para retirada):** avisa que a peça está pronta, com o mesmo link.
- **Nenhuma outra mensagem automática.** Não há registro de conversas no sistema; aprovações ficam na OS.
- **Aprovação pendente (decidido):** o sistema **avisa todos os dias**, **até o cliente assinar**, o **atendente e o gerente**, e mantém uma **lista sempre visível na tela** para monitoramento. **Não é por prazo.** A produção pode começar sem assinatura, com liberação e motivo.
- **Mais de 5 peças:** o sistema **divide em uma segunda OS ligada à primeira**. As OS ligadas formam um **grupo** (**confirmado**): o cliente recebe **um só link** com as duas OS, **um só aviso** de OS aberta e **um só pagamento**; cada OS tem sua sacola, sua Ordem de Produção e seu QR.

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
10. **Retirada com assinatura no papel** (foto anexada na OS e botão "entregue assinado").
11. **Reconserto e garantia** como nova OS vinculada.
12. **Pagamento integrado na maquininha** (Cielo LIO): a OS aciona a maquininha com o valor e o resultado volta ao sistema, com **baixa manual como plano B**.
13. Dashboard e alertas.
14. **Tela de parâmetros** para todas as regras (construída desde o Ciclo 2 e ampliada a cada ciclo).
15. LGPD mínima, importação do histórico (após validação), homologação em paralelo.

**O que fica de fora (decidido):** concierge e fila de chegada, retirada por terceiros (próxima versão), concierge com câmera e reconhecimento facial, entrega em domicílio (recomendado para depois), cartão online com cartão cadastrado pelo cliente, **Pix na tela e conciliação de vendas (saíram)**, retirada por token ou janela de confirmação, segundo tipo de negócio, registro de conversas, aprovação por resposta de WhatsApp.

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

### 4.4 Aprovação e retirada (assinaturas)

**Aprovação do cliente ("concordo com o serviço e o preço")**: três formas, todas registradas na OS:

1. **Pelo link**, no celular do cliente.
2. **Na tela do balcão**, o atendente passa o aparelho.
3. **No papel:** o atendente imprime a OS, o cliente assina, o atendente **anexa a foto** e clica **"assinado no papel"** (fica registrado quem clicou e quando).

- Cada registro guarda: **quem**, **data e hora**, **o texto exato aceito**, **valor e serviços na hora**, **aparelho e rede** (para link e balcão) e a **foto** (no papel). A **medida usada fica travada** na aprovação.
- **A produção pode começar sem assinatura**, com **liberação e motivo**.
- **Aprovação pendente:** lista **sempre visível** e **aviso diário** ao atendente e ao gerente **até o cliente assinar** (seção 2.6).

**Retirada (decidido na rodada 3): só assinatura no papel nesta primeira fase.**

- O cliente **assina a Ordem de Produção em papel**. O atendente **anexa a foto** à OS e clica **"entregue assinado"** (fica registrado quem clicou, quando e com qual foto).
- **Aviso "Falta pagamento"** (não é status). **O saldo em aberto bloqueia a entrega, e o gerente libera com motivo.**
- **Sem token e sem janela de confirmação por ora.** O parecer sobre token continua valendo como análise para uma versão futura (a janela de confirmação controlada pelo atendente é a recomendação).
- **Retirada por terceiros:** próxima versão (token por WhatsApp; portador informa o número da OS e o token).

### 4.5 Tela de parâmetros (requisito transversal)

**Princípio decidido:** **para todas as regras deve existir uma tela de parâmetros, administrável por você.** **Nenhuma regra de negócio fica escondida no código.**

**Como funciona:**

- Cada regra tem um **valor padrão** do sistema e **uma tela** onde um administrador com permissão o altera, **por Conta, Empresa ou Filial**, conforme o caso.
- **Todo valor alterado registra:** quem mudou, quando, o **valor anterior** e o **novo** (histórico e possibilidade de voltar).
- **Regra de pronto:** **nenhum ciclo fecha com uma regra nova sem a sua tela de parâmetros.**

**Grupos de parâmetros previstos (cada ciclo acrescenta os seus):**

| Grupo | Exemplos |
|---|---|
| **Graus de dificuldade e tempos** | Quantidade de graus (aumentar ou diminuir), nome e **tempo médio** de cada grau (hoje 30, 60, 90 e 180 minutos) |
| **Logística de produção** | Peças por sacola e por OS (hoje 5), **sacolas por técnica** (hoje 1), grade de técnicas, esteiras |
| **Prazos e tipos de entrega** | Regra de cada tipo (Normal, Expresso, Urgente), horas por peça, dias úteis, sugestão |
| **Horário, corte e feriados** | Horário de funcionamento por dia da semana, **hora de corte**, feriados por Filial |
| **Sobretaxas** | Percentual por tipo de entrega |
| **Status** | Catálogo de status e seus parâmetros (seção 2.2) |
| **Alertas** | Antecedência dos alertas de atraso, frequência do aviso de aprovação pendente |
| **Garantia e reconserto** | Prazos (hoje 7 dias corridos e 90 dias), tipo de contagem, início da contagem |
| **Pagamento** | Formas de pagamento, bloqueio de entrega com saldo, **tempo máximo de espera da maquininha**, número de tentativas |
| **WhatsApp e mensagens** | Textos dos 2 modelos, número ativo, horário de envio |
| **Link público** | Validade, campos exibidos, tentativas |
| **LGPD** | Prazos de retenção, textos de consentimento |
| **Acesso** | Papéis, permissões e escopo |

**O que isso significa para o sistema:** hoje algumas regras estão **fixas no código** (por exemplo, o prazo de garantia padrão e a regra de domingo fechado). Elas serão **movidas para parâmetros**, com os valores de hoje como padrão.

### 4.6 Pagamento integrado na maquininha (decidido na rodada 3)

**O que você decidiu:** **a partir da OS, o sistema aciona a maquininha já com o valor da OS**, para **não digitar valor errado nem cobrar errado**, e **recebe o resultado online**. É o seu **maior trunfo** ("mesmo que demore mais"). **Conciliação e QR Pix na tela saíram.** Cartão online com cartão cadastrado pelo cliente: **não**.

**O que a pesquisa mostrou (resumo; detalhes em `07-parecer-integracao-maquininha.md`):**

- **Existe integração oficial** de **nuvem a nuvem** na **Cielo** (Order Manager), na **Stone**, na **Mercado Pago** e na **Getnet**: o sistema envia o valor à API da operadora **pela internet**, a maquininha recebe e o resultado volta ao sistema.
- **Sem Bluetooth e sem cabo no computador.** A maquininha conecta sozinha (Wi-Fi ou chip). Bluetooth ou USB só existem em integrações com **programa instalado em cada computador** (TEF, PlugPag), o que **não serve** a um sistema web de vários atendentes.
- **A Cielo (Plano A)** é a sua operadora. O **sandbox é gratuito e não exige aparelho**: o desenvolvimento pode começar antes do contrato. A **produção** exige o **token do seu estabelecimento**, pedido ao suporte da Cielo, e um aparelho compatível. **Plano B:** **Mercado Pago Point** ou **Stone Connect**.
- **A construção** usa uma **camada de operadoras**: o ANEXSYS sempre pede "cobrar R$ X da OS Y no terminal Z", e **um adaptador por operadora** traduz. **A Cielo é o primeiro.**

**Fluxo na tela (proposta):** **"Cobrar na maquininha"** na OS, com o **valor da OS** (sinal ou saldo) **sem poder editar**; o sistema envia ao terminal do atendente; mostra **"Aguardando pagamento na maquininha"** com **"Cancelar cobrança"**; acompanha o resultado com **tempo máximo** (parâmetro); em caso de **dúvida** (queda de rede), **consulta a operadora antes de permitir nova cobrança**, para **nunca cobrar duas vezes**; **aprovado** grava na OS **data, hora, valor, forma, bandeira, parcelas, código da transação, atendente e terminal**; **recusado ou cancelado** não marca como pago.

**Dependência de contrato (a mais importante):** credenciamento, **modelo do aparelho** (a Cielo informa que, desde outubro de 2025, trocas e novas contratações são **Cielo Smart**), **token de produção por estabelecimento**, custos e prazos. **Nada disso é público.** Precisa começar **no Ciclo 0**. O roteiro e os e-mails prontos estão em `07-parecer-integracao-maquininha.md`.

**Plano B de contingência:** **baixa manual** (dinheiro, Pix fora do sistema, maquininha fora do ANEXSYS), **com registro de quem baixou e por quê**. Se a Cielo não liberar a produção até o **ponto de decisão de dezembro de 2026**, o piloto entra em março **com baixa manual**, ou troca de operadora.

**O que a integração não resolve sozinha:** o atendente ainda pode fazer **uma venda direto na maquininha**, sem passar pelo ANEXSYS. O controle que fica de graça no sistema: **OS entregue com saldo em aberto**, liberada pelo gerente com motivo, aparece nos relatórios de liberações.

---

## 5. Mudanças propostas no banco de dados (revisadas pela v4)

**Como ler:** o banco é onde o sistema guarda tudo. Cada mudança traz o que muda, por quê, e o que acontece com o que existe. Como **não há dado real a preservar** (decisão 4), todo o conteúdo atual é teste e pode ser recriado; mesmo assim, cada migração é feita em passos reversíveis, com cópia e conferência.

### 5.1 Quadro resumo

Legenda: **Mantida**, **Alterada**, **Reduzida**, **Nova**. As colunas "v3" mostram o que mudou nesta versão.

| # | Mudança | Situação | O que a v3 acrescentou | Ciclo | Risco |
|---|---|---|---|---|---|
| D1 | Nível **Empresa** entre Conta e Filial | Mantida | **Filial padrão** criada junto | 1 | Médio |
| D2 | **Porteiro no banco** (isolamento por Conta) | Mantida | | 1 | Alto |
| D3 | **Catálogo de status** com parâmetros, regras de passagem e histórico por OS | Alterada | Status **Em refação**; **limite de sacolas por técnica**; avanço automático por papel | 2 | Médio |
| D4 | **Peças da OS**, quantidade (até 5) e **dificuldade** | Alterada | **Dificuldade por serviço**, **maior na OS**, ajuste pelo atendente | 3 | Médio |
| D5 | **Catálogos**: serviços (preço, **dificuldade padrão**), **graus de dificuldade configuráveis com tempo médio**, tipos de peça, formas de pagamento, feriados | Alterada | **Graus e tempos configuráveis (30, 60, 90 e 180 min)** | 2 | Baixo |
| D6 | **Cliente completo** | Alterada | **Endereço opcional**; regra "apagar endereço" substituída por minimização | 2 | Baixo |
| D7 | **Anexos e fotos** (até 3 por peça) | Alterada | Foto da **assinatura em papel** | 3 | Baixo |
| D8 | **Medida travada** na aprovação | Mantida | | 3 | Baixo |
| D9 | **QR por OS assinado** | Reduzida | **Sem endereço na Ordem de Produção** | 3 | Baixo |
| D10 | **WhatsApp**: conta, **números reconfiguráveis**, 2 modelos, consentimento, fila, recibos | Alterada | **Tela e histórico de números**; API oficial direta | 5 | Médio |
| D11 | **Acesso** (escopo explícito, papéis, comunidades congeladas) | Mantida | | 1 | Médio |
| D12 | **Módulos ativos** por Conta | Mantida | | 1 | Baixo |
| D13 | **Numeração**, fuso, **horário de funcionamento por dia da semana**, **hora de corte**, feriados | Alterada | **Corte = fechamento** (18h seg a sex; 14h sábado) | 1 e 2 | Baixo |
| D14 | **Segurança de login** | Mantida | Parte no Ciclo 0 (PR #8) | 0 e 1 | Baixo |
| D15 | **Auditoria antes/depois** | Mantida | | 2 a 4 | Baixo |
| D16 | **Plano e assinatura** (estado da Conta) | Alterada | Detalhado em D24 | Depois | Médio |
| D17 | **Link público e assinaturas** | Alterada | **Três formas de aprovação**; **retirada só em papel nesta fase** (foto + "entregue assinado"); link seguro | 3 e 6 | Médio |
| D18 | **Diário de bordo e produtividade** | Nova | | 4 | Médio |
| D19 | **Reconserto e garantia** | Alterada | **7 dias corridos e 90 dias, da retirada**; depois do prazo cobra; liberação do gerente | 6 | Médio |
| D20 | **Tipos de entrega** e **data sugerida x final** | Alterada | **Sobretaxa percentual por tipo**; regras de feriado, Expresso e Urgente | 3 | Médio |
| D21 | **Alertas e indicadores** | Nova | **Lista e aviso diário de aprovação pendente** (atendente e gerente); alertas de atraso | 3 e 8 | Baixo |
| D22 | **Pagamento integrado na maquininha** (camada de operadoras, Cielo primeiro) | **Alterada (substitui a conciliação)** | **A OS aciona a maquininha com o valor**; contas por Empresa, terminais, cobranças e transações; baixa manual de contingência. **Conciliação e Pix saíram** | 7 | Alto |
| D23 | **Liberação de entrega com saldo** | Nova | | 6 | Baixo |
| D24 | **Cobrança do ANEXSYS** | Nova | | Depois | Médio |
| D25 | **LGPD operacional** | Alterada | Retenção por tipo; registro das operações; expiração do link | 10 | Médio |
| D26 | **Importação do histórico** | Nova | | 10 | Médio |
| D27 | **Divisão automática de OS e grupo de OS** | **Nova** | OS ligadas, um link, um pagamento | 3 | Médio |
| D28 | **Entrega em domicílio** | **Nova (depois do piloto)** | Agora entra **só o marcador e o endereço opcional**; o restante vem depois | Depois | Alto |
| D29 | **Tela de parâmetros** (regras configuráveis com histórico) | **Nova (requisito transversal)** | Toda regra tem valor padrão, tela, permissão e histórico de alterações | 2 em diante | Médio |

### 5.2 Detalhe das mudanças alteradas ou novas (v3 e v4)

#### D1 e D13. Empresa, Filial padrão e horários (alteradas)

- **O que muda:** nova tabela **Empresas** (CNPJ, razão social, nome fantasia, endereço fiscal). Cada **Filial** aponta para uma **Empresa**. A **Filial padrão** é criada automaticamente. Nova tabela de **horário de funcionamento por dia da semana** (abertura e fechamento; domingo fechado) e **hora de corte = horário de fechamento** (18h seg a sex; 14h sábado). **Feriados por Filial.**
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

- **O que muda:** **Links públicos** (código **longo e aleatório**, **validade**, **revogação**, **limite de tentativas**, ações: acompanhar e aprovar) e **Assinaturas** com **método** (link, balcão, papel), **quem registrou**, **texto aceito**, **valor e serviços no momento**, **data e hora**, **aparelho e rede**, **anexo (foto do papel)** e **motivo da liberação** (produção sem assinatura).
- **Retirada (rodada 3):** **só em papel nesta fase.** Registra-se o método "**entregue assinado**" (foto da Ordem de Produção assinada anexada à OS, quem clicou e quando). **Token e janela de confirmação ficam para uma versão futura** (o modelo de dados já os comporta).
- **Aproveitamento:** o servidor já tem tabelas de credenciais e códigos temporários de retirada (das sprints antigas); serão reaproveitadas na versão futura.
- **Impacto:** nada existente em produção.

#### D19. Reconserto e garantia (alterada)

- **O que muda:** a OS ganha **tipo** (normal, reconserto de ajuste, garantia de defeito), **OS original vinculada**, **técnica original** e marca **sem valor**. **Regras configuráveis por Conta:** 7 dias corridos e 90 dias, **contados da retirada**; **depois do prazo**, a OS nova é **cobrada**, com **liberação do gerente com motivo**.
- **Impacto:** os campos de garantia atuais (7 dias por Conta, contados de datas da OS) são **ajustados**.

#### D20. Tipos de entrega e sobretaxa (alterada)

- **O que muda:** **tipos de entrega configuráveis** (Normal, Expresso, Urgente) com **sobretaxa percentual** por tipo e a regra de data de cada um (Normal: mesmo dia da semana seguinte; Expresso: até 2 horas por peça no horário de funcionamento; Urgente: 2 ou 3 dias úteis, sugestão de 3). A OS guarda **data sugerida**, **data final** e **quem alterou**, com motivo.
- **Impacto:** valores atuais **Standard, Priority, Express** são convertidos para **Normal, Urgente, Expresso**. O motor de data atual (domingo fechado) é ampliado.

#### D22. Pagamento integrado na maquininha (alterada; substitui a conciliação)

- **O que muda:** a **camada de operadoras** (um adaptador por operadora, **Cielo primeiro**) e as tabelas:
  - **Conta da operadora por Empresa** (credenciais protegidas: Client-ID, token e número do estabelecimento);
  - **Terminais** (número de série), **ligados a uma Filial** e, se você quiser, **a um atendente**;
  - **Cobranças** (OS, valor, tipo: sinal ou saldo, estado: criada, enviada ao terminal, aprovada, recusada, cancelada, expirada, em dúvida; tentativas; quem pediu; operadora; código do pedido);
  - **Transações** (valor, forma, bandeira, parcelas, código da transação, data e hora);
  - **Estornos** (só gerente, com motivo);
  - **Baixa manual** (contingência: quem, quando, motivo, forma).
- **Reaproveita** os pagamentos e pagamentos parciais que já existem no servidor.
- **Saíram:** importação de vendas, fechamento do dia por conciliação, baixa em lote por arquivo, relatório "quem deixou de cobrar" por conciliação e **Pix QR**.
- **Segurança:** **nenhum dado de cartão passa pelo ANEXSYS**; só o **resultado** e os dados da transação.
- **Impacto no que existe:** o servidor hoje só tem **contratos** (interfaces) para Stone, Cielo e PagBank, sem integração real. A estrutura de **pagamentos** é reaproveitada; as **cobranças** são novas.
- **Risco:** **alto**. Depende de **contrato**, do **modelo do aparelho** e do **token de produção** da operadora. Mitigação: **sandbox da Cielo** (sem aparelho) para construir antes; **plano B** (Mercado Pago ou Stone); **baixa manual** como contingência; **ponto de decisão em dezembro de 2026**.

#### D27. Divisão automática de OS (nova)

- **O que muda:** um **grupo de OS** liga as OS irmãs (a primeira e a(s) criada(s) pela divisão). A divisão acontece quando a OS passa de 5 peças: as peças excedentes vão para **uma nova OS** do mesmo cliente, mesmo tipo de entrega e mesma data sugerida. O grupo tem **um link**, **um aviso de OS aberta** e **um pagamento** (**confirmado**). Cada OS mantém sacola, Ordem de Produção e QR.
- **Impacto:** nada existente.
- **Risco:** regras de preço, desconto e cancelamento dentro do grupo (a OS cancelada afeta o grupo?). Serão definidas no Ciclo 3.

#### D28. Entrega em domicílio (nova, depois do piloto)

- **O que muda (agora):** apenas o **marcador** "entrega em domicílio" na OS e o **endereço opcional** do cliente.
- **O que muda (depois):** **solicitações de entrega** (OS, endereço, coordenadas, distância, valor calculado, situação), **regras e faixas de preço**, **comprovante de entrega**. O **endereço não é impresso na Ordem de Produção**; usa-se uma **Guia de entrega separada**.
- **Por quê:** o parecer recomenda deixar para depois por prazo, privacidade (geolocalização é dado pessoal), responsabilidade e prova de entrega.
- **Risco:** alto (novo fornecedor de mapas, contrato, transporte).

#### D29. Tela de parâmetros (nova; requisito transversal)

- **O que muda:** um **cadastro de parâmetros** com **valor padrão do sistema**, **valor da Conta, da Empresa ou da Filial**, **tipo** (número, texto, sim ou não, lista, horário), **permissão** para alterar e **histórico** (quem, quando, valor anterior e novo). Telas por **grupo** (seção 4.5). Regras com **estrutura própria** (status, graus de dificuldade, tipos de entrega, feriados, horários) continuam em **tabelas próprias**, **todas administráveis pela tela**.
- **Por quê:** **toda regra deve ter uma tela**; nenhuma fica escondida no código.
- **Impacto no que existe:** regras hoje fixas no código (por exemplo, garantia de 7 dias por Conta e domingo fechado) **passam para parâmetros**, com os valores atuais como padrão.
- **Risco:** médio. O trabalho é **contínuo**: cada ciclo acrescenta os seus parâmetros. A regra "nenhum ciclo fecha sem tela de parâmetro" evita acúmulo.

#### Mudanças mantidas das versões anteriores (resumo)

- **D2 Porteiro no banco:** o banco recusa linhas de outra Conta mesmo que o programa peça; vínculos entre Contas diferentes ficam travados; **modo de observação** antes de bloquear; **teste automático de vazamento**. Nenhuma mudança nos dados; muda como o programa fala com o banco.
- **D5 Catálogos:** serviços (preço, **dificuldade padrão**), **graus de dificuldade configuráveis com tempo médio (30, 60, 90 e 180 minutos)**, tipos de peça, formas de pagamento e feriados por Filial. Itens antigos ficam em texto; novos itens exigem catálogo.
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
- **D21 Alertas e indicadores:** regras de alerta (por exemplo, faltam X horas), alertas gerados, **lista sempre visível e aviso diário de aprovação pendente** (atendente e gerente) e leituras para o dashboard.
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

## 6. Ciclos de evolução (v4)

Cada ciclo traz: **objetivo**, **o que será feito**, **banco**, **o que você vê**, **como valida**, **aprovado se**, **fora do ciclo**, **decisões antes**.

### Ciclo 0. Casa arrumada (tamanho P)

**Objetivo:** terreno confiável: documentação única, falhas gritantes de segurança fechadas, ambiente de testes em nuvem e cadastros externos iniciados.

**O que será feito**

1. **Documentação consolidada em português** (PR #8): glossário, decisões, fluxo de status, estado atual; antigos em `docs/arquivo/`.
2. **Segurança rápida** (PR #8): criar Conta fechado ao público; senhas de exemplo removidas; limite de tentativas de login.
3. **Ambiente de testes em nuvem** (**até R$ 150 por mês**; você cria a conta e dá acesso; nós montamos), no domínio **atelierizagusmao.com.br** (por exemplo, `homologacao.atelierizagusmao.com.br`, **a confirmar**), com **dados de demonstração**. O domínio é **só de homologação e uso próprio**: **o endereço base do sistema e dos links é um parâmetro**, para trocar quando você comercializar.
4. **Cadastros externos em paralelo** (seção 8): **Meta/WhatsApp (API oficial, número da Vivo)**, **Cielo (integração remota: modelo do aparelho, sandbox e token de produção)**, **e-mail** (serviço transacional ligado ao domínio de homologação), **segunda operadora (plano B)**.
5. **Corrigir os testes de integração** (hoje 15 de 39 passam, **antes e depois do PR**).
6. Reclassificação das mensagens "enviadas" sem envio.

**Banco:** parte de D14; reclassificação de D10. **Sem mudar o esquema** no PR #8.

**Como valida:** abre o link de testes; tenta criar Conta sem estar logado (recusado); erra a senha seis vezes (bloqueia); abre o documento oficial e confere o glossário; vê o relatório de testes de integração; confere que o **e-mail da Cielo** foi enviado e a **conta de desenvolvedor** foi criada.

**Aprovado se:** os testes acima passam, você lê o documento oficial sem precisar de outro e os **contatos externos estão em andamento**.

**Decisões antes:** nenhuma pendente para começar.

---


### Ciclo 1. Multiempresa correto (tamanho M)

**Objetivo:** Conta, Empresa e Filial separados, com a **Filial padrão** e o isolamento garantido no banco.

**Feito:** D1, D2, D11, D12, D13 (parte). **Telas:** **Contas** (só você), **Empresas, Filiais e Usuários** (por Conta); **Filial padrão** com **horário de funcionamento** e **corte no fechamento**; **5 papéis** do ateliê; relatório **"quem perde o quê"**; **teste automático de vazamento**.

**Você vê:** duas Contas de teste ("Ateliê A" e "Ateliê B"), cada uma com Empresa e **Filial padrão**; o seu ateliê configurado com o **horário de funcionamento** (seg a sex 9h30 às 18h; sábado 9h30 às 14h); relatório de isolamento.

**Valida ("teste do espelho"):** cria "Maria Teste A" na Conta A; entra na B e busca "Maria": não aparece; tenta abrir uma tela da A com o usuário de B: nega; cria um usuário de recepção só na Filial padrão e confere que **não vê** outra Filial; lê o relatório automático de isolamento.

**Aprovado se:** nenhum dado de A aparece em B e o relatório mostra todas as tabelas do núcleo protegidas.

**Decisões antes:** nenhuma pendente (**hora de corte = fechamento**, decidido).

---

### Ciclo 2. Cadastros, catálogo de status e tela de parâmetros (tamanho G)

**Objetivo:** cadastros completos, o **catálogo de status configurável** (o coração do negócio) e a **tela de parâmetros**.

**Feito:** D3, D5, D6, D13, D15, **D29**. **Telas:** Cliente (busca multicritério; CEP; **WhatsApp obrigatório**; consentimento; responsável por menor; **endereço opcional**); **Serviços** (preço fixo, **dificuldade padrão**); **Graus de dificuldade e tempos** (30, 60, 90 e 180 minutos; **aumentar ou diminuir graus**); **Tipos de peça**; **Formas de pagamento**; **Feriados e horários por Filial**; **Ficha de medidas em lista**; **Catálogo de status** com o **modelo da seção 2.2**, incluindo **Em refação**; e a **tela de parâmetros** com os primeiros grupos (graus e tempos, horário e corte, prazos e sobretaxas, logística de produção, status).

**Você vê:** a tela de status com os 6 status públicos e os 2 internos, e a tela de parâmetros.

**Valida:** edita um nome público; tenta criar uma regra que **pula** um status (recusa); confere que a **reprovação** é o único retorno; **muda o tempo do grau 2 de 60 para 70 minutos** e confere o histórico (quem, quando, valor anterior e novo); **cria um grau 5**; cadastra cliente **menor sem responsável** (recusa) e sem WhatsApp (recusa); cadastra 3 serviços com **dificuldades diferentes**; muda o **limite de peças por sacola** de 5 para 4 e confere o efeito (e volta para 5).

**Aprovado se:** você reproduz o fluxo real do ateliê na tela de status e consegue **alterar qualquer regra deste ciclo sem pedir ajuda**.

---


### Ciclo 3. OS completa, Ordem de Produção impressa e aprovação (tamanho G)

**Objetivo:** abrir uma OS de verdade, aprovada, com a Ordem de Produção impressa e o QR.

**Feito:** D4, D7, D8, D9, D17 (aprovação e link), D20, D27. **Formulário de OS** (cliente, Filial, atendente, **peças até 5**, **serviços do catálogo**, **dificuldade (a maior, ajustável)**, fotos opcionais até 3 por peça, **tipo de entrega (Normal, Expresso, Urgente) com sobretaxa e data sugerida editável**, resumo financeiro). **Divisão automática** em segunda OS ligada. **Aprovação por link, balcão ou papel** (com foto e "assinado no papel"). **Produção sem assinatura com liberação e motivo.** **Link público seguro** (campos mínimos, expira, revogável). **Medida travada.** **Ordem de Produção impressa** (QR grande, quantidade de peças, dificuldade, descrição, data de entrega; **sem preço e sem endereço**). **Lista de aprovações pendentes sempre visível** e **aviso diário ao atendente e ao gerente até o cliente assinar** (D21). Botões de **aprovar, cancelar, recalcular prazo**. Parâmetros do ciclo na tela de parâmetros (tipos de entrega, sobretaxas, aviso diário, validade do link).

**Você vê:** a Ordem de Produção em papel comum, com QR grande.

**Valida:** abre uma OS com 3 peças; assina pelo link no celular; faz outra OS e **assina na tela do balcão**; faz outra e **imprime, assina no papel, anexa a foto e clica "assinado no papel"**; abre uma OS com **7 peças** e confere que o sistema **divide em duas OS ligadas**; confere que o cliente recebe **um só link** com as duas; troca o tipo para **Expresso** e **Urgente** e confere data sugerida e sobretaxa; **altera a data** e confere o registro; tenta iniciar a produção **sem assinatura** (exige liberação e motivo); abre o link com um código errado (recusa); deixa uma OS **sem assinatura** e confere que ela **aparece na lista** e que **atendente e gerente recebem o aviso no dia seguinte e nos seguintes**, até assinar; muda a **sobretaxa do Expresso** na tela de parâmetros e confere o novo valor; imprime a Ordem de Produção e confere o conteúdo.

**Aprovado se:** você abre uma OS real, o prazo faz sentido e a Ordem de Produção impressa substitui a atual.

**Decisões antes:** nenhuma pendente (aviso diário, grupo de OS, dia útil e primeiro nome **decididos**).

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

### Ciclo 6. Retirada em papel, reconserto e garantia (tamanho M)

**Objetivo:** fechar a OS com a retirada assinada no papel e tratar o retorno do cliente.

**Feito:** D17 (retirada em papel), D19, D23. **Retirada:** o cliente **assina a Ordem de Produção em papel**; o atendente **anexa a foto à OS** e clica **"entregue assinado"**. **Aviso "Falta pagamento"** (não é status). **Bloqueio de entrega com saldo**, **liberação pelo gerente com motivo**. **Reconserto e garantia:** nova **OS sem valor, vinculada**, com a **técnica original**; **7 dias corridos** (ajuste) e **90 dias** (defeito), **da retirada**; **depois do prazo**, OS cobrada, com liberação do gerente. Parâmetros do ciclo na tela de parâmetros (prazos, tipo de contagem).

**Valida:** tenta entregar com saldo em aberto (aviso e bloqueio); o gerente libera com motivo; imprime a Ordem de Produção, **simula a assinatura**, **anexa a foto** e clica **"entregue assinado"**; confere que a OS fechou e que o registro mostra quem clicou, quando e a foto; tenta clicar "entregue assinado" **sem foto** (o sistema recusa); abre um reconserto no **dia 7** (sem valor) e outro no **dia 8** (cobrado), com liberação do gerente; abre uma garantia no **dia 60** (sem valor) e confere o vínculo e a **técnica original**; **muda o prazo de 7 para 10 dias** na tela de parâmetros e confere o efeito.

**Aprovado se:** a OS fecha com a retirada registrada (foto) e o reconserto mostra a técnica original.

**Decisões antes:** nenhuma pendente (**retirada só em papel**, decidido).

---


### Ciclo 7. Pagamento integrado na maquininha (tamanho G; dependência de contrato)

**Objetivo:** **a partir da OS, acionar a maquininha já com o valor da OS** e **gravar o resultado**, sem digitar o valor.

**Feito:** D22. **Camada de operadoras** (**Cielo Order Manager** primeiro); **conta da operadora por Empresa**; **terminais por Filial e atendente**; **cobrança na maquininha** na tela da OS (**valor da OS, sem editar**; sinal e saldo); **acompanhamento do resultado** com **tempo máximo**; **cancelar cobrança**; **proteção contra cobrança duplicada**; **estorno** (gerente, motivo); **baixa manual de contingência** (quem, quando, motivo, forma); **formas de pagamento**; **contas a receber** e **fluxo de caixa simples**. **Parâmetros** de pagamento na tela de parâmetros. **Construção em duas etapas:** (1) **no sandbox da Cielo**, **sem aparelho**, que pode começar **já no Ciclo 0**; (2) **em produção**, com o **aparelho real** e o **token do seu estabelecimento**.

**Você vê:** o botão **"Cobrar na maquininha"** na OS e o cartão passando com o valor certo.

**Valida (sandbox):** cobra uma OS de teste; confere que o **valor** é o da OS e **não dá para editar**; **aprova** (OS fica paga); **recusa** (OS não fica paga); **cancela** a cobrança; **deixa estourar o tempo** e confere que o sistema **consulta antes** de permitir nova cobrança; cobra **sinal** e depois **saldo**; faz **baixa manual** (exige motivo); um atendente **sem permissão** tenta estornar (nega).
**Valida (produção, só com contrato):** uma **venda real de baixo valor** na sua LIO (ou Cielo Smart) a partir de uma OS de teste, com **estorno** em seguida; confere data, hora, valor, forma, bandeira, parcelas e código da transação **gravados na OS**; confere que **uma venda feita direto na maquininha** **não** aparece como paga na OS (limite conhecido).

**Aprovado se:** **uma venda real** de ponta a ponta usa **o valor da OS** e **grava o resultado**, e **a baixa manual funciona como plano B**.

**Dependências externas:** **modelo do aparelho** compatível, **token de produção** e **custos** (a Cielo). **Ponto de decisão: dezembro de 2026.** Se a Cielo não liberar a produção até lá, **mudar para o plano B** (Mercado Pago Point ou Stone Connect) **ou entrar em março com baixa manual**.

**Decisões antes:** perguntas 1 a 3 da terceira rodada (ponto de decisão e contingência, atendentes e maquininhas, forma de pagamento).

---


### Ciclo 8. Dashboard e alertas (tamanho M)

**Objetivo:** acompanhar produção e produtividade pelo próprio sistema.

**Feito:** D21. **Dashboard** por técnica, por quantidade de peças e dificuldade; **tempo médio** por grau (medido ou informado); **dimensionamento de grade**; **alertas de atraso** antes de vencer; **alerta de aprovação pendente** ao atendente; base do **bônus por produtividade** (regra de cálculo a definir). A **grade diária** (ativar técnico, comparecimento, contas a pagar e Pix ao prestador) completa esse dimensionamento; está no escopo futuro em `docs/02-decisoes-do-andre.md` seção 13, **sem construir agora**.

**Valida:** configura o alerta de "2 horas antes do prazo"; deixa uma OS atrasar e confere o alerta; confere que os **tempos médios por grau** (30, 60, 90 e 180 minutos) alimentam as estimativas e **muda um deles** na tela de parâmetros; compara o dashboard com o diário de bordo de um dia.

**Aprovado se:** o painel responde, sem planilha, "quem produziu quanto" e "o que vai atrasar".

**Decisões antes:** nenhuma pendente (tempos médios **decididos**).

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

Entrega em domicílio completa (com a Guia de entrega, preço por faixa ou geolocalização, comprovante), retirada por terceiros, cobrança do ANEXSYS (D24), Pix QR do cliente (se não entrou; **não confundir** com o **Pix automático de saída**), concierge com câmera e reconhecimento facial, segundo tipo de negócio, Stone e Rede. **Grade diária de técnicos** e **Pix automático / reembolso ao cliente** (aprovação do administrador): ver `docs/02-decisoes-do-andre.md` seção 13.

---

## 7. Proposta de marcos até março de 2027 (a confirmar)

**Não é estimativa de esforço.** É a ordem em que as coisas precisam estar prontas para março caber.

| Marco | O que precisa estar pronto |
|---|---|
| **Outubro de 2026** | Ciclos 0 e 1. **Todos os cadastros externos iniciados** (Meta, **Cielo**, nuvem, e-mail, plano B). **Desenvolvimento do pagamento no sandbox da Cielo pode começar** |
| **Novembro de 2026** | Ciclos 2 e 3 (cadastros, status, **tela de parâmetros**, OS completa, aprovação, Ordem de Produção impressa) |
| **Dezembro de 2026** | Ciclos 4 e 5 (produção por QR, WhatsApp e link público). **Ponto de decisão da maquininha:** a Cielo liberou a produção? |
| **Janeiro de 2027** | Ciclos 6 e 7 (retirada em papel, reconserto, **pagamento integrado**). **Congelamento de funcionalidades do piloto** |
| **Fevereiro de 2027** | Ciclos 8, 9 e 10: dashboard, homologação em paralelo, LGPD, importação |
| **Março de 2027** | **Produção**, com a sua autorização escrita |

### Impacto das respostas da rodada 3 no prazo

| O que muda | Efeito no prazo |
|---|---|
| **Pagamento integrado online** (no lugar da conciliação) | **Aumenta bastante.** É um ciclo grande e **depende de contrato** (modelo do aparelho, token de produção, prazo da Cielo). **É hoje o principal risco de prazo** |
| **Conciliação e Pix na tela saíram** | **Alivia um pouco** (sem importação de vendas, sem fechamento do dia, sem Pix) |
| **Retirada só em papel** | **Alivia** (sem token, sem janela de confirmação, sem comprovante eletrônico) |
| **Tela de parâmetros como requisito transversal** | **Acrescenta** trabalho em **todos** os ciclos (pequeno por ciclo, grande no total). Mitigado pela regra "nenhum ciclo fecha sem a tela" e por uma estrutura única de parâmetros |
| **Aviso diário e lista de aprovação pendente** | **Acrescenta pouco** (Ciclo 3) |
| **Hora de corte, domínio, tempos médios, suposições** | **Removem bloqueios** |
| **Entrega em domicílio** | **Depois do piloto** (sem efeito em março) |

**Saldo:** **piora em relação à v3.** O prazo de março **continua possível**, mas o risco passou a se concentrar em **um ponto**: **a integração da Cielo** (contrato e produção). **O plano precisa de um ponto de decisão (dezembro) e de uma contingência (baixa manual) já definidos.** Quem mais pode atrasar é **a operadora**, **a Meta** e **a sua disponibilidade** para validar.

**Plano de corte, se estiver atrasado no congelamento de janeiro** (o que sai do piloto, em ordem):

1. **Importação do histórico completo** (entram só clientes e medidas).
2. **Dashboard avançado** (ficam o painel de produção e os alertas de atraso).
3. **Bônus de produtividade** (fica o diário de bordo).
4. **Divisão automática de OS** (volta a ser um bloqueio com orientação para abrir outra OS).
5. **Troca de operadora e segunda operadora** (fica só a Cielo).
6. **Contingência final:** **entrar em março com baixa manual** no lugar da integração da maquininha, e **fazer a integração depois**, com o sistema já em uso.

**O que não sai de jeito nenhum:** isolamento por Conta, catálogo de status, QR assinado, avanço automático, 2 mensagens de WhatsApp, aprovação, retirada registrada (papel), aviso e bloqueio de pagamento, **tela de parâmetros**, LGPD mínima, backup testado.

---

## 8. O que depende de contrato ou cadastro externo

| Item | O que é preciso | Quem faz | Quando começar |
|---|---|---|---|
| **Maquininha Cielo (integração remota)** | Conta no **Portal de Desenvolvedores** da Cielo; e-mail a **integracaosmart@cielo.com.br** (roteiro pronto no `07-parecer-integracao-maquininha.md`); confirmar o **modelo do aparelho** (LIO ou Cielo Smart); **sandbox** (sem aparelho); **token de produção** do estabelecimento; **custos e prazos** | Você (titular do CNPJ e do contrato), com apoio nosso | **Já, no Ciclo 0** |
| **Plano B de operadora** | **Mercado Pago:** criar conta e aplicação (autoatendimento). **Stone:** inscrição no **Programa de Parcerias**. Roteiro de e-mail genérico pronto | Você | Ciclo 0 (sem custo) |
| **Aliança Cielo (parceria)** | Para **vender o ANEXSYS** a outros ateliês: **parcerias@cielo.com.br** | Você | Antes do segundo cliente |
| **WhatsApp (API oficial direta)** | Cadastro da **Empresa** (CNPJ) na Meta e **verificação**; **número da Vivo** com **uso simultâneo** (**a Meta confirma a elegibilidade no cadastro**); **aprovação dos 2 modelos**. Se o número não for elegível, **comprar outro** | Você (titular do CNPJ), com apoio nosso | **Já, no Ciclo 0** |
| **Nuvem** | Você cria a conta (**até R$ 150 por mês**) e dá acesso a quem operar | Você | **Ciclo 0** |
| **Domínio** | **atelierizagusmao.com.br** (Registro.br; você tem a senha; **só homologação e uso próprio**); **acesso ao painel DNS** para apontar `homologacao...` e configurar o e-mail. **Para comercializar:** outro domínio (o `anexsys.com.br` fica para depois) | Você | **Ciclo 0** |
| **E-mail** | Serviço de e-mail transacional ligado ao domínio de homologação | Nós, com acesso ao domínio | Ciclo 0 |
| **Cobrança do ANEXSYS** | Conta em um **gateway** com cartão recorrente, Pix e boleto; contrato de 1 ano | Você | Antes do segundo cliente |
| **Mapas (entrega em domicílio)** | Fornecedor de cálculo de distância | Decisão sua | Só se a entrega entrar |
| **Advogado** | Revisão do aviso de privacidade, dos termos e do contrato de operador | Você | Antes do Ciclo 10 |
| **Fiscal (nota)** | Você **não mencionou nota fiscal** | Decisão sua | Quando decidir |

---


## 9. Consolidação da documentação

**Estrutura em `docs/` (PR #8, em rascunho):** `00-leia-primeiro`, `01-glossario`, `02-decisoes-do-andre`, `03-fluxo-de-status`, `04-estado-atual`, `05-plano-de-continuidade` e `arquivo/` (somente leitura).

**Cada ciclo termina atualizando** `02`, `03` e `04`. **Sem percentual de prontidão sem critério**: só "demonstrado? testado com banco? aceito pelo André?". **Todo documento tem data e "substitui/substituído por".**

---

## 10. O que fica de fora do piloto (e para quando)

| Item | Quando |
|---|---|
| **Entrega em domicílio** (com preço por geolocalização) | **Depois do piloto**, com a Guia de entrega separada e análise de privacidade. Você ainda não trabalha com entrega |
| **Retirada por token ou janela de confirmação** | Versão futura (o parecer recomenda a janela controlada pelo atendente) |
| **Retirada por terceiros** (token por WhatsApp; portador informa número da OS e token) | "Próxima versão" |
| **Conciliação de vendas e fechamento do dia por importação** | **Saíram** (você decidiu pela integração online) |
| **QR Pix na tela** | **Saiu** |
| **Concierge e fila de chegada** | Fora do piloto |
| **Concierge com câmera e reconhecimento facial** | Versão futura, com análise de privacidade |
| **Cartão online com cartão cadastrado pelo cliente** | Não previsto |
| **Segunda operadora de maquininha** | Só como plano B; a integração é desenhada para aceitar outras operadoras |
| **Cobrança do ANEXSYS** | Antes do segundo cliente |
| **Segundo tipo de negócio** | Depois do piloto do ateliê |
| **Registro de conversas de WhatsApp e aprovação por resposta de mensagem** | Não previsto |
| **Modo offline de leitura** | Não necessário |
| **Fiscal (notas)** | A decidir |

---

## 11. Riscos e como reduzi-los

| # | Risco | Impacto | Como reduzimos |
|---|---|---|---|
| 1 | **Integração da maquininha atrasa março** (contrato, modelo do aparelho, token de produção) | Alto | Cadastros no **Ciclo 0**; construção no **sandbox** antes do contrato; **ponto de decisão em dezembro**; **plano B** (Mercado Pago ou Stone); **baixa manual** como contingência |
| 2 | **Seu modelo de LIO não é atendido** pela integração remota | Alto | Confirmar com a Cielo já no Ciclo 0; custo de troca para Cielo Smart entra na decisão |
| 3 | **Meta não aprova o número da Vivo** para uso simultâneo ou recusa modelos | Alto | Cadastro já no Ciclo 0; plano B com **outro número**; texto sóbrio |
| 4 | **Venda feita direto na maquininha**, sem passar pelo ANEXSYS | Médio | Limite conhecido. Controle de graça: liberações de entrega com saldo. Conferência de extrato pode voltar depois, se você quiser |
| 5 | **Tela de parâmetros** vira trabalho sem fim | Médio | Estrutura única de parâmetros; regra "nenhum ciclo fecha sem a tela"; grupos entregues por ciclo |
| 6 | **Isolamento no banco (D2) quebra telas** | Alto | Modo de observação, teste de vazamento, ciclo próprio |
| 7 | **Testes de integração quebrados** escondem regressões | Alto | **Corrigir no Ciclo 0** (hoje 15 de 39) |
| 8 | **QR por OS** não mostra a peça atrasada numa OS de várias peças | Médio | Aceito por você; quantidade e dificuldade medem; revisão após o piloto |
| 9 | **Retirada só em papel** gera disputa com o cliente | Médio | Foto da Ordem de Produção assinada; registro de quem clicou; aviso de pagamento e liberação do gerente; **token** fica para a próxima versão |
| 10 | **Link público** vaza ou é adivinhado | Alto | Código longo e aleatório, expiração, revogação, limite de tentativas, campos mínimos (primeiro nome) |
| 11 | **LGPD tratada como "livre"** | Alto | Parecer; escopo do Ciclo 10; aviso, canal do titular, retenção, incidente, advogado |
| 12 | **Domínio de homologação** usado na venda comercial | Médio | Endereço base é parâmetro; outro domínio para comercializar |
| 13 | **Divisão automática** causa confusão de preço ou cancelamento no grupo | Médio | Regras do grupo no Ciclo 3; teste dedicado |
| 14 | **Uma sacola por vez** trava a produção em casos reais | Médio | Limite configurável na tela de parâmetros; ouvir no paralelo |
| 15 | **Funcionários resistem a ler QR** | Alto | Medir tempo; treinamento curto; login simples; ouvir no paralelo |
| 16 | **Dependência da sua disponibilidade** como único homologador | Médio | Roteiros curtos; vídeo; reunião opcional |
| 17 | **Documentação nova também envelhece** | Médio | Ciclo só fecha com documentação atualizada |

---

## 12. Próximos passos e o que ainda precisa de você

### 12.1 O que pode começar agora

- **Ciclo 0** (casa arrumada): pode começar **agora**; não há pergunta pendente que o trave.
- **Ciclo 1** (multiempresa, Filial padrão, horário e corte): pode começar **agora**; todos os dados necessários estão definidos (1 CNPJ, Filial padrão, 9h30 às 18h de segunda a sexta, 9h30 às 14h no sábado, corte no fechamento).
- **Ciclo 2** (cadastros, status e tela de parâmetros): o desenho pode começar **agora**; os **seus prints** (comanda, cadastro, ficha de medidas) ajudam a fechar os formulários.
- **Pagamento (Ciclo 7), em sandbox:** pode começar **depois** do Ciclo 1, sem esperar o contrato.

### 12.2 O que você precisa fazer fora do sistema (e quando)

| # | Ação | Quando |
|---|---|---|
| 1 | **Criar a conta na nuvem** (até R$ 150 por mês) e **dar acesso** a quem for operar | Já |
| 2 | **Iniciar o cadastro da Empresa na Meta** (API do WhatsApp; número da Vivo) | Já |
| 3 | **Enviar o e-mail à Cielo** (roteiro pronto) e **criar a conta no Portal de Desenvolvedores** | Já |
| 4 | **Criar conta e aplicação no Mercado Pago** e **inscrever-se no Programa de Parcerias da Stone** (sem custo; plano B) | Esta semana |
| 5 | **Apontar o DNS** de `homologacao.atelierizagusmao.com.br` para a nuvem (quando eu pedir) | No Ciclo 0 |
| 6 | **Enviar os prints** (comanda, cadastro, medidas, fluxo do ateliê) | Antes do Ciclo 2 |
| 7 | **Responder as 4 perguntas** da terceira rodada | Antes do Ciclo 7 (não travam os ciclos 0 e 1) |
| 8 | **Agendar a revisão com um advogado** (aviso de privacidade e termos) | Antes do Ciclo 10 |

### 12.3 Pontos que ainda dependem de você

Todos estão nas perguntas complementares da terceira rodada (fora do repositório), **nenhum trava os ciclos 0 e 1**:

1. **Ponto de decisão da maquininha:** data limite e contingência (baixa manual ou troca de operadora) se a Cielo não liberar.
2. **Atendentes e maquininhas:** quantas pessoas cobram e quantos aparelhos há ou haverá.
3. **Como a forma de pagamento é escolhida:** pelo sistema ou pelo cliente na maquininha (crédito, débito, parcelas).
4. **Limite de custo** da maquininha e da integração, e se aceita **comprar uma Point Smart 2** como plano B de teste.
