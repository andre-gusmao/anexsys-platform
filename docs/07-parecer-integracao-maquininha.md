# Parecer: integração do ANEXSYS com a maquininha

**Para:** André
**Data:** 05/10/2026
**Base:** pesquisa nas documentações públicas das operadoras, feita em 05/10/2026, e nas suas respostas da rodada 3.
**Aviso de honestidade:** tudo o que está marcado **[CONFIRMAR]** não consegui verificar em fonte pública (contrato, preço, prazo, modelo de aparelho) e **precisa ser perguntado à operadora**. As documentações mudam; **trate este parecer como um mapa para as conversas com as operadoras, não como garantia**.

---

## 1. Resumo executivo

1. **É possível.** Há integração oficial e documentada para o ANEXSYS **criar a cobrança a partir da OS, enviar o valor exato para a maquininha e receber o resultado online**. Isso funciona **sem o atendente digitar o valor**. A Cielo, a Stone, a Mercado Pago e a Getnet publicam isso. A PagBank e a Rede, pelo que consegui ver, **não oferecem o mesmo modelo** para um sistema web.
2. **Sua maquininha atual (Cielo LIO) tem integração para sistema web.** Ela se chama **Order Manager (integração remota)** e fala com o ANEXSYS **pela internet**, de nuvem a nuvem. A Cielo mudou o nome da plataforma para **Cielo Smart** ("evolução da LIO"). **[CONFIRMAR]** se o **seu modelo de LIO** é atendido, porque a Cielo informa que, desde outubro de 2025, novas contratações e trocas são só de Cielo Smart.
3. **Bluetooth e cabo USB não são o caminho para um sistema web.** Em todas as integrações **que funcionam a partir de um sistema web com vários atendentes**, **a maquininha conversa com a internet sozinha** (Wi-Fi ou chip 4G). **Não há cabo nem Bluetooth entre o computador e a maquininha.** Na prática isso é **melhor** para você: funciona de qualquer computador, tablet ou celular, sem instalar nada. Bluetooth e USB só existem em integrações que exigem **um programa instalado em cada computador** (por exemplo, o TEF da PayGo e a PlugPag da PagBank), e o ANEXSYS é um sistema web.
4. **Recomendação:** começar pela **Cielo (Order Manager)**, que é a sua operadora e o aparelho que você já tem, e **preparar o ANEXSYS para trocar de operadora** (uma "camada de operadoras", com a Cielo primeiro). Como **plano B**, a **Mercado Pago Point** e a **Stone Connect** têm integração equivalente e documentação pública.
5. **O ponto de atenção que mais importa:** a integração é um **contrato e um credenciamento**, não só programação. **O que mais demora é do lado da operadora**, e **cada ateliê cliente do ANEXSYS terá a sua própria conta** e credencial. Para o seu ateliê, é viável para março; para vender o ANEXSYS a outros ateliês, é preciso ver **o modelo de parceria** de cada operadora.
6. **Seu pedido de "mesmo que demore mais" muda o plano:** o pagamento integrado vira um **ciclo próprio e grande**, com **risco de prazo explícito**, e deixa de depender de arquivo de conciliação.

---

## 2. Como a integração funciona (em linguagem simples)

Existem **três jeitos** de um sistema acionar uma maquininha.

| Jeito | Como funciona | Conexão com a maquininha | Serve para o ANEXSYS? |
|---|---|---|---|
| **A. Nuvem a nuvem** | O ANEXSYS envia o pedido (com o valor) à API da operadora pela internet. A operadora entrega o pedido à maquininha, que também está na internet. O cliente paga na maquininha. O ANEXSYS consulta ou recebe o resultado | **Nenhuma**: nem cabo nem Bluetooth no computador. A maquininha usa Wi-Fi ou chip 4G | **Sim. É o jeito indicado para sistema web com vários atendentes** |
| **B. Programa local (TEF)** | Um **programa instalado no computador** conversa com um **pinpad ou maquininha por Bluetooth ou USB** | Bluetooth ou USB | **Só com instalação** em cada computador; o navegador não consegue fazer isso sozinho. Serve se você exigir cabo |
| **C. Aplicativo dentro da maquininha** | Um **aplicativo Android** é instalado dentro da própria maquininha e conversa com o ANEXSYS | Dentro do aparelho | Possível, mas **obriga a construir e manter um aplicativo Android** e a passar por certificação |

**Resumo:** o jeito **A** é o mais simples para você e para o ANEXSYS. Quando você diz "prefiro Bluetooth", o que importa na prática é **"sem cabo, sem digitar valor"**. O jeito A entrega os dois.

