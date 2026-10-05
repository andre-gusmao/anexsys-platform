# Parecer: token de retirada, LGPD e entrega em domicílio

**Para:** André
**Data:** 05/10/2026
**Base:** suas respostas complementares (`docs/02-decisoes-do-andre.md`, seção 10) e o plano de continuidade v3 (`docs/05-plano-de-continuidade.md`).

> **Aviso importante:** este parecer é uma **avaliação de negócio e de boas práticas**, escrita por quem desenha o sistema. **Não substitui aconselhamento jurídico.** Os pontos marcados "confirmar com advogado" devem ser validados por um profissional de direito digital ou de proteção de dados **antes de entrar em produção**.

---

## 1. Resposta curta

1. **O token de retirada é útil, mas sozinho não é prova suficiente de que a peça foi entregue à pessoa certa.** Ele prova que **alguém com acesso àquela mensagem ou link tocou num botão** num certo horário. Não prova **quem** foi, nem que estava **no balcão**. Fica bom quando combinado com **presença no balcão**, **registro de quem retirou** e um **plano B** (assinatura no papel com foto). **Recomendo uma versão "controlada pelo atendente"**, descrita na seção 2.5.
2. **A LGPD não fica "livre".** Você acertou em **reduzir os dados no link** (isso diminui o risco), mas o ateliê continua tratando dados pessoais em todo o resto do sistema, e a entrega em domicílio **aumenta** as obrigações. A seção 3 explica o que você acertou e o que ainda é necessário.
3. **Entrega em domicílio:** recomendo **fora de março**. É uma funcionalidade nova com consequências de segurança, privacidade, responsabilidade e prazo. O sistema pode **deixar a porta aberta** (endereço opcional e um marcador "entrega em domicílio") sem construir tudo agora.
4. **Um cuidado com a Ordem de Produção:** colocar o **endereço de entrega** nela expõe o endereço a **todas as técnicas** e a qualquer pessoa que veja a sacola. Recomendo **não imprimir o endereço na Ordem de Produção** e usar um **documento separado** para quem entrega.

---

## 2. Parte A: o token de retirada é suficiente como prova de entrega?

### 2.1 O que você propôs

O cliente, ou outra pessoa que retire, **recebe um token ou link**, **toca ou digita**, e isso **confirma o recebimento**, **autenticando data e hora**. A segunda opção é a assinatura em papel na Ordem de Produção, com a **foto guardada na OS** e o clique em **"entregue assinado"**.

### 2.2 O que o token prova e o que não prova

| O token prova | O token não prova |
|---|---|
| Que alguém usou **aquele link ou código** | **Quem** era essa pessoa |
| **Data e hora** do toque (pelo relógio do servidor) | Que a pessoa estava **no balcão** |
| De qual **aparelho e rede** veio o toque | Que a peça **foi mesmo entregue** naquele instante |
| Que o link foi enviado ao **número de WhatsApp** cadastrado | Que o dono do número foi quem tocou |

Um token é um **segredo compartilhado**: vale para quem o tiver. Por isso a força da prova depende do **contexto** em que ele é usado.

### 2.3 Riscos reais

1. **Token no WhatsApp de quem não é o cliente.**
   - **Número digitado errado** no cadastro: o link ou token vai para um estranho.
   - **Celular de outra pessoa:** família, empregado, celular perdido, WhatsApp Web aberto num computador compartilhado.
   - **Troca de chip** ou número reaproveitado pela operadora.
2. **Confirmação antes da retirada.** Se o token pode ser tocado **a qualquer hora**, o cliente (ou outra pessoa) pode **confirmar de casa** antes de a peça sair do balcão. O registro ficaria "entregue" sem entrega.
3. **Repúdio** (o cliente dizer "não retirei" ou "não fui eu que toquei"). Num conflito, quem terá de provar é o ateliê, porque a relação é de **consumo** (o Código de Defesa do Consumidor permite **inverter o ônus da prova** a favor do consumidor, confirmar com advogado). Um toque num botão, ligado só a um número de WhatsApp, é **prova fraca** de identidade.
4. **Falta de prova de identidade de terceiros.** Se outra pessoa retira, o token **não diz quem ela é**. Sem nome e documento, o ateliê não consegue indicar a quem entregou.
5. **Sem comprovante para o cliente.** Se o cliente não recebe um registro do que confirmou, a confirmação fica "unilateral".
6. **Dependência do celular e da internet** no momento da retirada (cliente sem bateria, sem sinal, sem WhatsApp).

