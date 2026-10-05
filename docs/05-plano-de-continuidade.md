# Plano de continuidade do ANEXSYS (versão 2)

> Cópia da versão 2 de 05/10/2026 para manter o conjunto de documentos completo. Os documentos de apoio citados (perguntas complementares, parecer) estão fora do repositório. As decisões em vigor estão em `02-decisoes-do-andre.md`.

**Para:** André
**Versão:** 2, de 05/10/2026. Substitui a versão 1, do mesmo dia, que previa piloto fino, QR por peça, fluxo de fases livre e WhatsApp em todas as fases públicas. A versão 1 deixou de valer nos pontos em que as suas respostas decidiram outra coisa.
**Bases:**
- Suas decisões, em `docs/02-decisoes-do-andre.md`.
- O diagnóstico do parecer e as perguntas complementares, que ficam fora do repositório.

**Regra deste documento:** linguagem de negócio. Termo técnico vem explicado em uma frase.

**Sobre prazos:** a única data firme é a sua: **produção em março de 2027**. Não estimo esforço em horas ou semanas. Os "marcos" da seção 7 são uma **proposta de sequência** montada de trás para frente a partir de março/2027, para você confirmar.

---

## 1. Resumo executivo

### O que mudou da versão 1 para a versão 2

| Assunto | Versão 1 | Versão 2 (suas decisões) |
|---|---|---|
| Piloto | Fino, com pagamento manual | **Completo**: só entra em produção com financeiro, portal e concierge prontos, em **março de 2027**. Você homologa tudo, sem pressa de ajustes |
| Controle do QR | Etiqueta adesiva com QR **por peça** | **QR por OS**, impresso grande na **Ordem de Produção** que vai no bolso da sacola. **Sem etiqueta adesiva** |
| Dados de produção | Peça com fase própria | A OS guarda a **quantidade de peças** (até 5) e o **grau de dificuldade de 1 a 4** |
| Fases | Fluxo de fases editável com avanço livre | **Catálogo de status configurável, com parâmetros** (público ou interno etc.). Sequência **rígida: sem pular e sem voltar**. O único retorno é a **reprovação** pela qualidade |
| WhatsApp | Mensagem em cada fase pública | **Só 2 mensagens**: OS aberta e Pronto para retirada. O resto o cliente acompanha por um **link público** |
| Aprovação do cliente | Status "aguardando aprovação" | **Não é status.** É uma **assinatura** ("concordo com o serviço e o preço") no link público |
| Retirada | Confirmação simples | **Assinatura eletrônica** do cliente na retirada |
| Pagamento pendente | Bloqueio | **Aviso** na tela ("Falta pagamento"), não status. Bloqueia a entrega, e o **gerente libera com motivo** |
| Retorno do cliente | Voltar fase com motivo | **Reconserto = nova OS vinculada, sem valor**, registrando o **técnico que fez a primeira vez** |
| Técnico | Não tratado | **Diário de bordo** e **produtividade** por técnico (inclusive diaristas, com login próprio), com **dashboard** e **alertas de atraso** |
| Prazo | Um prazo padrão | **Normal, Expresso e Urgente**, com **sugestão de data editável** |
| Maquininha | Fora do MVP | **Dentro do piloto completo**: Cielo primeiro; Stone e Rede preparadas |
| Cobrança do ANEXSYS | Depois | Painel de planos, preços configuráveis, cartão/Pix/boleto, contrato de um ano. Entra **antes do segundo cliente**, não bloqueia março |
| Ambiente de testes | A decidir | **Nuvem simples e barata**, montada por nós |
| Multiempresa | Proposta | **Confirmado: Conta / Empresa / Filial**, cliente da Conta, comunidades congeladas |

### Ordem dos ciclos (visão rápida)

| Ciclo | Nome | Tamanho | O que você vê no final |
|---|---|---|---|
| **0** | Casa arrumada | P | Documentação única em português; falhas de segurança fechadas; ambiente de testes em nuvem; contratos iniciados |
| **1** | Multiempresa correto | M | Duas Contas de teste lado a lado, isoladas; usuários por Empresa e Filial |
| **2** | Cadastros e catálogo de status | G | Clientes completos, serviços com preço, **status configuráveis**, feriados, ficha de medidas |
| **3** | OS completa e Ordem de Produção impressa | G | OS com peças, dificuldade e prazo (Normal, Expresso, Urgente); link público com aprovação assinada; Ordem de Produção impressa com QR |
| **4** | Produção por QR, diário de bordo e qualidade | G | Leitura no celular muda o status; reprovação e refação; diário de bordo; produtividade |
| **5** | WhatsApp e acompanhamento público | M | As 2 mensagens chegam no seu celular com o link; falhas na lista |
| **6** | Entrega, assinatura e reconserto | M | Retirada com assinatura; aviso de pagamento; liberação pelo gerente; reconserto como nova OS vinculada |
| **7** | Financeiro e maquininha | G | Recebimentos, saldo, Cielo integrada, conciliação |
| **8** | Dashboard e alertas | M | Painel de produção e produtividade; alertas de atraso configuráveis |
| **9** | Portal do cliente e concierge do piloto | M | Escopo a confirmar com você (ver perguntas complementares) |
| **10** | LGPD mínima, importação e virada | M | Consentimento, retenção, apagar dado sensível; importação do histórico após validação; homologação em paralelo |
| **Depois** | Cobrança do ANEXSYS, retirada por terceiros, concierge com câmera, segundo tipo de negócio | n/a | Seção 10 |

---

## 2. As suas decisões, traduzidas em regras do sistema

### 2.1 O fluxo da OS, do balcão à retirada

```
ATENDIMENTO            APROVAÇÃO               SACOLA + OP IMPRESSA       PRODUÇÃO               QUALIDADE             RETIRADA
Cliente chega,    ->   Cliente assina   ->    Peças vão numa sacola  ->  Técnico lê o QR   ->   Revisor lê o QR  ->  Cliente retira,
mede, OS é aberta      no link "concordo      (até 5 peças) com a OP     ao pegar e ao          ao pegar; aprova      assina na tela e
e vai por WhatsApp     com serviço e preço"   impressa no bolso          terminar               ou reprova            lê-se o QR
(Em aberto)                                   (QR grande)
```

### 2.2 Os status (modelo inicial, editável)

| # | Status | Público? | Quem lê o QR | Muda para | Observação |
|---|---|---|---|---|---|
| 1 | **Em aberto** | Público | Ninguém (nasce na criação da OS) | Em produção | WhatsApp sai aqui. Aprovação do cliente **não** muda o status |
| 2 | **Em produção** | Público | Técnico, ao pegar a sacola | Aguardando controle de qualidade | Grava data, hora e técnico (produtividade) |
| 3 | **Aguardando controle de qualidade** | Público | Técnico, ao terminar e levar à esteira de finalizadas | Controle de qualidade | |
| 4 | **Controle de qualidade** | Público | Revisor, ao tirar a sacola da esteira | Pronto para retirada (aprova) ou Reprovado pela qualidade (reprova) | |
| 5 | **Pronto para retirada** | Público | Ninguém | Retirado pelo cliente | WhatsApp sai aqui |
| 6 | **Retirado pelo cliente** | Público | Atendente, na retirada | Final | Cliente assina eletronicamente |
| X | **Reprovado pela qualidade** | **Interno** | Técnica que fará a refação | Em produção | **Único retorno permitido.** O cliente nunca sabe |

