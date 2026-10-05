# Glossário

**Atualizado em:** 05/10/2026
**Substitui:** os termos espalhados pela documentação antiga (`docs/arquivo/`).

Este glossário vale para as conversas, os documentos e as telas. A coluna "No código" ajuda quem abrir o programa, que usa nomes em inglês.

## Estrutura da plataforma

| Termo | Significado | No código |
|---|---|---|
| **Conta** | Quem assina o ANEXSYS. É a dona dos dados. Exemplo: "Grupo Ateliê Silva". Os dados de uma Conta **nunca** se misturam com os de outra | `tenant` |
| **Empresa** | A pessoa jurídica (CNPJ) dentro de uma Conta. Uma Conta pode ter várias Empresas. **Decidido, ainda não construído** (hoje a tela chama de "Empresa" o que é a Conta) | ainda não existe |
| **Filial** | A unidade física onde se atende e produz. Cada Empresa pode ter várias Filiais | `branch` |
| **Usuário** | Pessoa que entra no sistema com e-mail e senha | `user` |
| **Papel** | Conjunto de permissões. Papéis iniciais: recepção, atendente/medidor, produção, qualidade e gerente | `role` |
| **Escopo** | A quais Empresas e Filiais um usuário tem acesso. Usuário novo nasce **sem nenhuma Filial** até o administrador marcar | `branch scope` |
| **Comunidade** | Agrupamento de usuários que existe no código. **Congelado**: não concede permissão | `community` |
| **Administrador da plataforma** | Quem cria Contas. Por enquanto, só o André | permissão `platform.tenants.create` |

## Atendimento e produção

| Termo | Significado | No código |
|---|---|---|
| **Cliente** | Pessoa atendida. Pertence à **Conta** e pode ser atendida em qualquer Empresa ou Filial dela | `customer` |
| **Ordem de Serviço (OS)** | Documento comercial: quem é o cliente, quais peças e serviços, preço, prazo. É a "verdade" do dinheiro | `service order` |
| **Peça** | Uma peça de roupa trazida pelo cliente. Uma OS tem **até 5 peças** (limite da sacola; a regra exata está em aberto) | ainda não existe como cadastro próprio |
| **Serviço** | O que se faz numa peça (bainha, ajuste de cintura). Uma peça tem um ou mais serviços. O catálogo de serviços tem preço fixo, com ajuste manual por quem tem permissão | `service order item` (parcialmente) |
| **Ordem de Produção** | Documento **impresso** que acompanha as peças numa sacola. Traz o **QR code**, a quantidade de peças, o grau de dificuldade e a descrição dos serviços. **Nunca mostra preço** | `production order` |
| **Sacola** | Embalagem física com as peças da OS e a Ordem de Produção num bolso transparente. **Não é controlada pelo sistema** | `bag` (apenas apoio físico) |
| **Esteira** | Lugar físico onde ficam as sacolas: "a fazer" (por ordem de chegada) e "finalizadas" | não existe no sistema |
| **QR code** | Código impresso na Ordem de Produção. **Um por OS** (não por peça). O funcionário lê com o celular para mudar o status | `qr code` |
| **Grau de dificuldade** | Nota de 1 a 4 que indica a complexidade do trabalho, usada para estimar tempo médio e dimensionar a equipe | ainda não existe |
| **Técnico / técnica** | Quem produz (costureira, diarista, terceiro). Tem **login próprio** | `operational resource` / `user` |
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
| **Reprovação** | O revisor reprova a OS no controle de qualidade. Status interno. A sacola volta à esteira e a técnica que lê o QR **assume a refação** |
| **Refação** | Refazer o trabalho de uma OS reprovada, antes de entregar ao cliente |
| **Aviso "Falta pagamento"** | Alerta na tela quando há saldo em aberto. **Não é status** |

## Cliente, prazo e garantia

| Termo | Significado |
|---|---|
| **Link público** | Endereço seguro que o cliente recebe por WhatsApp. Sem login. Mostra os status públicos com datas e permite aprovar o serviço |
| **Aprovação do cliente** | **Assinatura eletrônica** de "concordo com o serviço e o preço", feita no link. **Não é status** |
| **Assinatura eletrônica** | Registro de aceite com data, hora, texto aceito e aparelho. É **evidência de aceite**, não substitui um certificado digital |
| **Retirada** | O cliente retira a peça. Informa o número da OS ou o nome, o atendente confere, lê o QR e o cliente assina eletronicamente |
| **Tipo de entrega** | **Normal**: mesmo dia da semana da semana seguinte. **Expresso**: até 2 horas por peça. **Urgente**: 2 a 3 dias depois. O sistema **sugere** a data e o atendente **pode alterar** |
| **Reconserto** | O cliente volta em até 7 dias reclamando (ficou curto ou largo). Cria-se **nova OS sem valor**, **vinculada à original**, mostrando o **técnico que fez a primeira vez** |
| **Garantia de serviço** | 90 dias por peça (descosturou, a barra se desfez), negociável no balcão, contados da conclusão da peça. **Regras exatas em aberto** |
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
| **Dado sensível** | Dado que deve ser apagado da OS quando o cliente não concorda em compartilhar o endereço. A lista exata está em aberto |
| **Isolamento por Conta** | Garantia de que uma Conta nunca vê dados de outra. Será reforçado no próprio banco de dados |
| **Responsável (menor de idade)** | Roupa infantil só com responsável cadastrado. Fotos só da peça, nunca da criança |

## Projeto

| Termo | Significado |
|---|---|
| **Ciclo** | Etapa curta de trabalho que termina em algo que o André consegue ver e testar |
| **Ambiente de testes (homologação)** | Endereço na nuvem onde o André valida cada ciclo, com dados de demonstração |
| **Piloto completo** | Entrada em produção só com financeiro, portal e concierge prontos, prevista para março de 2027, com o sistema antigo em paralelo até o André ter confiança |
| **Homologar** | Testar e aprovar. O André é o homologador de tudo |
| **MVP** | Primeira versão utilizável. Aqui, equivale ao piloto completo |