### 2.4 O papel de hoje também é frágil

Convém comparar com o que existe: a assinatura **na caneta**, na OS de papel, também **não prova identidade** (ninguém confere a assinatura com documento) e o papel pode se perder. A vantagem do token é a **data e a hora confiáveis** e o **registro eletrônico fácil de achar**. A vantagem do papel é a **presença física** do cliente. **O ideal é juntar os pontos fortes dos dois.**

### 2.5 Mitigações recomendadas

**O princípio:** **o token só vale com o cliente presente**, e **quem controla o momento é o atendente**.

| Mitigação | O que resolve |
|---|---|
| **Janela de confirmação curta.** O botão de confirmação no link **só fica ativo depois que o atendente inicia a retirada** na tela dele, por **10 minutos** (valor configurável), e **uso único** | Confirmar de casa antes da retirada |
| **Sem terceira mensagem.** O cliente já recebeu o link nas duas mensagens de WhatsApp que existem. O botão "Confirmo que retirei" aparece nesse mesmo link durante a janela. **Isso mantém a regra de só duas mensagens** | Mensagens a mais; custo |
| **Código de 6 dígitos alternativo** mostrado na tela do cliente (no link) durante a janela, que o cliente **fala ou digita** para o atendente | Cliente sem conseguir tocar |
| **Registrar quem retirou:** se for o próprio cliente, o atendente marca; se for **outra pessoa**, **nome e documento** (por exemplo, número do documento) são **obrigatórios** | Terceiros sem identificação |
| **Comprovante** na própria página do link: "Retirado em [data e hora] por [nome]" | Confirmação unilateral; ajuda a evitar disputas |
| **Registro de evidências:** data e hora do servidor, atendente, método (token, papel), aparelho e rede, número de WhatsApp do link, nome e documento do retirante | Repúdio |
| **Número de WhatsApp conferido na abertura da OS.** A primeira mensagem é a prova de que o número existe e é do cliente (se ele abrir o link e assinar a aprovação) | Número errado |
| **Plano B: assinatura na Ordem de Produção em papel**, foto anexada à OS e clique em **"entregue assinado"** (a sua segunda opção) | Cliente sem celular, sem sinal, ou dúvida do atendente |
| **Cláusula de aceite** nos termos da OS (assinados na aprovação): "o cliente aceita a confirmação eletrônica de retirada como comprovante" | Fortalece a validade da prova eletrônica (ver 2.6) |
| **Liberação de entrega só com saldo quitado ou liberada pelo gerente** (já decidido) | Entrega sem pagamento |

### 2.6 Validade da prova eletrônica (confirmar com advogado)

No Brasil, assinaturas e confirmações **eletrônicas simples** (sem certificado digital) **podem ser aceitas** quando **as partes concordam** em usá-las (Lei 14.063/2020 e a Medida Provisória 2.200-2/2001). Por isso a **cláusula de aceite** na aprovação da OS é importante. Mesmo assim, o peso da prova depende de cada caso e do juiz. **Isto não é garantia, e deve ser validado por advogado.**

### 2.7 Retirada por terceiros (a próxima versão)

Você já decidiu que a **retirada por terceiros** com token por WhatsApp fica para a **próxima versão**. Os cuidados para ela:

1. **O cliente autoriza antes**, pelo próprio link, **indicando o nome** da pessoa.
2. O terceiro **mostra documento** no balcão e o **atendente registra nome e número**.
3. O token **só vale** com a autorização e dentro da janela.
4. **Guardar o mínimo do documento** (por exemplo, nome e os últimos dígitos), para limitar o risco de privacidade.

### 2.8 Recomendação