**Regras do catálogo de status (os "parâmetros"):**

- Cada status tem: **nome interno**, **nome para o cliente**, **público ou interno**, **ordem**, **papel que pode atribuí-lo**, **exige leitura de QR**, **grava técnico e hora** (produtividade), **dispara mensagem de WhatsApp**, **tempo esperado e limite de alerta**, **é inicial**, **é final**.
- A sequência é **rígida**: cada status só vai para o **próximo** definido. **Não pula, não volta.** A **reprovação** é uma exceção explícita do catálogo, marcada como "retorno permitido".
- O cliente vê **a última fase pública atingida**, com as datas de cada uma, no link público. Em "Reprovado pela qualidade", o cliente continua vendo "Controle de qualidade".
- **Papel responsável:** quem produz (técnicas) avança "Em produção" e "Aguardando controle de qualidade". Quem revisa (atendentes) avança "Controle de qualidade". Cada status aponta o papel.
- **Refação:** a técnica original, se estiver escalada no dia, ou outra, lê o QR e **assume a refação** (fica registrado quem refez).
- **Aviso de falta de pagamento** não é status: aparece na OS e na retirada quando o saldo é maior que zero.

### 2.3 Regras de prazo

- **Normal:** o mesmo dia da semana da semana seguinte (segunda para segunda; vale para sábado). **Feriado** antecipa ou adia (a regra exata está nas perguntas complementares). O sistema **sugere** a data e o atendente **pode alterar**.
- **Expresso:** até **2 horas por peça**.
- **Urgente:** **2 a 3 dias** depois da abertura, fora da regra do mesmo dia da semana.
- Feriados são **cadastrados por Filial**. Há **horário de corte** (a hora ainda não foi informada).

### 2.4 Regras de garantia e reconserto

- **Reconserto:** o cliente volta em até **7 dias** reclamando (curto, largo, algo que não provou). Cria-se uma **nova OS, sem valor financeiro**, **vinculada à OS original**, mostrando **qual técnico fez a primeira vez**.
- **Garantia de serviço por peça:** **90 dias** (descosturou, barra se desfez), negociável no balcão, contada **da conclusão da peça**.
- **Em aberto:** os 7 dias contam em dias úteis ou corridos? Os 90 dias e os 7 dias são regras diferentes ou a mesma garantia? Está nas perguntas complementares.

### 2.5 Técnico e produtividade

- Cada técnico (inclusive **diaristas e terceiros**) tem **login próprio** e lê o QR no celular. Isso vira o **diário de bordo**: o que cada um produziu, em quanto tempo, com a **descrição do serviço** de cada peça (no lugar do caderno).
- O sistema usa a **quantidade de peças** e o **grau de dificuldade (1 a 4)** da OS para calcular o **tempo médio**, dimensionar a **grade de costureiras** (quanto contratar) e alimentar o **bônus por produtividade**.
- **Dashboard** por técnico e por quantidade de peças. **Alertas de atraso** antes de vencer o prazo, com parâmetros configuráveis.

### 2.6 O que o cliente recebe e faz

- **WhatsApp 1 (OS aberta):** mensagem configurável pela plataforma, com **link**. Modelo seu: "Olá, [nome do cliente], aqui é do [nome do estabelecimento], você está recebendo a sua ordem de serviço digital, acompanhe o status de produção, mas fique tranquila que por este canal avisaremos quando estiver pronto, entre agora para aprovar o que ficou combinado."
- **Link público (sem login):** mostra os status públicos e as datas, e permite **assinar a aprovação**. O link é **assinado e não adivinhável**, pode **expirar** e ser **revogado**.
- **WhatsApp 2 (Pronto para retirada):** avisa que a peça está pronta, com o mesmo link.
- **Nenhuma outra mensagem automática.** Não há registro de conversas no sistema; aprovações ficam na OS.

### 2.7 O que o consentimento e a LGPD pedem

- Só envia mensagem com **consentimento registrado**.
- Se o cliente **não concordar em compartilhar o endereço**, ele marca isso, e os **dados sensíveis são apagados da OS**.
- **Roupa infantil só com responsável cadastrado**; **fotos só da peça**, nunca da criança.
- Controlador: o **ateliê**; operador: o **ANEXSYS**. Guarda de inativos: **5 anos**.
- Você marcou o controle de LGPD como "mais adiante, mas importante". Por isso o plano o coloca **antes da produção** (Ciclo 10), com o mínimo legal.

---

## 3. O piloto completo: o que significa

**Definição (a sua):** o ateliê só entra em produção em **março de 2027**, com **financeiro, portal e concierge** prontos. Você é o homologador de tudo, **não tem pressa de ajustes**, e o **sistema antigo roda em paralelo até você ter confiança**.

**O que entra (em ordem de ciclo):**

1. Multiempresa (Conta, Empresa, Filial) e acesso por papel e escopo.
2. Clientes completos (WhatsApp obrigatório, CEP, busca multicritério, consentimento, responsável por menor).
3. Catálogo de serviços com preço fixo e ajuste manual com permissão; ficha de medidas em lista; feriados por Filial.
4. **Catálogo de status configurável** com parâmetros.
5. OS completa: peças (até 5), serviços, dificuldade, prazo (Normal, Expresso, Urgente), fotos opcionais (máximo 3 por peça).
6. Link público de acompanhamento e aprovação assinada.
7. Ordem de Produção impressa com QR grande.
8. Produção por QR, diário de bordo, refação.
9. WhatsApp real (2 mensagens).
10. Retirada com assinatura eletrônica, aviso e liberação.
11. Reconserto como nova OS vinculada.
12. **Financeiro** com recebimentos e **maquininha Cielo** (Stone e Rede preparadas).
13. Dashboard e alertas.
14. **Portal** e **concierge** nos termos que forem fechados (ver seção 12).
15. LGPD mínima, importação do histórico, homologação em paralelo.

**O que fica de fora do piloto (decidido):** retirada por terceiros com token por WhatsApp ("próxima versão"), fila de chegada, concierge com câmera e reconhecimento facial, segundo tipo de negócio, aprovação por resposta de WhatsApp, registro de conversas.

---

## 4. A base técnica que precisa ficar certa primeiro

### 4.1 Multiempresa: Conta, Empresa, Filial (decidido)

| Nível | Nome | O que é | Exemplo |
|---|---|---|---|
| 1 | **Conta** (no código: "tenant") | Quem assina o ANEXSYS; dona dos dados | "Grupo Ateliê Silva" |
| 2 | **Empresa** | Pessoa jurídica (CNPJ) | "Silva Costuras ME" |
| 3 | **Filial** | Unidade física | "Loja Centro" |