---

## 3. O que cada operadora oferece

Em todas as linhas, "**[CONFIRMAR]**" indica o que precisa ser perguntado à operadora.

### 3.1 Cielo (Cielo Smart, antes LIO): Order Manager

**O que é:** integração remota por **API REST**. O ANEXSYS cria um **pedido** com o **valor em centavos**, libera o pedido para pagamento ("place") e **consulta** o pedido e suas **transações** para saber se foi pago. Pode **cancelar** o pedido. A API aceita **informar a forma de pagamento já escolhida** (por exemplo, crédito à vista), que então aparece pronta na maquininha ("reduzindo erros").

**Fluxo oficial (resumo):**

1. O ANEXSYS monta e envia o pedido pela API.
2. A API guarda o pedido na nuvem da Cielo.
3. **A maquininha acessa a nuvem, recupera o pedido e o exibe** para o pagamento.
4. O cliente paga. A **transação aparece no pedido** e o ANEXSYS a lê (ela traz, por exemplo, valor, bandeira e dados da autorização).

**Conexão:** a maquininha usa **Wi-Fi e 4G** (a Cielo Smart já vem com chip). O ANEXSYS fala com a API da Cielo pela internet. **Não há Bluetooth nem USB com o computador.**

**Ambientes:** **sandbox** (teste, **não exige** número de estabelecimento nem aparelho: basta conta no Portal de Desenvolvedores e um "Client-ID") e **produção** (exige estabelecimento Cielo, aparelho ativo e credenciais por estabelecimento).

**Credenciamento e contrato (o que a documentação diz):**

- Criar **conta no Portal de Desenvolvedores** da Cielo e **registrar uma aplicação** ("Cielo Smart - Order Manager") para obter **Client-ID e Access Token** (**só funcionam em teste**).
- Para **produção**, é preciso **gerar o "merchant ID" de cada estabelecimento**: pedir ao **suporte** da Cielo, por um formulário "Token Integração Remota", informando **dados pessoais e o número do estabelecimento**, e **ter uma Cielo Smart ativa**.
- Para **solicitar aparelho de teste e o credenciamento de desenvolvedor**: pedido no Portal de Desenvolvedores (**Suporte > Cielo LIO > Solicitação LIO DEV / Credenciamento EC Cielo**) ou e-mail para **integracaosmart@cielo.com.br**.
- Para ser **parceiro** (software house que oferece a integração a outros clientes): **Aliança Cielo**, pelo e-mail **parcerias@cielo.com.br**. Isso é importante para o ANEXSYS comercial.

**O que não consegui confirmar [CONFIRMAR]:**

1. **Se o seu aparelho atual** (qual modelo de "LIO"?) é compatível com o Order Manager. A Cielo migrou para "Cielo Smart" e diz que, desde outubro de 2025, **trocas e novas contratações são só de Smart**. A lista atual de terminais é: DX8000, L300 (LIO V3), L400 e L300 (V4).
2. **Se o pedido aparece sozinho na tela** da maquininha ou se o atendente precisa abrir a lista de pedidos e tocar no pedido. A documentação diz que o aparelho "recupera o pedido e o exibe". **Pergunte.**
3. **Como o resultado volta:** a documentação que vi mostra **consulta** (o ANEXSYS pergunta à API se o pedido foi pago). **Não encontrei aviso automático (webhook).** Se for só consulta, o ANEXSYS fica perguntando a cada poucos segundos. **Pergunte.**
4. **Custo:** aluguel ou mensalidade do aparelho, taxas por transação (negociadas por contrato) e se há **tarifa pela integração**. **Não é público.** Uma página antiga do programa citava **3 meses de isenção de aluguel** para testes, que **precisa ser reconfirmada**.
5. **Prazo real** de produção das credenciais por estabelecimento. A Cielo fala em "integrar em até uma semana" (é um texto de divulgação); **o prazo do credenciamento não está publicado**.
6. **Limite de pedidos** e regras de segurança de rede (IP fixo?).
7. **Estorno e cancelamento em produção**: a documentação diz que exige campos extras. **Pergunte** como se faz a partir do sistema.

### 3.2 Stone: Connect Stone (maquininha integrada)

**O que é:** o ANEXSYS cria um **pedido** na API do **Pagar.me** (que pertence ao grupo Stone), **em aberto** e com os **dados da maquininha** (número de série). A maquininha **recebe o pedido**. Há **dois modos**: **pagamento direto** (a maquininha entra sozinha na tela de pagamento) ou **lista de pedidos** (o atendente escolhe na maquininha). O resultado volta por **webhook** (aviso automático) de pagamento realizado ou estornado. **Há também envio do comprovante para impressão.**