1. **Retirada padrão: confirmação presencial com janela controlada pelo atendente** (a **mitigação principal** da tabela acima), **com registro de quem retirou** e **comprovante** no link.
2. **Plano B:** **assinatura na Ordem de Produção em papel**, com **foto** e **"entregue assinado"**, para quando o cliente **não tiver o celular**, **não tiver sinal** ou **houver dúvida**.
3. **Incluir a cláusula de aceite** nos termos que o cliente assina na aprovação.
4. **Não adotar "token solto"** (enviado e válido por muito tempo), que é o cenário de maior risco.
5. **Revisar com um advogado** o texto da cláusula e as regras de comprovação **antes de março**.

Se você concordar, a escolha entre **A) código/token novo por WhatsApp**, **B) janela de confirmação no link já enviado (recomendada)** e **C) só papel** está na segunda rodada de perguntas.

---

## 3. Parte B: com minimização de dados no link e entrega em domicílio, a LGPD fica "livre"?

### 3.1 Resposta direta

**Não.** A LGPD (Lei 13.709/2018) **não desaparece** quando se reduz o que aparece no link. Ela vale **sempre que o ateliê trata dados pessoais**, e o ateliê **continua tratando** muitos.

### 3.2 O que você acertou

- **Minimizar os dados no link** (nome, número da OS, data de entrada, previsão, status, serviços combinados, situação do pagamento) segue o **princípio da necessidade**: tratar **só o que é preciso** (LGPD, artigo 6º). Isso **reduz o estrago** se o link vazar ou for encaminhado.
- **Deixar fora do link** CPF, endereço, medidas, fotos e valores detalhados é **a escolha certa**.
- **Não guardar dados de cartão** (você não quer cartão cadastrado pelo cliente) é **um risco a menos**.
- **Reduzir a lista de "dados sensíveis"** e coletar o endereço **só quando precisar** vai no sentido certo.

### 3.3 O que continua sendo tratado (e, portanto, regulado)

| Dado | Onde fica | Observação |
|---|---|---|
| Nome, telefone/WhatsApp, e-mail, CPF/CNPJ (opcional) | Cadastro do cliente | Dado pessoal |
| Medidas do corpo | Ficha de medidas | Dado pessoal; trate com cuidado reforçado (não é "sensível" pela lista da lei, mas é íntimo) |
| Histórico de OS, serviços, valores, pagamentos | OS e financeiro | Dado pessoal |
| Fotos da peça | Anexos | Podem mostrar rosto ou etiqueta por engano |
| Dados de menores | Cadastro com responsável | Exigem **cuidado especial** (artigo 14) |
| Nome e documento de quem retira | Registro de retirada | Dado pessoal de **terceiros** |
| Dados dos **funcionários** (diário de bordo, produtividade, localização se houver) | Diário de bordo | Dado pessoal de **trabalhadores**; vale para o bônus por produtividade |
| Conversa/mensagem de WhatsApp | Na Meta | A mensagem passa pela infraestrutura da Meta |

### 3.4 O que a LGPD exige que continua necessário