- **Cliente é da Conta** e pode ser atendido em qualquer Empresa ou Filial dela. **Entre Contas nunca há compartilhamento.**
- **CNPJ, numeração de OS e dados de pagamento pertencem à Empresa.** OS, produção e entrega acontecem **numa Filial**.
- **Usuário novo nasce sem nenhuma Filial** até o administrador marcar. **Comunidades ficam congeladas**: permissão vem do **papel** e do **escopo**.
- **Só você cria Contas**, por enquanto.
- **Isolamento no banco:** hoje o isolamento depende de cada consulta lembrar de filtrar pela Conta. A proposta é colocar um **porteiro no próprio banco** (recurso chamado *Row Level Security*): mesmo que o programa erre, o banco só entrega as linhas da Conta logada. Um **teste automático de vazamento** falha a construção se alguma tabela ficar sem o porteiro.

### 4.2 QR por OS, assinado, na Ordem de Produção impressa

- O QR **identifica a OS** (e sua Ordem de Produção). Está **impresso grande** na **Ordem de Produção**, que vai no bolso transparente da sacola. **Não há etiqueta adesiva e não precisa de impressora de etiqueta**: basta impressão comum.
- A Ordem de Produção impressa traz: número da OS, **QR grande**, **quantidade de peças**, **grau de dificuldade**, **descrição de cada peça e serviço**, **tipo e data de entrega**. **Nunca traz preço** (regra antiga mantida: a produção não vê dinheiro).
- O QR guarda **só um código longo e aleatório**, sem dado pessoal. O sistema o **assina** (lacre digital): QR inventado ou alterado é **recusado e registrado**.
- **Reimpressão** só pelo **gerente**, com motivo; a versão anterior **deixa de funcionar**.
- **Quem lê:** funcionário com **login no celular** (alguns têm celular próprio, outros usam o da loja; Android e iPhone). **Leitura exige internet**; o Wi-Fi do ateliê é bom, então **modo offline não é prioridade**.
- **Quem não está logado** (por exemplo o cliente) lendo o QR **não avança nada**.
- O QR **por OS** (e não por peça) traduz a sua regra: a costureira não divide a sacola; abre e termina.

### 4.3 WhatsApp (2 mensagens) e link público

- **API oficial:** é a única forma de **envio automático** estável. Para **só 2 mensagens por OS**, o custo costuma ser baixo, mas existe e precisa de **cadastro da Empresa**. Detalhes e a diferença para o WhatsApp Web estão no documento de perguntas complementares.
- **Fila e falha:** a mensagem entra numa **fila**, um "carteiro" envia, tenta de novo se falhar, e depois de algumas tentativas vai para a **lista de falhas** (decidido) com o motivo, para o atendente reenviar ou ligar. O sistema **só marca "enviada" quando o provedor confirma**.
- **Consentimento:** só envia com consentimento registrado.
- **Um número por Conta**, com cadastro da Empresa com as configurações necessárias.
- **Texto da mensagem configurável** na plataforma, com variáveis (nome do cliente, nome do estabelecimento, link).
- **Sem registro de conversas** no sistema. Respostas do cliente ficam no celular do ateliê.

### 4.4 Assinatura eletrônica

- **Duas assinaturas:** (1) **aprovação** ("concordo com o serviço e preço"), no link público; (2) **retirada** ("retirei"), na tela do atendente.
- Cada assinatura guarda: **quem**, **data e hora**, **o texto exato aceito**, **o valor e os serviços na hora**, **aparelho e endereço de rede**, e, na retirada, o **traço da assinatura na tela** (opcional). Não substitui contrato com certificado digital; é **evidência de aceite**.

---

## 5. Mudanças propostas no banco de dados (revisadas)

**Como ler:** o banco é onde o sistema guarda tudo. Cada mudança traz o que muda, por quê, e o que acontece com o que existe. Como **não há dado real a preservar** (decisão 4), todo o conteúdo atual é tratado como teste e pode ser recriado; mesmo assim, cada migração é feita em passos reversíveis, com cópia e conferência.

### 5.1 Quadro resumo (D1 a D16 revisadas e D17 em diante novas)

Legenda de situação: **Mantida**, **Alterada**, **Reduzida**, **Nova**.

| # | Mudança | Situação | Ciclo | Risco |
|---|---|---|---|---|
| D1 | Nível **Empresa** entre Conta e Filial | Mantida | 1 | Médio |
| D2 | **Porteiro no banco** (isolamento por Conta) | Mantida | 1 | Alto |
| D3 | **Catálogo de status** com parâmetros, regras de passagem e histórico por OS | **Alterada** (era "fluxos e fases livres") | 2 | Médio |
| D4 | **Peças da OS** (descrição, tipo, fotos), quantidade (até 5) e **grau de dificuldade** na OS | **Alterada** (peça deixa de ter QR e fase próprios) | 3 | Médio |
| D5 | **Catálogos**: serviços (preço, dificuldade padrão, tempo médio), tipos de peça, formas de pagamento, **feriados por Filial** | Alterada | 2 | Baixo |
| D6 | **Cliente completo**: WhatsApp obrigatório, CEP, consentimento, responsável por menor, "não concorda em compartilhar endereço" | Alterada | 2 | Baixo |
| D7 | **Anexos e fotos** (opcionais, até 3 por peça) | Alterada | 3 | Baixo |
| D8 | **Medida travada** na aprovação; ficha de medidas em lista | Mantida | 3 | Baixo |
| D9 | **QR por OS assinado** (fortalece o QR já existente por Ordem de Produção) | **Reduzida** (antes: etiquetas novas por peça) | 3 | Baixo |
| D10 | **WhatsApp**: conta do provedor, **2 modelos**, consentimento, fila e recibos | **Reduzida** (antes: modelos por fase e eventos de conversa) | 5 | Médio |
| D11 | **Acesso**: escopo explícito, 5 papéis prontos, comunidades congeladas | Mantida | 1 | Médio |
| D12 | **Módulos ativos** por Conta | Mantida | 1 | Baixo |
| D13 | **Numeração por Empresa**, **fuso e horário de corte** por Filial | Mantida | 2 | Baixo |
| D14 | **Segurança de login**: tentativas, recuperação de senha, convite por e-mail | Mantida (parte já no Ciclo 0) | 0 e 1 | Baixo |
| D15 | **Auditoria antes/depois** em todos os cadastros | Mantida | 2 a 4 | Baixo |
| D16 | **Plano/assinatura**: de um simples estado da Conta para o **módulo de cobrança do ANEXSYS** | **Alterada** (detalhada em D24) | Depois | Médio |
| D17 | **Link público e assinaturas eletrônicas** | **Nova** | 3 e 6 | Médio |
| D18 | **Diário de bordo e produtividade**: técnicos, vínculo (funcionário, diarista, terceiro), registros por OS | **Nova** | 4 | Médio |
| D19 | **Reconserto**: OS vinculada, sem valor, técnico original; **regras de garantia** configuráveis | **Nova** | 6 | Médio |
| D20 | **Tipos de entrega** configuráveis (Normal, Expresso, Urgente) e **data sugerida x data final** | **Nova** | 3 | Médio |
| D21 | **Alertas e indicadores**: regras de alerta, alertas gerados, leituras para o dashboard | **Nova** | 8 | Baixo |
| D22 | **Financeiro e maquininha**: contas do adquirente por Empresa, terminais, transações, conciliação | **Nova** (parte já existe no servidor) | 7 | Alto |
| D23 | **Liberação de entrega com saldo em aberto** (gerente, motivo) | **Nova** | 6 | Baixo |
| D24 | **Cobrança do ANEXSYS**: planos, preços, contratos de um ano, faturas, tentativas de cobrança | **Nova** | Depois | Médio |
| D25 | **LGPD operacional**: pedidos do titular, retenção de 5 anos, apagamento de dado sensível | **Nova** | 10 | Médio |
| D26 | **Importação do histórico** (áreas temporárias de validação) | **Nova** | 10 | Médio |