**Conexão:** nuvem a nuvem; a maquininha precisa de internet.

**Credenciamento:** é obrigatório **se cadastrar no Programa de Parcerias da Stone** (trilha "Sales" ou "Plug-in"), receber **chaves, premissas comerciais e regras de homologação**, **testar em ambiente de staging**, enviar um **roteiro de testes** e **receber o OK para produção**. Existe também uma **API de credenciamento de lojistas** (Partner Hub), útil quando o ANEXSYS tiver vários ateliês clientes.

**Pontos de atenção:**

- Desde **fevereiro de 2026**, a Stone exige o **split** (divisão do valor entre recebedores) **na criação do pedido**. Para um único lojista isso provavelmente significa informar **100% para você mesmo**, mas **[CONFIRMAR]** com a Stone como fica no seu caso.
- **[CONFIRMAR]** quais **modelos de maquininha** Stone aceitam o modo integrado e se a sua conta atual tem direito a ele.
- **Taxas e contrato não são públicos**: dependem de proposta comercial.
- **Trocar a Cielo pela Stone** muda as taxas, os prazos de recebimento e a conta. Só faz sentido se a integração da Cielo travar.

### 3.3 Mercado Pago: Point (Point Smart)

**O que é:** o ANEXSYS cria uma **ordem** na API (`POST /v1/orders`, tipo "point") com o **valor** e o **terminal**. **A maquininha carrega a ordem sozinha** (se não aparecer, o atendente toca em "Atualizar"). O ANEXSYS recebe **webhooks** (aviso automático) de **processada, cancelada, estornada, falha ou expirada**, e pode consultar a ordem. Ordens **expiram** (de 30 segundos a 3 horas; a ordem de pagamento presencial expira em 15 minutos sem pagamento, segundo a página de status).

**Conexão:** o terminal fica em **modo "PDV"** e usa **Wi-Fi ou chip 4G**. **Não há vendas sem internet.** A Point Pro **não** usa Bluetooth; só a Mini NFC 2 usa, e ela é para o celular.

**Credenciamento:** **autoatendimento**. Você cria uma conta, uma aplicação em "Suas integrações", obtém credenciais de teste e de produção **sem contrato com a área comercial**. **Para um sistema que atende vários lojistas, o caminho é o OAuth** (cada ateliê autoriza o ANEXSYS a cobrar na conta dele), o que é **o mais simples para o ANEXSYS comercial**.

**Custos públicos (consultados hoje; mudam):** **Point Smart 2 a R$ 229,90** (ou 12 x R$ 19,15), **sem mensalidade**, com plano de dados incluído. Taxas **de entrada** divulgadas: **débito 1,99%**, **crédito à vista 4,98%**, Pix 0,49% (as taxas **caem** com o faturamento). **[CONFIRMAR]** a taxa e o prazo de recebimento para o **seu volume**. As taxas de crédito parcelado são mais altas.

**Pontos de atenção:** **trocar de operadora** significa mudar a conta que recebe, as taxas e o relacionamento com o cliente. Para **testar a integração**, vale **confirmar se há ambiente de teste sem aparelho** **[CONFIRMAR]**.

### 3.4 Getnet: Smart POS (nuvem a nuvem)

**O que é:** o ANEXSYS chama a API da Getnet (autenticação por **JWT**); a **nuvem da Getnet** encaminha o comando ao **terminal Smart POS**, que mantém **conexão contínua** com a nuvem. A API **aguarda até 5 minutos** a resposta do terminal.

**Segurança de rede:** a Getnet exige que o servidor do ANEXSYS tenha **IP fixo liberado** ou use uma **chave de API** no cabeçalho.

**Credenciamento:** portal de desenvolvedor (Getstore) e **homologação do aplicativo**. **[CONFIRMAR]** custos, contrato e prazos. **Não consegui verificar** as regras comerciais.

### 3.5 PagBank (Moderninha): PlugPag

**O que é:** a integração oficial (**PlugPag**) liga um **programa local** à **Moderninha** por **Bluetooth** (e, em alguns modelos, USB). O programa envia **valor, forma de pagamento, parcelas e código de venda** e a maquininha devolve o resultado. A comunicação com os servidores do PagBank continua por Wi-Fi ou chip.