1. **Quem é quem.** O **ateliê é o controlador** e o **ANEXSYS é o operador** (você já decidiu). O ANEXSYS precisa de um **contrato de tratamento** (artigo 39) com o ateliê e deve **tratar os dados só conforme as instruções do ateliê**. Quando você comercializar, cada cliente do ANEXSYS será um controlador diferente.
2. **Base legal para cada uso.** O atendimento e a OS se apoiam na **execução do contrato** (artigo 7º, V). O **aviso por WhatsApp** da OS é parte do serviço; **a plataforma do WhatsApp exige o consentimento** do cliente para receber mensagens (você já decidiu registrar). Qualquer **uso diferente** (por exemplo, propaganda) exige **outra base** (em geral consentimento).
3. **Aviso de privacidade em português**, claro, dizendo **quais dados**, **para quê**, **por quanto tempo** e **como pedir** acesso, correção ou exclusão (artigos 9º e 18).
4. **Canal para o titular** (um e-mail ou formulário) e um **procedimento interno** para responder aos pedidos (acesso, correção, anonimização, exclusão, portabilidade) **em prazo razoável**.
5. **Retenção.** Guardar só pelo tempo necessário. Você decidiu **5 anos** para clientes inativos. Convém **verificar com contador/advogado** se há **prazos legais** (fiscais, de consumo) que **exijam** guardar mais ou menos por tipo de dado. **Dados que não precisam durar** (endereço de entrega, geolocalização) devem ter **prazo bem menor**.
6. **Segurança** (artigo 46): senha forte, isolamento entre Contas, cópias de segurança, acesso por papel, registro de quem acessou. Já está no plano.
7. **Registro das operações de tratamento** (artigo 37): uma lista simples de **quais dados** o ateliê trata, **por quê** e **onde**.
8. **Plano para incidente** (artigo 48): o que fazer, em que prazo e a quem comunicar se houver vazamento.
9. **Encarregado (artigo 41).** Mesmo para negócio pequeno, convém **indicar uma pessoa de contato**. A ANPD tem **regras simplificadas para agentes de tratamento de pequeno porte** (Resolução CD/ANPD nº 2/2022); **confirmar com advogado** se o ateliê se enquadra e o que muda.
10. **Fornecedores** (nuvem, e-mail, WhatsApp/Meta, serviço de mapas): cada um é **operador ou suboperador**. Se algum **tratar dados fora do Brasil**, há regras de **transferência internacional** (artigo 33) e é preciso **informar o cliente**. A Meta e a maioria dos provedores de nuvem **têm servidores fora do país**.
11. **Menores de idade** (artigo 14): **responsável cadastrado e consentimento do responsável** (você já decidiu).

### 3.5 O link público

O link é a **porta de entrada de maior exposição**, porque **qualquer pessoa com o endereço** o abre. Para ele ser seguro:

1. **Código longo e aleatório** (pelo menos 128 bits), **sem relação com o número da OS**, para **ninguém adivinhar** o endereço de outra OS por tentativa. **Nunca** usar "número da OS na URL" como único segredo.
2. **Expira** (por exemplo, depois da retirada mais o período de garantia, com margem) e pode ser **revogado** pelo ateliê.
3. **Limite de tentativas** e **bloqueio de robôs de busca** (para o Google não indexar).
4. **Só os campos que você listou.** Mostrar **só o primeiro nome** (ou nome e inicial do sobrenome) reduz ainda mais a exposição, se você concordar.
5. **Aprovação com confirmação** (o cliente confirma antes de assinar).
6. **Registro** de quem acessou (aparelho e horário).
7. **Aviso ao cliente** no próprio WhatsApp/ link: "não compartilhe este link".

### 3.6 Geolocalização

- **A geolocalização é dado pessoal** quando identifica ou localiza uma pessoa (artigo 5º, I). O **endereço da casa do cliente** é dado pessoal. Não é "dado sensível" pela lista da lei, mas é um dado **de alto risco** (mostra onde a pessoa mora).
- **Base legal:** o endereço **para entregar o que o cliente pediu** se apoia na **execução do contrato**. Só vale **para esse fim**.
- **Minimização:** calcular o preço a partir do **endereço informado** (distância ou faixa) **sem pedir a localização em tempo real** do cliente. Só pedir localização do aparelho do cliente se ele **permitir** e **para cada pedido**.
- **Serviço de mapas:** calcular distância usa um **fornecedor** (por exemplo, um serviço de mapas). Ele recebe o endereço. É **operador ou suboperador**, e pode ficar **fora do Brasil**. Confirmar o contrato e informar no aviso de privacidade.
- **Retenção:** **apagar ou anonimizar** o endereço e as coordenadas **alguns dias depois da entrega** (prazo a definir), mantendo só o necessário para **garantia e disputa**.
- **Entregador:** se o sistema registrar **onde o entregador está**, é **dado pessoal do trabalhador**. Evitar rastreamento contínuo.

### 3.7 Entrega em domicílio: o que ela muda