### 5.2 Detalhe das mudanças

#### D1. Empresa entre Conta e Filial (mantida)

- **O que muda:** nova tabela **Empresas** (CNPJ, razão social, nome fantasia, endereço fiscal). Cada **Filial** aponta para uma **Empresa**. A **OS** guarda também a Empresa (herdada da Filial).
- **Por quê:** hoje a tela chama de "Empresa" o que é, no banco, a Conta.
- **Impacto no que existe:** para cada Conta existente, o sistema cria **1 Empresa** e liga todas as Filiais a ela. CNPJ fica pendente até ser preenchido. As telas que dizem "Empresas" (que são Contas) passam a dizer **"Contas"**, visíveis só a você como administrador da plataforma.
- **Risco:** o fluxo de login (escolher Conta, Empresa, Filial) muda e será refeito com testes.

#### D2. Porteiro no banco (mantida)

- **O que muda:** cada tabela com Conta passa a **recusar** linhas de outra Conta mesmo que o programa peça. O programa informa ao banco, no começo de cada requisição, "estou atendendo a Conta X". Vínculos entre registros de Contas diferentes ficam **travados**.
- **Impacto:** nenhuma mudança nos dados; muda **como o programa fala com o banco** (usuário de banco sem poderes de dono, requisições dentro de "transações" que carregam a Conta). Operações de plataforma usam um caminho especial e auditado.
- **Redução de risco:** primeiro nas tabelas do núcleo; **modo de observação** antes de bloquear; **teste automático de vazamento**.

#### D3. Catálogo de status com parâmetros (alterada)

- **O que muda:** novas tabelas **Status** (nome interno, nome para o cliente, público ou interno, ordem, papel responsável, exige QR, grava técnico e hora, dispara mensagem, tempo esperado, é inicial, é final), **Regras de passagem** (de qual status para qual; marca o tipo "retorno permitido" para a reprovação) e **Histórico de status da OS** (cada passagem: quem, quando, por qual leitura de QR; **imutável**).
- **Por quê:** é o centro do negócio e hoje o status da OS é fixo no código (Em aberto, Aprovada, Cancelada).
- **Impacto no que existe:** a tabela `status_visibility_mappings` (mapa de nomes públicos em inglês) é **substituída**. Os estados atuais da OS são **convertidos** para o catálogo; os 6 estados da Ordem de Produção continuam como **estado técnico interno**. Cada Conta nova recebe o **modelo da seção 2.2** para editar.
- **Risco:** mudar a regra "OS aprovada" (hoje um status) para "OS com assinatura de aprovação" (um fato registrado). Será mapeado antes de aplicar.

#### D4. Peças e dificuldade (alterada)

- **O que muda:** nova tabela **Peças da OS** (descrição, tipo de peça, observação). A **OS** ganha **quantidade de peças** (calculada, **até 5**) e **grau de dificuldade 1 a 4**. Os **itens** atuais viram **serviços dentro de uma peça**.
- **Por quê:** a produção controla a OS inteira, mas precisa saber quantas peças e quão difícil é, para dimensionar a equipe e o tempo médio. A descrição de cada peça alimenta o diário de bordo.
- **Impacto no que existe:** cada **item existente** vira **uma peça com um serviço**. A dificuldade assume o valor padrão do serviço do catálogo (2, até você definir).
- **Risco:** o **limite de 5 peças** é uma regra rígida ou um alerta? E a dificuldade é por OS ou por serviço? Está nas perguntas complementares.

#### D5. Catálogos (alterada)

- **O que muda:** **Serviços** (nome, preço, **dificuldade padrão**, tempo médio), **Tipos de peça**, **Formas de pagamento** e **Feriados por Filial**.
- **Impacto:** itens antigos continuam em texto; o vínculo com o catálogo fica vazio neles. Novos itens exigem catálogo.

#### D6. Cliente completo (alterada)

- **O que muda:** **WhatsApp** (obrigatório, formato internacional), **CEP com endereço**, **consentimentos** (finalidade, autorizou ou recusou, quando, como, quem registrou), **responsável** para menores e a marca **"não concorda em compartilhar endereço"**, que aciona o **apagamento de dados sensíveis da OS**.
- **Impacto:** o campo "celular/WhatsApp" atual é copiado para o novo WhatsApp quando válido; consentimentos nascem como **"não informado"** (sem envio automático até registrar). CPF/CNPJ continua **opcional**.

#### D7. Anexos e fotos (alterada)

- **O que muda:** tabela **Anexos** (a quem pertence, tipo, tamanho, local de armazenamento, quem enviou, quando). Fotos **opcionais**, **máximo 3 por peça**, **só da peça**.
- **Impacto:** exige definir **onde guardar os arquivos** (a hospedagem em nuvem resolve).

#### D8. Medida travada (mantida)

- **O que muda:** a OS guarda **qual conjunto de medidas** foi usado e o **trava na assinatura de aprovação**.
- **Impacto:** OS antigas ficam sem vínculo; só valem para as novas.

#### D9. QR por OS assinado (reduzida)

- **O que muda:** o QR que **já existe por Ordem de Produção** é fortalecido: código **longo e aleatório**, guardado de forma protegida, com **assinatura**, **estado** (ativo, revogado, substituído), motivo e **quantas vezes foi impresso**. Os **eventos de leitura** ganham resultado (aceita, recusada por assinatura, recusada por revogação, duplicada) e **chave de repetição** (duas leituras seguidas não duplicam a mudança).
- **Impacto no que existe:** os QR atuais têm código **previsível em parte** e guardado em texto claro. Como **não há impressão real em circulação**, eles são **reemitidos** com o novo formato. Menor impacto que na versão 1.

#### D10. WhatsApp (reduzida)

- **O que muda:** **Conta do provedor** (número, provedor, credenciais protegidas), **2 modelos** (OS aberta e pronto), **consentimento**, **fila de mensagens** (pendente, enviando, enviada, entregue, lida, falhou, cancelada; tentativas; motivo do erro) e **recibos**. **Não** guarda conversas.
- **Impacto no que existe:** os registros atuais de comunicação marcados como "enviado" são **reclassificados como "registro interno, não enviado"**.
- **Risco:** depende da decisão entre API oficial e WhatsApp Web (perguntas complementares).