**Para o ANEXSYS:** como é uma **biblioteca para Android, Windows, Linux e iOS**, o ANEXSYS web **precisaria de um programa instalado em cada computador** (jeito B). **Não encontrei** uma API de nuvem para disparar cobrança em Moderninha. **[CONFIRMAR]** com o PagBank se existe, porque a página de "SmartPOS" fala em aplicativo Android dentro do terminal (jeito C).

**Conclusão:** **fora da lista** por enquanto, por exigir instalação local ou aplicativo.

### 3.6 Rede (Itaú)

**O que encontrei:** APIs de **e-commerce (e.Rede)**, **QR Code**, **gestão de vendas** (extrato e conciliação), **TEF** e **geração de número lógico** de terminais. **Não encontrei** uma API que **envie o valor de uma OS a uma maquininha**. **[CONFIRMAR]** com a Rede se existe (a Rede é uma das operadoras que você mencionou aceitar).

**Conclusão:** **fora da lista** até a Rede confirmar.

### 3.7 TEF (por exemplo, PayGo): programa local com Bluetooth ou USB

**O que é:** o **TEF** é a forma tradicional de integrar vários **adquirentes** (Cielo, Getnet, PagBank, Rede, Safra e outros) a um sistema. A **PayGo** oferece uma biblioteca (**PGWebLib**) e um aplicativo **PayGo Integrado**, que rodam **no computador do caixa** e controlam **pinpads Bluetooth ou USB**. O sistema envia o valor e recebe a confirmação. O aparelho Android **GPOS780** também é compatível.

**Vantagens:** **independe da operadora** (você pode trocar), e **é o único caminho que entrega o Bluetooth e o USB que você prefere**.

**Desvantagens:** **instalação e suporte em cada computador** (impacta o ANEXSYS comercial: cada ateliê precisa instalar e manter); **contrato de TEF** com o provedor, **homologação** e **mensalidade por terminal** **[CONFIRMAR]**.

**Conclusão:** **alternativa**, não recomendada como primeira escolha.

---

## 4. Comparativo simples

Legenda: **Sim**, **Parcial**, **Não** ou **[?]** (não confirmado).

| Critério | Cielo Smart (Order Manager) | Stone Connect | Mercado Pago Point | Getnet Smart POS | PagBank PlugPag | TEF (PayGo) |
|---|---|---|---|---|---|---|
| Cobrança enviada do sistema web | **Sim** | **Sim** | **Sim** | **Sim** | **Parcial** (programa local) | **Parcial** (programa local) |
| Resultado online | **Sim** (consulta) **[webhook?]** | **Sim** (webhook) | **Sim** (webhook e consulta) | **Sim** | Sim | Sim |
| Conexão do computador | Internet (nuvem) | Internet (nuvem) | Internet (nuvem) | Internet (nuvem) | **Bluetooth ou USB** | **Bluetooth ou USB** |
| Instalar programa em cada computador | **Não** | **Não** | **Não** | **Não** | **Sim** | **Sim** |
| Funciona com vários atendentes | **Sim** | **Sim** | **Sim** | **Sim** | Exige um por computador | Exige um por computador |
| Você já tem a maquininha | **Sim (confirmar o modelo)** | Não | Não | Não | Não | Não |
| Teste sem contrato | **Sim** (sandbox) | **Não** (programa de parceiros) | **Sim** (autoatendimento) | [?] | [?] | Não |
| Credenciamento para produção | Por estabelecimento, pelo suporte | Programa de parceiros e homologação | Autoatendimento | Homologação | Homologação | Contrato de TEF |
| Pensado para vários ateliês (SaaS) | **Parcial** (um token por estabelecimento; programa de parceiros) | **Sim** (API de credenciamento) | **Sim** (OAuth de terceiros) | [?] | Não | Não |
| Custo público | Não público | Não público | **Sim** (aparelho e taxas de entrada) | Não público | Não público | Não público |
| Trocar de operadora | Não | **Sim** | **Sim** | **Sim** | **Sim** | Não (mantém a atual) |

---

## 5. Recomendação

### 5.1 Qual operadora

1. **Plano A: Cielo Smart (Order Manager).** É a sua operadora e a maquininha que você já usa. **O sandbox é grátis e não exige aparelho**, então **o desenvolvimento pode começar já**. O que depende de contrato (produção, token do estabelecimento, modelo do aparelho) pode andar em paralelo.
2. **Plano B: Mercado Pago Point** (a melhor documentação pública e o autoatendimento, com OAuth para vários lojistas) **ou Stone Connect** (parceria formal, com API de credenciamento). Só vale **se a Cielo travar** (modelo incompatível, prazo longo ou custo).
3. **Não recomendo** PagBank PlugPag, Rede e TEF para o primeiro piloto, por exigirem programa local ou por falta de API pública de cobrança remota.