| Assunto | Impacto |
|---|---|
| **Prazo de março** | **Grande**. Exige cadastro de endereço, cálculo de preço por distância ou faixa, fornecedor de mapas, fluxo de entrega, comprovante e treinamento. **Recomendo fora do piloto** |
| **Prova de entrega** | Tudo da Parte A se repete, **fora do balcão** (o entregador entrega a quem?). O token **sem presença do atendente** é **mais arriscado** em entrega em domicílio. Foto do local e do recebedor, assinatura ou código **na hora** |
| **Responsabilidade** | Perda, dano e roubo durante o transporte. Quem entrega (funcionário, autônomo, aplicativo)? Seguro? Termo de responsabilidade? |
| **Pagamento na entrega** | Maquininha **na rua**; dinheiro; conciliação diferente |
| **Dados do endereço** | Passam a ser **necessários** para essa modalidade; **opcionais** nas demais |
| **Ordem de Produção com endereço** | **Não recomendado** (ver abaixo) |
| **Preço por geolocalização** | Deve ser **transparente** (o cliente vê como foi calculado) e **justo** (sem discriminar por bairro de forma indevida; **confirmar com advogado**) |
| **Contrato e termos** | Termos da entrega (prazo, janela, tentativa frustrada, nova cobrança) |

**Sobre o endereço na Ordem de Produção:** a Ordem de Produção está **na sacola**, passa **por várias técnicas** e pode ser vista por qualquer pessoa no ateliê. Colocar o **endereço de entrega** nela **espalha o dado sem necessidade** (e contraria o princípio da necessidade que você acertou no link). **Recomendação:** imprimir **só um indicador "entrega em domicílio"** na Ordem de Produção, e usar uma **Guia de entrega separada**, impressa ou na tela, **só para quem entrega**.

### 3.8 Recomendação

1. **Mantenha a minimização no link** e **acrescente os cuidados da seção 3.5**.
2. **Trate a LGPD como parte do piloto** (no plano, Ciclo 10), **não como etapa final**: consentimento, aviso de privacidade, canal do titular, retenção e plano de incidente **antes de março**.
3. **Coloque a entrega em domicílio depois do piloto**. No sistema, **deixe só a porta aberta**: **endereço opcional** (já decidido) e um **marcador** de que a OS é para entrega em domicílio.
4. **Não imprima o endereço na Ordem de Produção.**
5. **Valide com advogado** o contrato com os clientes do ANEXSYS (você, como operador), os termos de uso e o aviso de privacidade.

---

## 4. O que muda no plano por causa deste parecer

| Item | Mudança |
|---|---|
| Retirada (Ciclo 6) | Janela de confirmação controlada pelo atendente, registro de quem retirou, comprovante no link e plano B no papel (a escolha final está na segunda rodada de perguntas) |
| Link público (Ciclo 3 e 5) | Código longo e aleatório, expiração, revogação, limite de tentativas, bloqueio a buscadores, campos mínimos |
| LGPD (Ciclo 10) | Mantida antes da produção, com os itens da seção 3.4 |
| Entrega em domicílio | **Fora de março**; marcador e endereço opcional agora; funcionalidade completa depois do piloto |
| Ordem de Produção | **Sem endereço**; Guia de entrega separada, quando a entrega em domicílio existir |

---

## 5. Resumo

| Pergunta | Resposta |
|---|---|
| O token é prova suficiente de entrega? | **Não sozinho.** Com presença, janela curta, uso único, registro de quem retirou, comprovante e plano B no papel, **é razoável** para o ateliê |
| A LGPD fica livre com o link mínimo? | **Não.** Você acertou ao minimizar, mas continuam as obrigações do controlador e do operador |
| A geolocalização muda algo? | **Sim.** É dado pessoal, exige base legal, minimização, retenção curta e cuidado com fornecedores de mapas |
| A entrega em domicílio entra em março? | **Recomendo que não.** Deixar a porta aberta |
| O que fazer com o endereço na Ordem de Produção? | **Não imprimir.** Usar guia separada |
| Preciso de advogado? | **Sim**, para validar o aviso de privacidade, os termos e a cláusula de aceite eletrônico |