#### D11. Acesso e permissões (mantida)

- **O que muda:** o escopo do usuário passa a ser **explícito** (Empresas e Filiais permitidas; "todas" é marca visível). **5 papéis prontos**. **Comunidades deixam de conceder permissão**.
- **Impacto:** quem hoje depende de "sem Filial = todas" ganha a marca **"todas as Filiais da Conta"** (preserva o comportamento) com aviso. Permissões vindas só de comunidades são **convertidas em papel**, com **relatório "quem perde o quê"** que você aprova antes.

#### D12. Módulos ativos por Conta (mantida)

- **O que muda:** tabela dos **módulos que cada Conta usa** (OS, produção, WhatsApp, financeiro, qualidade etc.).
- **Impacto:** o que não faz parte do piloto (retirada por terceiros, fila de chegada, concierge com câmera, fiscal) fica **desligado**.

#### D13. Numeração, fuso e corte (mantida)

- **O que muda:** **sequência de numeração por Empresa** e **fuso e horário de corte por Filial**.
- **Impacto:** números antigos permanecem.

#### D14. Segurança de login (mantida)

- **O que muda:** **limite de tentativas** (já começa no Ciclo 0), **recuperação de senha**, **convite por e-mail**, sessão em **cookie seguro** em vez de `localStorage`, **criação de Conta fechada ao público** (Ciclo 0).
- **Impacto:** usuários entram de novo uma vez. Exige o provedor de e-mail (**anexsys.com.br**, domínio já registrado).

#### D15. Auditoria antes/depois (mantida)

- **O que muda:** o registro de auditoria guarda **o que mudou** (valor antigo e novo) nos cadastros e na OS.

#### D16. Plano e assinatura (alterada)

- Passa a ser o módulo completo de cobrança do ANEXSYS (D24). No Ciclo 1 basta o **estado da Conta** (ativa, em teste, suspensa).

#### D17. Link público e assinaturas eletrônicas (nova)

- **O que muda:** tabela de **Links públicos** (OS, código assinado e não adivinhável, ações permitidas: acompanhar e aprovar; validade; revogação) e tabela de **Assinaturas** (tipo: aprovação ou retirada; OS; nome de quem assinou; **texto aceito**; **valor e serviços no momento**; data e hora; aparelho; endereço de rede; traço da assinatura quando houver).
- **Por quê:** o cliente aprova sem login, e a retirada precisa de evidência.
- **Impacto:** nada existente.

#### D18. Diário de bordo e produtividade (nova)

- **O que muda:** **vínculo do usuário** (funcionário, diarista, terceiro), **responsável técnico por OS** (original e refação) e **registros de trabalho** (técnico, OS, status, início, fim, quantidade de peças, dificuldade, descrição), alimentados **automaticamente pelas leituras de QR**. Base para o **bônus por produtividade**.
- **Por quê:** substitui o caderno e mede eficiência por técnico.
- **Impacto:** nada existente.

#### D19. Reconserto e garantia (nova)

- **O que muda:** a OS ganha **tipo** (normal ou reconserto), **OS original vinculada**, **técnico original** (vindo do diário de bordo) e marca **sem valor**. **Regras de garantia configuráveis** por Conta (prazo do reconserto, prazo da garantia de serviço, tipo de contagem).
- **Impacto:** nada existente. Os campos de garantia já existentes no servidor (7 dias por Conta) são reaproveitados e ajustados depois das respostas.

#### D20. Tipos de entrega (nova)

- **O que muda:** **Tipos de entrega** configuráveis (Normal, Expresso, Urgente), cada um com sua regra de data. A OS guarda a **data sugerida**, a **data final** (editável) e quem alterou, com motivo.
- **Impacto:** os valores atuais **Standard, Priority, Express** são convertidos para **Normal, Urgente, Expresso** (mapeamento a confirmar). O motor de data de entrega atual (domingo fechado por padrão) é aproveitado e ampliado.

#### D21. Alertas e indicadores (nova)

- **O que muda:** **Regras de alerta** (por exemplo, avisar quando faltar X horas para o prazo), **Alertas gerados** e leituras prontas para o dashboard.
- **Impacto:** nada existente.

#### D22. Financeiro e maquininha (nova, apoiada no que já existe)

- **O que muda:** reaproveita pagamentos, pagamentos parciais e exceções financeiras já existentes no servidor. Acrescenta **conta do adquirente por Empresa** (Cielo primeiro; Stone e Rede), **terminais**, **transações** (código do adquirente, situação) e **conciliação**. **Aviso de falta de pagamento** é calculado (saldo maior que zero), **não é status**.
- **Impacto:** o servidor hoje só tem **contratos** para Stone, Cielo e PagBank, sem integração real.
- **Risco:** o mais dependente de **contrato** externo (seção 8).

#### D23. Liberação de entrega com saldo (nova)

- **O que muda:** tabela de **liberações** (OS, gerente, motivo, data). Reaproveita a opção atual "bloquear entrega com saldo", que passa a admitir exceção.

#### D24. Cobrança do ANEXSYS (nova)

- **O que muda:** **Planos**, **Preços** (configuráveis, à vista ou parcelado), **Contratos de 1 ano**, **Faturas**, **Tentativas de cobrança** (cartão online, Pix, boleto).
- **Quando:** **antes do segundo cliente**, não bloqueia março.

#### D25. LGPD operacional (nova)

- **O que muda:** **Pedidos do titular** (acesso, correção, exclusão), **política de retenção** (5 anos de inativos) e **rotina de apagamento** de dado sensível da OS quando o cliente não concorda em compartilhar o endereço.

#### D26. Importação do histórico (nova)

- **O que muda:** áreas temporárias para **receber as planilhas do sistema atual** (você disse que o sistema gera tudo em Excel), **validar** e só então **efetivar**, com **desfazer**.
- **Quando:** **depois da sua validação**, nas semanas de homologação em paralelo.

### 5.3 Garantias para a migração

- **Cópia de segurança antes** de cada mudança e **ensaio numa cópia**.
- **Passos:** adicionar o novo sem tirar o antigo; copiar; mudar o programa; só no fim remover o antigo.
- **Cada migração com "desfazer"** testado.
- **Relatório de conferência** em português ("X Contas, Y Empresas criadas, Z peças geradas, nenhum registro perdido").
- Como **não há dado real**, os dados de teste podem ser **recriados** por um script de demonstração.

---

## 6. Ciclos de evolução (reordenados)

Cada ciclo traz: **objetivo**, **o que será feito**, **banco**, **o que você vê**, **como valida**, **aprovado se**, **fora do ciclo**, **decisões antes**.

### Ciclo 0. Casa arrumada (tamanho P)

**Objetivo:** terreno confiável: documentação única, ambiente de testes em nuvem, falhas gritantes de segurança fechadas e contratos iniciados.

**O que será feito**