### 5.2 Como construir (para o ANEXSYS comercial)

- Uma **"camada de operadoras"** no ANEXSYS: o ANEXSYS fala sempre do mesmo jeito ("cobrar R$ X da OS Y no terminal Z"), e **um adaptador por operadora** traduz. **A Cielo é o primeiro adaptador.** Isso evita refazer a OS se você trocar de operadora ou vender para ateliês que usam outras.
- **Credenciais por Empresa:** cada Empresa guarda a **conta da operadora** (por exemplo, Client-ID, token e número do estabelecimento) **protegida**, e os **terminais** (número de série), **ligados a uma Filial** e, se quiser, a **um atendente**.
- **Nada de dado de cartão passa pelo ANEXSYS.** O cartão é lido pela maquininha e o ANEXSYS só recebe o **resultado** (aprovado, recusado, cancelado) e dados da transação. Isso **reduz muito** o risco e a obrigação de segurança (PCI).

### 5.3 Como fica o fluxo na tela (proposta)

1. Na OS, o atendente clica **"Cobrar na maquininha"**. O ANEXSYS mostra **o valor da OS** (sinal ou saldo), **sem possibilidade de editar o valor nesta tela**.
2. O ANEXSYS **envia o pedido** ao terminal do atendente (ou da Filial).
3. A tela mostra **"Aguardando pagamento na maquininha"**, com um botão **"Cancelar cobrança"**.
4. O ANEXSYS **acompanha o resultado** (consulta a cada poucos segundos ou aviso automático, conforme a operadora) e **limita o tempo de espera**.
5. **Aprovado:** o pagamento é **gravado na OS** com a **data e hora, valor, forma, bandeira, parcelas e código da transação**, **o atendente e o terminal**, e a tela mostra "Pago". A OS deixa de mostrar "Falta pagamento" (se o saldo zerar).
6. **Recusado ou cancelado:** a OS **não** é marcada como paga, e o atendente pode **tentar de novo**.
7. **Dúvida** (queda de rede, tempo esgotado): o ANEXSYS **consulta o pedido à operadora** antes de permitir nova cobrança, para **nunca cobrar duas vezes**.
8. **Sinal e saldo** são **duas cobranças** na mesma OS.
9. **Estorno:** iniciado pelo ANEXSYS e concluído no terminal, **só para o gerente**, com motivo.

### 5.4 O que a integração resolve e o que não resolve

| Resolve | Não resolve sozinha |
|---|---|
| O valor sai **da OS**, sem digitar errado | O atendente ainda pode fazer **uma venda direto na maquininha**, sem passar pelo ANEXSYS. Se isso for um risco para o ateliê, **uma conferência simples do extrato** continua sendo útil (você pediu para esquecer a conciliação; **registro aqui como ressalva**) |
| Pagamento **gravado na OS** com os dados da transação | Pagamentos **em dinheiro ou Pix fora do sistema**, que continuam manuais |
| Saber **na hora** se o cliente pagou | **Queda de internet** na maquininha ou na loja (o aparelho precisa de internet) |
| Eliminar baixa manual uma a uma | **Chargeback** e disputas, que seguem pelo portal da operadora |

---

## 6. Impacto no plano e no prazo

- **O pagamento integrado vira um ciclo próprio e grande** (Ciclo 7 do plano, agora "Financeiro e maquininha integrada").
- **Dependência de contrato:** produção, token por estabelecimento e modelo do aparelho. Esses itens **precisam começar já**, no Ciclo 0.
- **Risco de prazo:** **alto**, e **o principal risco externo do piloto**, junto com a Meta (WhatsApp). Mitigações: sandbox da Cielo para construir **antes** de ter o contrato; plano B (Mercado Pago ou Stone) **com decisão marcada**; **ponto de decisão em dezembro de 2026** (se a Cielo não liberar a produção até lá, mudar para o plano B ou entrar em março com **baixa manual**, que **continua existindo como alternativa**).
- **A conciliação saiu do escopo**, como você decidiu. O **Pix na tela também saiu**. O **fechamento do dia** e o **relatório "quem deixou de cobrar"** que você pediu antes **deixam de ser planejados**.
- **A baixa manual continua** (dinheiro, Pix fora do sistema, maquininha fora do ANEXSYS), como **plano B de contingência**, sempre com registro de quem baixou.

---

## 7. O que você precisa fazer, passo a passo

### 7.1 Cielo (plano A)

