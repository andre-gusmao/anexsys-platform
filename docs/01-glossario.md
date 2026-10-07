# Glossário

**Atualizado em:** 06/10/2026
**Substitui:** os termos espalhados pela documentação antiga (`docs/arquivo/`).

Este glossário vale para as conversas, os documentos e as telas. A coluna "No código" ajuda quem abrir o programa, que usa nomes em inglês.

## Estrutura da plataforma

| Termo | Significado | No código |
|---|---|---|
| **Conta** | Quem assina o ANEXSYS. É a dona dos dados. Exemplo: "Grupo Ateliê Silva". Os dados de uma Conta **nunca** se misturam com os de outra | `tenant` |
| **Empresa** | O pai: a pessoa jurídica (CNPJ) dentro de uma Conta. Uma Conta pode ter várias Empresas. As Filiais são filhas desta Empresa. Ao cadastrar, nasce a Filial padrão (Matriz) | `company` |
| **Filial** | O filho: a unidade física onde se atende e produz. Cada Empresa pode ter várias Filiais no mesmo nível; a primeira é a Matriz. **Não existe Filial pai** | `branch` |
| **Usuário** | Pessoa que entra no sistema com e-mail e senha | `user` |
| **Papel** | Conjunto de permissões. Papéis iniciais: recepção, atendente/medidor, produção, qualidade e gerente | `role` |
| **Escopo** | A quais Empresas e Filiais um usuário tem acesso. Usuário novo nasce **sem nenhuma Filial** até o administrador marcar | `branch scope` |
| **Comunidade** | Agrupamento de usuários que existe no código. **Congelado**: não concede permissão | `community` |
| **Administrador da plataforma** | Quem cria Contas. Por enquanto, só o André | permissão `platform.tenants.create` |

## Atendimento e produção

| Termo | Significado | No código |
|---|---|---|
| **Cliente** | Pessoa atendida. Pertence à **Conta** e pode ser atendida em qualquer Empresa ou Filial dela | `customer` |
| **Ordem de Serviço (OS)** | Documento comercial: quem é o cliente, quais peças e serviços, preço, prazo. É a "verdade" do dinheiro. Número tipo placa (`AAA000001`) e versões `-A`, `-B` | `service order` |
| **Peça** | Uma peça de roupa trazida pelo cliente. Cada **versão da OS** aceita até o limite parametrizado da Conta (padrão **5**). Sem mínimo: a última versão pode ter só o que restou | `service order item` |
| **Produto** | Tipo da peça no cadastro (Calça, Saia, Vestido de festa, Vestido, Terno, Paletó, Camisa, Jaqueta). A atendente escolhe na linha da OS e pode cadastrar outro | `garment product` |
| **Serviço** | O que se faz numa peça (bainha, ajuste de cintura). O catálogo tem preço padrão, com ajuste manual na OS por quem tem permissão | `atelier service` / `service order item` |
| **Ordem de Produção** | Documento **impresso** que acompanha as peças numa sacola. Traz o **QR code**, a quantidade de peças e a descrição dos serviços. **Nunca mostra preço** — valores ficam só na OS | `production order` |
| **Sacola** | Embalagem **física** só para transportar as peças. O sistema não controla a sacola: controla o **limite de peças por versão da OS**. A OP impressa vai no bolso transparente | `bag` (apenas apoio físico) |
| **Fechar sacola** | Ação na OS: grava a versão e **trava** as peças. **Não** imprime e **não** abre a próxima versão. O botão vira **Abrir sacola** | `POST /service-orders/:id/close-bag` |
| **Abrir sacola** | Destrava a versão fechada para corrigir erro ou incluir peça que o cliente pediu de volta | `POST /service-orders/:id/open-bag` |
| **Abrir nova versão** | Só aparece com a sacola fechada. Marca a intenção; a próxima versão nasce ao **Salvar**, em **outra aba**, já editável | `POST /service-orders/:id/next-version` |
| **Versão da OS** | Continuação ligada da mesma OS quando o cliente trouxe mais peças do que o limite. A primeira é `AAA000001`; as seguintes são `AAA000001-A`, `AAA000001-B` | `service_orders.group_id` / `version_suffix` |
| **Esteira** | Lugar físico onde ficam as sacolas: "a fazer" (por ordem de chegada) e "finalizadas" | não existe no sistema |
| **QR code** | Código impresso na Ordem de Produção. **Um por OS** (não por peça). O funcionário lê com o celular para mudar o status | `qr code` |
| **Grau de dificuldade** | Nota de 1 a 4 definida **por serviço** (valor padrão no catálogo). A OS mostra a **maior**, e o atendente pode ajustar. Usada para estimar tempo médio e dimensionar a equipe | ainda não existe |
| **Prestador de serviço** | Pessoa que trabalha para o ateliê (costureiro, gerente, atendente, diarista, terceiro). Cadastro com **cargo**, **média de performance**, **valor contratado do dia** e dados de **Pix**. Ver `docs/02-decisoes-do-andre.md` seção 13 | ainda não existe |
| **Cargo** | Função do prestador no ateliê (costureiro, gerente, atendente…). Distinto do **papel**, que é o conjunto de permissões | ainda não existe |
| **Técnico / técnica** | Prestador convocado para produzir (costureira, diarista, terceiro). Tem **login próprio** | `operational resource` / `user` |
| **Grade diária** | Tela em que o gerente escolhe o dia, vê a demanda futura, marca quem vai trabalhar e confere se a equipe atende o prazo. Quem comparece gera **contas a pagar** e recebe **Pix** no fim do dia | ainda não existe |
| **Comparecimento** | Confirmação de que o técnico marcado na grade veio trabalhar naquele dia | ainda não existe |
| **Contas a pagar do técnico** | Título no valor contratado do dia, para quem compareceu. Pago via **Pix ao técnico** (não é o QR Pix da OS do cliente) | ainda não existe |
| **Pix automático (saída)** | Conexão do sistema com o banco (ou intermediário) para **enviar** Pix: pagar o técnico e reembolsar o cliente. Não é o QR Pix da OS | ainda não existe |
| **Reembolso ao cliente** | Devolução de valor ao cliente, acionada na OS. Só sai com **aprovação do administrador**, via Pix. Distinto do **estorno de cartão** na maquininha | ainda não existe |
| **Revisor** | Quem faz o controle de qualidade (hoje papel de atendente) | `user` |
| **Diário de bordo** | Registro do que cada técnico produziu: OS, descrição do serviço, hora de início e fim, quantidade de peças e dificuldade. Substitui o caderno | ainda não existe |