1. **Documentação consolidada** em português (seção 9): glossário, suas decisões, fluxo de status, estado atual; antigos para `docs/arquivo/` somente leitura.
2. **Segurança rápida:** criar Conta deixa de ser público; senhas e e-mail de exemplo saem dos guias e dos scripts; **limite de tentativas de login**.
3. **Ambiente de testes em nuvem** (simples e barato) com **dados de demonstração**.
4. **Contratos e cadastros em paralelo** (seção 8): WhatsApp (provedor e cadastro da Empresa), e-mail (domínio anexsys.com.br), escolha do adquirente.
5. **Testes de integração com banco** rodados e publicados em português.
6. Reclassificação das mensagens "enviadas" sem envio.

**Banco:** parte de D14; reclassificação de D10. **Sem mudar o esquema** no trecho de repositório já aberto.

**Como valida:** abre o link de testes; tenta criar Conta sem estar logado (recusado); erra a senha seis vezes (bloqueia por um tempo); abre o documento oficial e confere o glossário.

**Aprovado se:** os 3 testes passam e você lê o documento oficial sem precisar de outro.

**Decisões antes:** perguntas complementares 1, 2 e 3 (cadastros externos e nuvem) e 5 e 6 (para fechar o documento do fluxo de status).

---

### Ciclo 1. Multiempresa correto (tamanho M)

**Objetivo:** Conta, Empresa e Filial separados, com isolamento garantido no banco.

**Feito:** D1, D2, D11, D12; telas de **Contas** (só você), **Empresas, Filiais e Usuários** (por Conta); **5 papéis** do ateliê; relatório **"quem perde o quê"**; **teste automático de vazamento**.

**Você vê:** duas Contas de teste ("Ateliê A" e "Ateliê B") com suas Empresas, Filiais e usuários; relatório de isolamento.

**Valida ("teste do espelho"):** cria "Maria Teste A" na Conta A; entra na Conta B e busca "Maria": não aparece; tenta abrir uma tela da Conta A com o usuário de B: nega; cria usuário de recepção só na Filial Centro e confere que não vê a Filial Zona Sul; lê o relatório automático de isolamento.

**Aprovado se:** nenhum dado de A aparece em B e o relatório mostra todas as tabelas do núcleo protegidas.

**Decisões antes:** pergunta complementar 4 (estrutura real do ateliê: CNPJs, Filiais, horários).

---

### Ciclo 2. Cadastros e catálogo de status (tamanho G)

**Objetivo:** cadastros completos e o **catálogo de status configurável**, que é o coração do negócio.

**Feito:** D3, D5, D6, D13, D15. **Telas:** Cliente (busca multicritério por nome, telefone, CPF/CNPJ numa tela; CEP; WhatsApp obrigatório; consentimento; responsável por menor); **Serviços** (preço fixo, dificuldade padrão, tempo médio); **Tipos de peça**; **Formas de pagamento**; **Feriados por Filial**; **Ficha de medidas em lista**; **Catálogo de status** (tela para editar status e parâmetros, com o **modelo da seção 2.2 já carregado**).

**Você vê:** a tela de status mostrando os 6 status públicos mais o interno "Reprovado pela qualidade".

**Valida:** edita um nome público; tenta tornar "Reprovado pela qualidade" público (permitido, mas com aviso); tenta criar uma regra que **pula** um status (o sistema recusa); cadastra cliente **menor sem responsável** (recusa) e cliente sem WhatsApp (recusa); cadastra 3 serviços.

**Aprovado se:** você reproduz o fluxo real do ateliê na tela de status sem pedir ajuda.

**Decisões antes:** perguntas complementares 5, 6 e 14.

---

### Ciclo 3. OS completa e Ordem de Produção impressa (tamanho G)

**Objetivo:** abrir uma OS de verdade, aprovada por assinatura, com a Ordem de Produção impressa e o QR.

**Feito:** D4, D7, D8, D9, D17 (parte da aprovação), D20. **Formulário de OS** (cliente, Filial, atendente, **peças até 5**, **serviços por peça do catálogo**, **dificuldade 1 a 4**, fotos opcionais até 3 por peça, **tipo de entrega com data sugerida editável**, resumo financeiro). **Link público** com **aprovação assinada**. **Medida travada** na aprovação. **Ordem de Produção impressa** (QR grande, quantidade de peças, dificuldade, descrição, data de entrega, sem preço). Botões de **aprovar, cancelar, recalcular prazo** na tela de OS.

**Você vê:** a Ordem de Produção em papel comum, com QR grande.

**Valida:** abre uma OS com 3 peças (uma com 2 serviços); abre o link público no celular como cliente e **assina**; confere que a medida ficou travada (muda a medida do cliente e a OS não muda); troca o tipo para Expresso e confere a data sugerida; **altera a data** e confere que o sistema guardou a sugestão e a alteração; tenta abrir OS com 6 peças (conforme a regra decidida); imprime a Ordem de Produção e confere o conteúdo (**sem preço**).

**Aprovado se:** você abre uma OS real, o prazo faz sentido e a Ordem de Produção impressa substitui a atual.

**Decisões antes:** perguntas complementares 7, 8, 9 e 12.

---

### Ciclo 4. Produção por QR, diário de bordo e qualidade (tamanho G)

**Objetivo:** produção controlada pelo celular, com técnicos identificados.

**Feito:** D18 e parte de D9 e D3. **Tela de leitura no celular** (câmera, mostra a OS, confirma). **Mudança de status** conforme o catálogo e o papel. **Reprovação** e **refação** (técnica assume ao ler). **Diário de bordo** do técnico (o que produziu, descrição do serviço, tempo). **Painel de produção** (quantas OS em cada status; esteira "a fazer", "finalizadas"). **Login próprio** para técnicos, inclusive diaristas.

**Você vê:** o celular lendo a Ordem de Produção e o painel se atualizando.

**Valida:** com técnico de teste, lê o QR ao pegar a sacola (status Em produção, com hora e nome); lê ao terminar (Aguardando controle de qualidade); com revisor, lê (Controle de qualidade) e **reprova**; confere que o cliente (link público) continua vendo "Controle de qualidade"; técnica lê e **assume a refação**; **lê duas vezes seguidas** e confere que só uma mudança foi registrada; usuário **sem papel** tenta avançar e é negado; QR **alterado** é recusado e registrado.

**Aprovado se:** a leitura é rápida o bastante para o ritmo da oficina (você cronometra) e o diário de bordo substitui o caderno.

**Decisões antes:** pergunta complementar 6.

---

### Ciclo 5. WhatsApp e acompanhamento público (tamanho M)

**Objetivo:** as 2 mensagens chegam ao cliente com o link, com fila e tratamento de falha.

**Feito:** D10 e D17 (link público completo). **Conta do provedor** (começa com número de teste), **2 modelos** (editáveis), **consentimento** (registrar e respeitar), **fila e tentativas**, **lista de falhas**, **recibos**. **Depende de contrato** (seção 8).

