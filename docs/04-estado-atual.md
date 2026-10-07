# Estado atual do ANEXSYS

**Atualizado em:** 07/10/2026
**Substitui:** `PROJECT_IMPLEMENTATION_STATUS`, `CURRENT_APPLICATION_STATUS`, `CURRENT_REPOSITORY_STATUS`, `REPOSITORY_CODE_AUDIT_V1` e os relatórios de sprint (todos em `docs/arquivo/`), que se contradizem.

**Como ler:** cada item diz se algo foi **demonstrado numa tela**, **testado com banco de dados** e **aceito pelo André**. Hoje **nada foi aceito formalmente** pelo André como pronto; essa coluna começa vazia.

## 1. O que existe

| Área | Servidor | Tela | Testes | Observação |
|---|---|---|---|---|
| Login e acesso (Conta, Empresa, Filial, usuários, papéis, permissões) | Existe | Existe: login, escolha de Conta e Filial, **Contas / Empresas / Filiais**, horário da Filial, comunidades congeladas | Unitários passam; integração **43/43** (39 do Ciclo 0 + 4 do espelho no Ciclo 1) | Só o André cria Contas. Usuário novo sem Filial. Isolamento no banco (D2) |
| Clientes e medidas | Existe | Existe | Unitários e integração passam | WhatsApp obrigatório; endereço (incluindo CEP) obrigatório no cadastro; sem consentimento ainda |
| Ordem de Serviço (lista, formulário, vários itens, detalhe) | Existe | Existe | Unitários e integração passam | Formulário compacto: **Cliente** primeiro; bloco da OS em caixas (identificação, previsão, responsáveis). Sem Empresa/Filial na ficha. **Status**, Entrada e Saída na mesma linha. Bloco **Pagamento** com condição, já pago e em aberto. Marca obrigatória; modelo e série opcionais. Valor/desconto no formato de dinheiro. **Salvar** aberto = rascunho; fechado = imprime OP. **Abrir nova versão** só na grade. Até o QR, passos provisórios na OS: Pegar sacola → Terminei → Abrir revisão. Faltam aprovar e recalcular prazo na tela |
| Motor de data de entrega | Existe (domingo fechado por padrão) | Parcial | Unitários passam | Falta Normal/Expresso/Urgente |
| Ordem de Produção, QR por ordem, diário | Existe | Impressão A5 a partir da OS | Unitários passam | Papel A5: placa no cabeçalho e no QR; tabela Produto / Serviço / Serviço a realizar; marca/modelo/série pequenos; previsão enorme na prateleira; Pago ou Pagar na retirada. Sem preço e sem quantidade. Tela de OP ainda não existe |
| Qualidade, retrabalho, garantia | Existe | Tela **Controle de qualidade** | Unitários passam | Botão **Revisar**. Reimpressão da OP no **⋮** de cada linha, no padrão da OS. Lista traz OP com sacola fechada para homologar (o recorte por status Em qualidade fica para o QR). Revisão peça a peça; OS permanece em qualidade se houver reprovação; OP de refação só com as peças reprovadas. Garantia ainda não |
| Financeiro | Existe | **Não existe** | Idem | Maquininha só como interface, sem integração real |
| Fiscal | Só esqueleto | **Não existe** | Idem | Nenhum adaptador real |
| Retirada por terceiros e custódia | Existe | **Não existe** | Idem | Aviso "enviado" é só um registro, não envio |
| Concierge e portal do cliente | Existe | **Não existe** | Idem | Link de aprovação exige login, que o cliente não tem |
| **WhatsApp** | **Não existe** | **Não existe** | n/a | Só há o campo de telefone. Registros marcados como "enviado" **não foram enviados** |
| Migração/importação de dados | **Não existe** | **Não existe** | n/a | |
| LGPD (consentimento, retenção) | **Não existe** | **Não existe** | n/a | |
| Cobrança do ANEXSYS | **Não existe** | **Não existe** | n/a | |

## 2. Números verificados em 05/10/2026 (noite, fechamento dos Ciclos 0 e 1)

- **20 módulos** no servidor e **18 migrações** de banco.
- **Testes unitários:** **110 passam, 0 falham.**
- **Testes de integração com PostgreSQL:** **43 passam, 0 falham** (39 do Ciclo 0 + 4 do teste do espelho / multiempresa).
- **Compilação do servidor:** `tsc` + `tsc-alias` (o `nest build` quebra neste Node; o atalho `npm run build` usa o caminho que funciona).
- **Verificação de qualidade do frontend (lint):** **2 erros que já existiam** antes deste ciclo, em `customer-workspace.tsx` e `service-orders-workspace.tsx` (aviso de boa prática de programação; não impedem o uso).

## 3. Testes de integração com banco de dados

Estes testes sobem o servidor com um banco PostgreSQL real.

- **Resultado:** **43 dos 43 casos passam** (39 do Ciclo 0 + 4 do Ciclo 1: horário da Filial, teste do espelho, comunidades congeladas / usuário sem Filial, horário editável e relatório de isolamento).
- **O que estava quebrado no Ciclo 0:** o cadastro de cliente passou a exigir endereço completo (incluindo CEP) e o preparo dos testes antigos não enviava esses campos. A suíte da Sprint 2 também recusava duas medidas na mesma unidade (CM) por um erro de conferência de IDs repetidos — a regra ("unidade tem que existir na Conta") foi mantida; a conferência agora trata IDs repetidos. A suíte da Sprint 10 usava data de retirada de setembro, fora da janela de 7 dias da garantia em outubro; o teste passou a usar a data de hoje, **sem** alargar os 7 dias. A suíte de identidade escolhia a Conta errada porque o login, sem preferência, ordena pelo nome: o nome de exibição da segunda Conta foi ajustado no teste para "Unidade Filial", para a "Matriz" continuar sendo a primeira.
- **Como rodar:** PostgreSQL no ar (`DB_PASSWORD=postgres` por padrão nos testes) e `npm run test:integration`. O `README.md` descreve o ambiente local. **A conta na nuvem continua com o André.**

## 4. Falhas de segurança conhecidas

| Falha | Situação |
|---|---|
| Criação pública de Conta (`POST /tenants`) | **Corrigida neste ciclo**: exige a permissão `platform.tenants.create` |
| Senhas, e-mails e segredos de exemplo nos guias e scripts | **Corrigido neste ciclo**: scripts exigem variáveis de ambiente; guias antigos foram higienizados |
| Sem limite de tentativas de login | **Corrigido neste ciclo**, em memória (vale por instância do servidor) |
| Sessão guardada em `localStorage` do navegador | Aberta. Será trocada por cookie seguro |
| Sem recuperação de senha; convite devolve o token em vez de enviar por e-mail | Aberta. Depende do provedor de e-mail |
| Isolamento entre Contas só por filtro no código | **Reforçado no Ciclo 1**: porteiro no banco (RLS) + relatório de isolamento |
| QR com código previsível em parte e guardado em texto claro | Aberta. Será assinado (Ciclo 3) |
| Registro "enviado" sem envio | Aberta. Será resolvido com o WhatsApp real (Ciclo 5) |

## 5. O que muda neste ciclo (Ciclos 0 e 1)

O Ciclo 0 fechou documentação única, segurança rápida, testes de integração e o README de como rodar na máquina. **O Ciclo 1** acrescenta Conta / Empresa / Filial padrão, horário e corte configuráveis, isolamento no banco e permissão só de papel + escopo. **Continua com o André:** conta na nuvem (até R$ 150/mês), DNS de `atelierizagusmao.com.br`, Meta e Cielo. Ver `05-plano-de-continuidade.md` para os próximos ciclos.