## Status e fluxo

| Termo | Significado |
|---|---|
| **Status** | A situação da OS no fluxo. Cada status tem nome interno, nome para o cliente e é **público** ou **interno** |
| **Status público** | O cliente enxerga. Ex.: "Em produção" |
| **Status interno** | Só funcionários enxergam. O único previsto é "Reprovado pela qualidade" |
| **Catálogo de status** | Cadastro **configurável** de status, com parâmetros, para o sistema não ficar engessado |
| **Parâmetros de um status** | Nome interno e público; público ou interno; ordem; papel que pode atribuí-lo; exige leitura de QR; grava técnico e hora; dispara WhatsApp; tempo esperado e limite de alerta; é inicial; é final |
| **Sequência rígida** | Cada status só vai para o próximo. Não pula e não volta. A **reprovação** é a única exceção |
| **Reprovação** | O revisor reprova a OS no controle de qualidade. Status interno **Reprovado pela qualidade**. A sacola volta à esteira e a técnica que lê o QR **assume a refação** |
| **Em refação** | Status interno da OS reprovada, enquanto a técnica a refaz. Ao terminar, vai para Aguardando controle de qualidade |
| **Uma sacola por vez** | A técnica só abre outra sacola depois de terminar a anterior |
| **Avanço automático** | Ao ler o QR, a OS vai para o próximo status permitido ao papel de quem leu |
| **Refação** | Refazer o trabalho de uma OS reprovada, antes de entregar ao cliente |
| **Aviso "Falta pagamento"** | Alerta na tela quando há saldo em aberto. **Não é status** |

## Cliente, prazo e garantia