**Valida:** cadastra um cliente com **o seu número** e consentimento; abre uma OS: chega a **mensagem 1** com o link; leva a OS até **Pronto para retirada**: chega a **mensagem 2**; passa por "Em produção" e "Controle de qualidade": **nenhuma mensagem**; cliente **sem consentimento**: não envia e mostra o motivo; **simula falha**: aparece na lista de falhas e pode reenviar; o sistema **nunca mostra "enviada"** sem confirmação.

**Aprovado se:** os testes passam e o texto das mensagens está do jeito que você quer falar com seus clientes.

**Decisões antes:** perguntas complementares 1 e 2 (WhatsApp). **Os cadastros começam no Ciclo 0.**

---

### Ciclo 6. Entrega, assinatura e reconserto (tamanho M)

**Objetivo:** fechar a OS com retirada assinada e tratar o retorno do cliente.

**Feito:** D17 (assinatura de retirada), D19, D23. **Retirada** (cliente informa número ou nome, atendente confere, lê o QR). **Assinatura eletrônica** na tela. **Aviso "Falta pagamento"** (não é status). **Bloqueio de entrega com saldo**, com **liberação pelo gerente e motivo**. **Reconserto:** cria **nova OS sem valor**, **vinculada**, mostrando o **técnico original**.

**Valida:** tenta retirar com saldo em aberto (aviso e bloqueio); gerente libera com motivo e a entrega segue; cliente **assina na tela**; abre um reconserto da OS entregue e confere o vínculo, o valor zero e o nome do técnico que fez a primeira vez.

**Aprovado se:** o fluxo da OS fecha sem papel e o reconserto mostra o técnico original.

**Decisões antes:** perguntas complementares 10 e 13.

---

### Ciclo 7. Financeiro e maquininha (tamanho G)

**Objetivo:** o dinheiro do ateliê controlado e a **Cielo integrada**.

**Feito:** D22. **Recebimentos** (sinal e saldo), **formas de pagamento**, **contas a receber**, **fluxo de caixa**, **conciliação**. **Integração com a Cielo** (Stone e Rede preparadas por uma camada comum). **Depende de contrato** (seção 8).

**Valida:** registra recebimento em dinheiro; faz uma **venda de teste pela maquininha** e confere que aparece **sozinha** na OS; **estorna** e confere; abre o **relatório de caixa** do dia e confere com a maquininha.

**Aprovado se:** o caixa do dia fecha com a maquininha e com a OS.

**Decisões antes:** pergunta complementar 11.

---

### Ciclo 8. Dashboard e alertas (tamanho M)

**Objetivo:** acompanhar produção e produtividade pelo próprio sistema.

**Feito:** D21. **Dashboard** por técnico e por quantidade de peças e dificuldade; **tempo médio** por grau; **dimensionamento de grade**; **alertas de atraso** antes de vencer, com parâmetros configuráveis; base do **bônus por produtividade** (regra de cálculo a definir).

**Valida:** configura alerta de "2 horas antes do prazo"; deixa uma OS atrasar e confere que o alerta apareceu; compara o dashboard com o diário de bordo de um dia.

**Aprovado se:** o painel responde, sem planilha, "quem produziu quanto" e "o que vai atrasar".

---

### Ciclo 9. Portal do cliente e concierge do piloto (tamanho M)

**Objetivo:** cumprir "piloto completo com portal e concierge".

**Situação:** há **uma contradição** nas suas respostas: o piloto completo inclui portal e concierge, mas concierge e reconhecimento facial estão marcados como "versão futura" (e a fila de chegada, "depois"). Este ciclo só tem escopo depois da resposta às perguntas complementares (pergunta complementar 15). **Hipótese de trabalho:** "portal" = o **link público** (já feito nos ciclos 3 e 5) mais, se você quiser, uma área com **histórico de OS** do cliente; "concierge" = **fila de chegada** e atendimento de balcão **sem câmera**.

---

### Ciclo 10. LGPD mínima, importação e virada (tamanho M)

**Objetivo:** entrar em produção com segurança jurídica mínima e dados migrados.

**Feito:** D25, D26. **Termo de consentimento** no balcão e no WhatsApp, **política de privacidade em português**, **retenção de 5 anos**, **apagamento de dado sensível**, **pedido do titular**. **Importação do histórico** (planilhas do sistema atual) **depois da sua validação**. **Backup diário com restauração testada**, **monitoramento** com alerta simples. **Treinamento** (roteiro de 1 página por papel). **Homologação em paralelo** com o sistema antigo até a sua confiança.

**Valida:** importa uma amostra, confere totais com o sistema antigo; marca "não concorda em compartilhar endereço" e confere o apagamento; restaura um backup numa cópia e confere os dados.

**Aprovado se:** nenhum dado se perde, nenhuma informação vaza, e você diz por escrito "pode virar".

---

## 7. Proposta de marcos até março de 2027 (a confirmar)

Montado de trás para frente. **Não é estimativa de esforço.** É a ordem em que as coisas precisam estar prontas para março caber.

| Marco | O que precisa estar pronto |
|---|---|
| **Outubro de 2026** | Ciclos 0 e 1. **Todos os contratos e cadastros iniciados** (WhatsApp, adquirente, e-mail, nuvem) |
| **Novembro de 2026** | Ciclos 2 e 3 (cadastros, catálogo de status, OS completa, Ordem de Produção impressa) |
| **Dezembro de 2026** | Ciclos 4 e 5 (produção por QR e WhatsApp com link público) |
| **Janeiro de 2027** | Ciclos 6 e 7 (entrega, assinatura, reconserto, financeiro e Cielo). **Congelamento de funcionalidades do piloto** |
| **Fevereiro de 2027** | Ciclos 8, 9 e 10: dashboard, portal/concierge, LGPD, importação; **homologação em paralelo com o sistema antigo** |
| **Março de 2027** | **Produção**, com sua autorização escrita |

**Honestidade sobre o prazo:** é **apertado** para um piloto completo. O que mais pode atrasar **não é a programação**: é **contrato e aprovação externa** (provedor de WhatsApp, adquirente) e a **sua disponibilidade** para validar (você indicou 4 a 8 horas por dia, o que ajuda muito).

**Plano de corte, se estiver atrasado no congelamento de janeiro** (o que sai do piloto, em ordem):

1. **Importação do histórico completo** (entra só clientes e medidas; o resto vem depois).
2. **Portal além do link público** e **concierge** (ficam só o link e o atendimento de balcão).
3. **Dashboard avançado** (ficam o painel de produção e os alertas de atraso).
4. **Stone e Rede** (fica só a Cielo, que você já usa).
5. **Bônus de produtividade** (fica o diário de bordo; o cálculo vem depois).

**O que não sai de jeito nenhum:** isolamento por Conta, catálogo de status, QR assinado, 2 mensagens de WhatsApp, assinatura de aprovação e de retirada, aviso e bloqueio de pagamento, LGPD mínima, backup testado.

---

## 8. O que depende de contrato ou cadastro externo