**Quem contatar:**

1. **Portal de Desenvolvedores da Cielo** (desenvolvedores.cielo.com.br): criar uma **conta** com o e-mail do ateliê, na área de **Cielo LIO / Cielo Smart**.
2. **E-mail para integracaosmart@cielo.com.br** (suporte de integração da Cielo Smart), com o texto do roteiro da seção 8.1.
3. **E-mail para parcerias@cielo.com.br** (Aliança Cielo), **para a futura venda do ANEXSYS a outros ateliês**. Pode ser feito **depois** do piloto.
4. **O gerente de relacionamento** ou o **atendimento da sua conta Cielo**, para falar do **aparelho, do contrato e das taxas**. Se não souber quem é, peça o contato pelo canal de atendimento que você usa hoje.

**O que pedir (resumo):**

1. A **documentação atualizada** da **integração remota (Order Manager)** e do **ambiente sandbox**.
2. **Credenciais de desenvolvedor** (Client-ID e Access Token de teste).
3. **Confirmar se o seu aparelho atual** é compatível ou se precisa trocar por uma **Cielo Smart** (e **quanto custa a troca**).
4. **Credenciais de produção** do **seu estabelecimento** (token de integração remota).
5. **Programa de parceria** para o ANEXSYS comercial.

**Perguntas que você deve fazer:**

1. **Qual é o modelo exato da minha maquininha** (número de série) e **ela é compatível** com a integração remota (Order Manager)?
2. **O pedido aparece sozinho na tela** ou o atendente precisa abri-lo?
3. **Como o resultado volta ao sistema:** só consulta ou existe **aviso automático (webhook)**?
4. **Quanto custa** (aluguel do aparelho, taxas por transação, **tarifa pela integração**)? **Há isenção para desenvolvimento?**
5. **Qual é o prazo e o procedimento** para liberar as **credenciais de produção** do estabelecimento?
6. **Posso ter mais de um aparelho** (um por atendente ou por filial) **ligados ao mesmo sistema**?
7. **Como se faz estorno e cancelamento** a partir do sistema? **Quem autoriza?**
8. **Quais regras de segurança de rede** (IP fixo, certificado) valem?
9. **Quando eu vender o sistema a outros ateliês**, como cada um **libera o sistema** para cobrar na conta dele? Existe **modo de parceiro** que **simplifique** isso?
10. **Existe ambiente de teste com aparelho** (LIO de desenvolvedor) e **como solicitar**?
11. **Qual é o limite de pedidos** por minuto e **o que acontece se o aparelho estiver sem internet**?

**Documentos que normalmente são pedidos (confirmar com a Cielo):**

- **Cartão do CNPJ** e **contrato social** do ateliê.
- **Documento e CPF do responsável** (sócio ou titular).
- **Número do estabelecimento (EC) Cielo** e **número de série** da maquininha atual.
- **Dados do contato técnico** (nome, e-mail e telefone de quem vai integrar).
- **Comprovante de endereço** e **dados bancários** da empresa (se a Cielo pedir atualização do cadastro).
- Se for **parceiro** (ANEXSYS comercial): **CNPJ do ANEXSYS** (se for outro CNPJ), **descrição da solução** e **site**.

### 7.2 Segunda operadora (plano B)

**Recomendo contatar duas:**

1. **Stone** (Programa de Parcerias, pelo site partner.stone.com.br, trilha "Sales" ou "Plug-in"): pedir **chaves, premissas comerciais e regras de homologação**, e **um aparelho de desenvolvimento**.
2. **Mercado Pago**: **sem contato comercial no início**. Você pode **criar a conta e a aplicação** em "Suas integrações" (**developers do Mercado Pago**) e ver o **ambiente de teste**. A compra da maquininha (**Point Smart 2**, R$ 229,90, valor consultado em 05/10/2026) só se for necessária.

**Perguntas para a segunda operadora** (as mesmas da Cielo, mais estas):

1. **Posso integrar a maquininha ao meu sistema web** por API de nuvem, sem programa instalado?
2. **Quais modelos de maquininha** aceitam a integração?
3. **Existe ambiente de teste sem aparelho**?
4. **Como vários ateliês (clientes do meu sistema) autorizam** o meu sistema a cobrar nas contas deles (autorização tipo OAuth, API de credenciamento)?
5. **Taxas** para o meu volume (informe o faturamento mensal) e **prazos de recebimento**.
6. **Há exclusividade ou permanência mínima**?
7. **Como fica a troca** de operadora para os ateliês que já têm contrato com outra?