| Termo | Significado |
|---|---|
| **Link público** | Endereço seguro que o cliente recebe por WhatsApp. Sem login. Mostra os status públicos com datas e permite aprovar o serviço |
| **Aprovação do cliente** | **Assinatura eletrônica** de "concordo com o serviço e o preço", feita no link. **Não é status** |
| **Assinatura eletrônica** | Registro de aceite com data, hora, texto aceito e aparelho. É **evidência de aceite**, não substitui um certificado digital |
| **Retirada** | O cliente retira a peça. Informa o número da OS ou o nome, o atendente confere, lê o QR e o cliente assina a Ordem de Produção em papel; a foto é anexada à OS e o atendente clica "entregue assinado" |
| **Tipo de entrega** | **Normal**: mesmo dia da semana da semana seguinte. **Expresso**: até 2 horas por peça, só no horário de funcionamento. **Urgente**: 2 ou 3 dias úteis (sugestão 3). Cada tipo tem **sobretaxa percentual** configurável. O sistema **sugere** a data e o atendente **pode alterar** |
| **Reconserto** | O cliente volta em até **7 dias corridos** da retirada reclamando de ajuste (curto ou largo). Cria-se **nova OS sem valor**, **vinculada à original**, mostrando o **técnico que fez a primeira vez**. Depois do prazo, a OS nova é cobrada (o gerente pode liberar sem valor, com motivo) |
| **Garantia de serviço** | **90 dias**, contados **da retirada**, para defeito de execução (descosturou, a barra se desfez), negociável no balcão |
| **Grupo de OS** | Versões ligadas da mesma OS (`AAA000001`, `AAA000001-A`, `AAA000001-B`): um só cliente, mesmo cabeçalho reaproveitado, cada uma com sua grade, sua sacola física e sua Ordem de Produção. Um só link, um só aviso e um só pagamento **[assumido]** |
| **Limite de peças por versão** | Parâmetro da Conta (padrão 5). A atendente registra até esse limite, fecha a sacola e continua na próxima versão. Não é divisão automática no meio da digitação |
| **Sugestão de cadastro** | Nos campos de busca e nos que vêm de tabela, o sistema sugere o que já está cadastrado. Se não houver sugestão, **Cadastrar** aparece na caixinha de “Nenhum registro encontrado” |
| **Tela de parâmetros** | Tela onde o administrador altera as regras do sistema (graus e tempos, prazos, cortes, sobretaxas, status etc.), com histórico de quem mudou e quando |
| **Pagamento integrado** | A partir da OS, o sistema aciona a maquininha com o valor da OS e recebe o resultado online, sem digitar o valor. Funciona de nuvem a nuvem, pela internet |
| **Estorno de cartão** | Devolução do pagamento feito na maquininha, pela operadora (Cielo). Só o gerente, com motivo. Não é o reembolso via Pix |
| **Aprovação pendente** | OS cujo cliente ainda não assinou. Lista sempre visível e aviso diário ao atendente e ao gerente |
| **Filial padrão** | Primeira Filial filha, criada automaticamente quando a Empresa não tem nenhuma. Nome de tela: Matriz. Pode ser renomeada |
| **Entrega em domicílio** | Funcionalidade nova, **fora do piloto**, com preço por distância ou geolocalização |
| **Feriado** | Dia fechado, cadastrado por Filial. A regra de adiar ou antecipar a data está em aberto |

## Mensagens, privacidade e segurança

| Termo | Significado |
|---|---|
| **Mensagem de WhatsApp** | O cliente recebe **somente duas**: "OS aberta" e "Pronto para retirada". O resto ele acompanha pelo link público |
| **Modelo de mensagem** | Texto da mensagem, configurável, com variáveis (nome do cliente, nome do estabelecimento, link). O WhatsApp exige aprovação prévia |
| **API oficial do WhatsApp** | Forma autorizada de um sistema enviar mensagens sozinho. Exige cadastro da empresa, número vinculado e modelos aprovados. Paga por mensagem |
| **WhatsApp Web** | WhatsApp do celular aberto no computador. Feito para pessoas, não para sistemas |
| **Fila de mensagens** | As mensagens esperam numa fila e um "carteiro" as envia, com nova tentativa se falhar. Falhas vão para uma **lista de falhas** |
| **Consentimento** | Autorização do cliente, registrada com data e responsável. Sem ele, não se envia mensagem |
| **Controlador / operador (LGPD)** | O **ateliê** é o controlador dos dados dos clientes. O **ANEXSYS** é o operador |
| **Dado mínimo no link** | O link público mostra só nome (sugestão: primeiro nome), número da OS, datas, status, serviços e situação do pagamento. Endereço só existe quando há entrega em domicílio |
| **Isolamento por Conta** | Garantia de que uma Conta nunca vê dados de outra. Será reforçado no próprio banco de dados |
| **Responsável (menor de idade)** | Roupa infantil só com responsável cadastrado. Fotos só da peça, nunca da criança |

## Projeto

| Termo | Significado |
|---|---|
| **Ciclo** | Etapa curta de trabalho que termina em algo que o André consegue ver e testar |
| **Ambiente de testes (homologação)** | Endereço na nuvem onde o André valida cada ciclo, com dados de demonstração |
| **Piloto completo** | Entrada em produção só com financeiro (pagamento integrado na maquininha) e portal (o link público) prontos, prevista para março de 2027, **sem concierge nem fila de chegada**, com o sistema antigo em paralelo até o André ter confiança |
| **Homologar** | Testar e aprovar. O André é o homologador de tudo |
| **MVP** | Primeira versão utilizável. Aqui, equivale ao piloto completo |