| Item | O que é preciso | Quem faz | Quando começar |
|---|---|---|---|
| **WhatsApp (API oficial)** | Cadastro da **Empresa** na Meta (CNPJ, verificação), **número exclusivo**, aprovação dos **2 modelos**, escolha entre provedor direto ou intermediário (ver perguntas complementares) | Você (dono da Empresa) com apoio nosso | **Já, no Ciclo 0** (a aprovação demora e pode recusar) |
| **Maquininha (Cielo)** | Credenciais de desenvolvedor e **ambiente de teste**; **modelo de integração** (maquininha integrada ao sistema, link de pagamento ou API); contrato do ateliê com a Cielo | Você, com a Cielo | **Ciclo 0** (para sabermos o modelo) |
| **Stone e Rede** | Mesmos itens, em segundo plano | Você | Depois da Cielo funcionar |
| **Cobrança do ANEXSYS** | Conta em um **gateway** que cobre cartão recorrente, Pix e boleto; regras de contrato de 1 ano | Você | Antes do segundo cliente |
| **E-mail** | Serviço de e-mail transacional ligado ao domínio **anexsys.com.br** | Nós, com acesso ao seu domínio | Ciclo 0 |
| **Hospedagem em nuvem** | Conta em um provedor, cartão para a cobrança mensal, domínio apontado | Você cria a conta, nós montamos | Ciclo 0 |
| **Fiscal (nota)** | Você **não mencionou nota fiscal** nas respostas; hoje só existe o esqueleto no servidor | Decisão sua | Quando decidir; fora do piloto até lá |

---

## 9. Consolidação da documentação

**Estrutura nova, em português, em `docs/`:**

```
docs/
  00-leia-primeiro.md      Como ler, estado resumido, onde está cada coisa
  01-glossario.md          Conta, Empresa, Filial, OS, Ordem de Produção, status etc.
  02-decisoes-do-andre.md  O que você decidiu, com pontos ainda em aberto
  03-fluxo-de-status.md    O fluxo da OS, status, QR e mensagens
  04-estado-atual.md       O que existe hoje, com data
  05-plano-de-continuidade.md  Este plano
  arquivo/                 Tudo o que é histórico, somente leitura
```

**Cada ciclo termina atualizando** `02`, `03` e `04`. **Sem percentual de prontidão sem critério**: só "demonstrado? testado com banco? aceito pelo André?". **Todo documento tem data e "substitui/substituído por".**

---

## 10. O que fica de fora do piloto (e para quando)

| Item | Quando |
|---|---|
| **Retirada por terceiros** (token por WhatsApp; portador informa número da OS e token) | "Próxima versão", após o piloto |
| **Fila de chegada** | Depois |
| **Concierge com câmera e reconhecimento facial** (identifica o cliente, monta fila, abre a porta; foto apagada após cadastro ou guardada fora do sistema) | Versão futura, com análise de privacidade |
| **Segundo tipo de negócio** | Só depois do piloto do ateliê |
| **Cobrança do ANEXSYS** (painel de planos, preços configuráveis, contrato de um ano) | Antes do segundo cliente |
| **Registro de conversas de WhatsApp e resposta de aprovação por mensagem** | Não previsto |
| **Modo offline de leitura** | Não necessário (Wi-Fi bom) |
| **Qualidade, retrabalho e garantia como módulos completos do servidor** | Ficam guardados; o piloto usa reprovação, refação e reconserto |
| **Fiscal (notas)** | A decidir |

---

## 11. Riscos e como reduzi-los

| # | Risco | Impacto | Como reduzimos |
|---|---|---|---|
| 1 | **Prazo de março** com escopo de piloto completo | Alto | Marcos da seção 7, congelamento em janeiro e plano de corte |
| 2 | **Aprovação do WhatsApp demora ou recusa** os modelos | Alto | Cadastro já no Ciclo 0; texto sóbrio; número de teste |
| 3 | **Contrato e modelo de integração da Cielo** indefinidos | Alto | Perguntar à Cielo no Ciclo 0; camada comum para trocar de adquirente |
| 4 | **Isolamento no banco (D2) quebra telas** | Alto | Modo de observação, teste automático de vazamento, ciclo próprio |
| 5 | **Regras ainda em conflito** (modo de leitura, garantia, WhatsApp Web) | Alto | Perguntas complementares antes dos Ciclos 2 a 5 |
| 6 | **QR por OS** não mostra a peça atrasada numa OS de várias peças | Médio | Aceitação explícita sua; quantidade e dificuldade ajudam a medir; revisão após o piloto |
| 7 | **Funcionários resistem a ler QR** | Alto | Tempo de leitura medido; treinamento curto; login simples; ouvir no paralelo |
| 8 | **Limite de 5 peças** conflita com a realidade (OS maiores) | Médio | Decidir entre bloqueio, alerta ou duas OS (pergunta complementar) |
| 9 | **LGPD deixada para mais adiante** | Alto | Mínimo legal no Ciclo 10; consentimento já no Ciclo 2 |
| 10 | **Fotos e dados de menores** | Alto | Responsável obrigatório; fotos só da peça; apagamento de dado sensível |
| 11 | **Permissões removidas por engano** | Médio | Relatório "quem perde o quê" antes |
| 12 | **Dependência da sua disponibilidade** como único homologador | Médio | Roteiros curtos; vídeo; reunião ao vivo opcional |
| 13 | **Documentação nova também envelhece** | Médio | Ciclo só fecha com documentação atualizada |
| 14 | **Dados de produtividade e bônus** geram atrito com a equipe | Médio | Transparência das regras; começar só como diário de bordo |
| 15 | **Hospedagem e custos** não definidos | Médio | Decidir no Ciclo 0 e começar simples |

---

## 12. Pontos que ainda dependem de você

Todos estão no documento de perguntas complementares (fora do repositório), da mais bloqueante para a menos:

1. **WhatsApp:** API oficial ou WhatsApp Web (pergunta 1) e qual número usar, com o cadastro da Empresa (pergunta 2). **Bloqueiam o Ciclo 0 e o Ciclo 5.**
2. **Nuvem e domínio:** quem cria a conta e controla o domínio (pergunta 3). **Bloqueia o Ciclo 0.**
3. **Estrutura real do ateliê:** CNPJs, Filiais, horários e corte (pergunta 4). **Bloqueia o Ciclo 1.**
4. **Lista final de status e o retorno da reprovação** (pergunta 5) e **modo de leitura do QR** (pergunta 6). **Bloqueiam o catálogo de status do Ciclo 2.**
5. **Limite de 5 peças** (pergunta 7), **dificuldade por OS ou por serviço** (pergunta 8) e **regras de prazo** (pergunta 9). **Bloqueiam o Ciclo 3.**
6. **Garantia e reconserto** (pergunta 10). **Bloqueia o Ciclo 6.**
7. **Cielo:** modelo de integração (pergunta 11). **Bloqueia o Ciclo 7**, mas a consulta à Cielo começa no Ciclo 0.
8. **Aprovação e assinatura de retirada** (perguntas 12 e 13) e **dados a apagar** (pergunta 14).
9. **Concierge e portal no piloto completo** (pergunta 15). **Define o escopo do Ciclo 9.**