### 7.3 Ordem sugerida das ações

1. **Esta semana:** criar a **conta no Portal de Desenvolvedores da Cielo**; enviar o **e-mail (seção 8.1)** à Cielo; criar a **conta e a aplicação no Mercado Pago** (grátis, sem aparelho); **se inscrever no Programa de Parcerias da Stone** (grátis).
2. **Assim que a Cielo responder:** preencher o **pedido de credenciais**; confirmar o **modelo do aparelho**.
3. **No fim de outubro:** conferir as respostas e **decidir o plano A ou B**, com **data limite de dezembro** para a produção.
4. **Antes de vender o ANEXSYS a outros ateliês:** procurar **parcerias@cielo.com.br** (Aliança Cielo) e fechar o **modelo de parceria** com a operadora escolhida.

---

## 8. Roteiros de e-mail

> Preencha os campos entre colchetes. Envie **do e-mail do ateliê** (o da conta Cielo) e **com cópia para quem vai integrar**.

### 8.1 E-mail para a Cielo

**Para:** integracaosmart@cielo.com.br
**Cópia:** o seu e-mail e o de quem vai integrar
**Assunto:** Solicitação de documentação e credenciais de teste: Integração remota (Order Manager) para sistema próprio de gestão de OS

Prezados,

Sou [SEU NOME], responsável pelo estabelecimento [NOME FANTASIA / RAZÃO SOCIAL], CNPJ [CNPJ], cliente Cielo com o estabelecimento (EC) [NÚMERO DO EC]. Utilizo hoje uma maquininha Cielo LIO, número de série [SÉRIE], modelo [MODELO, SE SOUBER].

Estamos desenvolvendo um **sistema web próprio de gestão de ordens de serviço** (ateliê de costura e conserto), com **vários atendentes**, e queremos que, **a partir da ordem de serviço, o sistema envie a cobrança com o valor exato para a maquininha e receba o resultado online**, para evitar erro de digitação do valor.

Entendemos que a integração indicada é a **Integração Remota (Order Manager)** da Cielo Smart / LIO. Peço, por gentileza:

1. A **documentação atualizada** da integração remota (Order Manager) e do ambiente **sandbox**.
2. Credenciais de **desenvolvedor** (Client-ID e Access Token de teste). Já [criei / vou criar] minha conta no Portal de Desenvolvedores com o e-mail [E-MAIL].
3. A confirmação de que o **modelo da minha maquininha atual** é **compatível** com a integração remota. Se não for, **qual terminal Cielo Smart** devo contratar e **em quais condições** (aluguel, taxas, prazo de troca).
4. O **procedimento e o prazo** para obter as **credenciais de produção** (token e merchant ID) do meu estabelecimento.

E as seguintes dúvidas:

a) Ao enviar o pedido, ele **aparece sozinho** na tela da maquininha ou o atendente precisa abri-lo?
b) O resultado do pagamento é obtido **somente por consulta** à API ou existe **aviso automático (webhook)**?
c) Há **custo de integração**, **aluguel adicional** ou **tarifa** por uso da API? Há **isenção para desenvolvimento**?
d) Posso ter **mais de uma maquininha** (por atendente ou por filial) ligadas ao mesmo sistema?
e) Como funcionam **cancelamento e estorno** pela API em produção?
f) Há exigências de **segurança de rede** (IP fixo, certificado)?
g) No futuro, pretendemos **oferecer este sistema a outros ateliês**. Existe **modo de parceiro** (Aliança Cielo) para que cada cliente **autorize** o sistema a cobrar na conta dele? Podemos conversar com a equipe de parcerias (parcerias@cielo.com.br)?

Nosso contato técnico é [NOME DO CONTATO TÉCNICO], e-mail [E-MAIL], telefone [TELEFONE].

Fico à disposição para enviar documentos do estabelecimento, se necessário.

Atenciosamente,
[SEU NOME]
[CARGO], [RAZÃO SOCIAL]
CNPJ [CNPJ] | Telefone [TELEFONE] | E-mail [E-MAIL]

### 8.2 E-mail para uma segunda operadora (modelo genérico)

**Para:** [contato de parcerias ou integração da operadora: Stone (Programa de Parcerias), Getnet ou outra]
**Assunto:** Integração de maquininha com sistema web próprio de ordens de serviço: solicitação de documentação e condições

Prezados,

Sou [SEU NOME], responsável por [RAZÃO SOCIAL], CNPJ [CNPJ], um ateliê de costura e conserto. Estamos desenvolvendo um **sistema web próprio de gestão de ordens de serviço**, com **vários atendentes**, e pretendemos **comercializá-lo a outros prestadores de serviço** no futuro (a plataforma se chama ANEXSYS).

