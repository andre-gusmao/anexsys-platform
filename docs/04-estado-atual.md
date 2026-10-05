# Estado atual do ANEXSYS

**Atualizado em:** 05/10/2026
**Substitui:** `PROJECT_IMPLEMENTATION_STATUS`, `CURRENT_APPLICATION_STATUS`, `CURRENT_REPOSITORY_STATUS`, `REPOSITORY_CODE_AUDIT_V1` e os relatórios de sprint (todos em `docs/arquivo/`), que se contradizem.

**Como ler:** cada item diz se algo foi **demonstrado numa tela**, **testado com banco de dados** e **aceito pelo André**. Hoje **nada foi aceito formalmente** pelo André como pronto; essa coluna começa vazia.

## 1. O que existe

| Área | Servidor | Tela | Testes | Observação |
|---|---|---|---|---|
| Login e acesso (Conta, Filial, usuários, papéis, permissões) | Existe | Existe: login, escolha de Empresa (na verdade, Conta) e Filial, administração | Unitários passam; integração com falhas (ver seção 3) | Criação de Conta **fechada ao público neste ciclo**. Limite de tentativas de login **adicionado** |
| Clientes e medidas | Existe | Existe | Unitários passam | WhatsApp obrigatório; sem consentimento ainda |
| Ordem de Serviço (lista, formulário, vários itens, detalhe) | Existe | Existe | Unitários passam | Itens ainda são texto livre. Faltam aprovar, cancelar, recalcular prazo e gerar produção na tela |
| Motor de data de entrega | Existe (domingo fechado por padrão) | Parcial | Unitários passam | Falta Normal/Expresso/Urgente |
| Ordem de Produção, QR por ordem, diário | Existe | **Não existe** | Unitários passam; integração com falhas | Só 6 estados fixos. QR com código previsível em parte |
| Qualidade, retrabalho, garantia | Existe | **Não existe** | Unitários passam; integração com falhas | |
| Financeiro | Existe | **Não existe** | Idem | Maquininha só como interface, sem integração real |
| Fiscal | Só esqueleto | **Não existe** | Idem | Nenhum adaptador real |
| Retirada por terceiros e custódia | Existe | **Não existe** | Idem | Aviso "enviado" é só um registro, não envio |
| Concierge e portal do cliente | Existe | **Não existe** | Idem | Link de aprovação exige login, que o cliente não tem |
| **WhatsApp** | **Não existe** | **Não existe** | n/a | Só há o campo de telefone. Registros marcados como "enviado" **não foram enviados** |
| Migração/importação de dados | **Não existe** | **Não existe** | n/a | |
| LGPD (consentimento, retenção) | **Não existe** | **Não existe** | n/a | |
| Cobrança do ANEXSYS | **Não existe** | **Não existe** | n/a | |

## 2. Números verificados em 05/10/2026

- **19 módulos** no servidor e **17 migrações** de banco.
- **Testes unitários:** **104 passam, 0 falham.** (Eram 94 antes deste ciclo; foram acrescentados 10 sobre o limite de tentativas de login e a proteção da criação de Conta.)
- **Compilação do servidor e do frontend:** sem erros.
- **Verificação de qualidade do frontend (lint):** **2 erros que já existiam** antes deste ciclo, em `customer-workspace.tsx` e `service-orders-workspace.tsx` (aviso de boa prática de programação; não impedem o uso).

## 3. Testes de integração com banco de dados

Estes testes sobem o servidor com um banco PostgreSQL real. Foram executados pela primeira vez de ponta a ponta neste ciclo.

- **Resultado:** **15 dos 39 casos passam.** As suítes das sprints 2, 3, 4, 5, 6, 7, 8, 9 e 10 e a de identidade SaaS têm falhas. Só a suíte da Sprint 1 passa por inteiro.
- **O resultado é idêntico antes e depois das mudanças deste ciclo**, ou seja, as falhas **já existiam**.
- **Causa provável (conferida em uma suíte):** o cadastro de cliente passou a exigir mais campos (por exemplo, CEP) depois das refatorações de 22 e 23 de setembro, e os testes antigos montam os dados de preparação sem esses campos. É um problema dos **testes desatualizados**, não necessariamente do sistema. Precisa ser confirmado e corrigido.
- **Consequência:** as afirmações "testes de integração passaram" dos relatórios de sprint antigos **não valem mais** para o código atual. Corrigir essas suítes é tarefa do próximo trabalho, antes de qualquer afirmação de "pronto".

## 4. Falhas de segurança conhecidas

| Falha | Situação |
|---|---|
| Criação pública de Conta (`POST /tenants`) | **Corrigida neste ciclo**: exige a permissão `platform.tenants.create` |
| Senhas, e-mails e segredos de exemplo nos guias e scripts | **Corrigido neste ciclo**: scripts exigem variáveis de ambiente; guias antigos foram higienizados |
| Sem limite de tentativas de login | **Corrigido neste ciclo**, em memória (vale por instância do servidor) |
| Sessão guardada em `localStorage` do navegador | Aberta. Será trocada por cookie seguro |
| Sem recuperação de senha; convite devolve o token em vez de enviar por e-mail | Aberta. Depende do provedor de e-mail |
| Isolamento entre Contas só por filtro no código | Aberta. Será reforçado no banco (Ciclo 1) |
| QR com código previsível em parte e guardado em texto claro | Aberta. Será assinado (Ciclo 3) |
| Registro "enviado" sem envio | Aberta. Será resolvido com o WhatsApp real (Ciclo 5) |

## 5. O que muda neste ciclo (Ciclo 0)

Este documento e os de `00` a `03` são resultado do Ciclo 0. Ver `05-plano-de-continuidade.md` para os próximos ciclos.