Nosso objetivo é que, **a partir da ordem de serviço, o sistema envie a cobrança com o valor exato para a maquininha e receba o resultado do pagamento online**. Hoje usamos outra operadora e **avaliamos trocar** se a integração for melhor.

Peço, por gentileza, informações sobre:

1. A **integração por API de nuvem** (sem programa instalado nos computadores) com as maquininhas de vocês, e a **documentação** correspondente.
2. **Quais modelos** de maquininha aceitam a integração e **se há ambiente de teste sem aparelho**.
3. **Como cadastrar** nossa empresa no **programa de parceiros ou de integradores**, e quais são as **etapas de credenciamento e homologação** (e prazos).
4. **Como vários ateliês clientes** do nosso sistema poderiam **autorizar** o nosso sistema a cobrar na conta de cada um (autorização por OAuth, API de credenciamento etc.).
5. **Condições comerciais** para o nosso volume (faturamento mensal estimado de [VALOR], ticket médio [VALOR]): **taxas** de débito, crédito à vista e parcelado, **prazos de recebimento**, **aluguel ou compra** do aparelho, **custo de integração** e **exclusividade ou permanência mínima**.
6. **Aparelho de desenvolvimento** para testes (como solicitar).
7. **Como funcionam cancelamento e estorno** pela API e **como o resultado volta** (aviso automático ou consulta).

Nosso contato técnico é [NOME], e-mail [E-MAIL], telefone [TELEFONE].

Agradeço desde já.

Atenciosamente,
[SEU NOME]
[RAZÃO SOCIAL] | CNPJ [CNPJ] | [TELEFONE] | [E-MAIL]

---

## 9. O que eu não consegui confirmar (resumo)

| # | Ponto | Com quem confirmar |
|---|---|---|
| 1 | Se o **seu modelo de LIO** é atendido pela integração remota (a Cielo migrou para "Cielo Smart") | Cielo |
| 2 | Se o pedido **aparece sozinho** na maquininha ou precisa ser aberto | Cielo |
| 3 | Se o resultado volta **por aviso automático** (webhook) ou **só por consulta** | Cielo |
| 4 | **Custo** (aluguel, taxas, integração) e **prazo** das credenciais de produção | Cielo, Stone, Getnet |
| 5 | **Token por estabelecimento** e como fica para **vários ateliês** (modelo de parceiro) | Cielo (Aliança Cielo), Stone, Mercado Pago |
| 6 | Como fica o **split obrigatório da Stone** para um único lojista | Stone |
| 7 | **Modelos** de maquininha compatíveis (Stone, Getnet, Mercado Pago) | Cada operadora |
| 8 | Se há **ambiente de teste sem aparelho** (Mercado Pago, Stone, Getnet) | Cada operadora |
| 9 | Se **PagBank** e **Rede** têm API de nuvem para cobrança remota | PagBank, Rede |
| 10 | **Custo e contrato do TEF** (PayGo e outros) | Provedor de TEF |
| 11 | **Taxas e prazos** para o seu volume (todas as operadoras) | Cada operadora |
| 12 | **Estorno e cancelamento** em produção, a partir do sistema | Cielo e a segunda operadora |

---

## 10. Fontes consultadas em 05/10/2026

- Cielo: Manual de integração Cielo Smart (developercielo.github.io), seção Integração Remota (Order Manager), ambientes Sandbox e Produção, credenciais, status de pedidos e comunicados; Portal de Desenvolvedores (desenvolvedores.cielo.com.br).
- Stone: Connect Stone (connect-stone.stone.com.br: processo de integração, fluxos transacionais, criar pedido para maquininha, split no pedido, operações); Stone Partner Program (partner.stone.com.br); Partner Hub (partnerhubapi.stone.com.br).
- Mercado Pago: Developers > Mercado Pago Point (processamento de pagamento, configurar terminal, notificações, status); páginas da Point Smart 2 e do blog de integração com PDV.
- Getnet: Getnet Docs, In-Store Payments, Cloud-to-Cloud; portal do desenvolvedor Getstore.
- PagBank: developer.pagbank.com.br (SmartPOS, PlugPag, Connect).
- Rede: developer.userede.com.br (APIs disponíveis).
- PayGo: paygodev.readme.io (arquitetura, terminais compatíveis, kit de integração).

Todas as fontes são **páginas públicas e podem ter mudado**. Nada aqui substitui o que a operadora disser no contrato.
