# Leia primeiro

**Atualizado em:** 05/10/2026
**Substitui:** o conjunto de documentos antigo, agora em `docs/arquivo/`.

## O que é o ANEXSYS

O ANEXSYS é uma plataforma de gestão de **ordens de serviço** para prestadores de serviço. O primeiro cliente é um **ateliê de costura e conserto de roupas**. A ideia é, no futuro, adaptar o produto a outros tipos de negócio.

O sistema cobre: atendimento e **ordem de serviço (OS)**, **ordem de produção** impressa com **QR code**, controle das **fases (status)** da produção, **WhatsApp** para o cliente, **assinatura eletrônica**, financeiro e acompanhamento de produtividade.

## Como este conjunto de documentos funciona

| Arquivo | Para que serve |
|---|---|
| `00-leia-primeiro.md` | Este guia |
| `01-glossario.md` | O significado de cada termo, inclusive o equivalente no código (que está em inglês) |
| `02-decisoes-do-andre.md` | Tudo que o dono do produto decidiu, e o que ainda está em aberto |
| `03-fluxo-de-status.md` | O caminho da OS do balcão à retirada, com os status e as regras |
| `04-estado-atual.md` | O que funciona hoje, com data e evidência |
| `05-plano-de-continuidade.md` | O plano em ciclos curtos até o piloto em março de 2027 |
| `arquivo/` | Documentação antiga, **somente leitura**. Veja `arquivo/LEIAME.md` |

## Regras para manter este conjunto confiável

1. **Português do Brasil.** Termos técnicos só quando inevitáveis, sempre explicados no glossário.
2. **Todo documento tem data** no topo e diz o que **substitui**.
3. **Fonte oficial das regras de negócio:** `02-decisoes-do-andre.md`. Quando outro documento discordar dele, vale o `02`.
4. **Todo ciclo de trabalho termina atualizando** `02`, `03` e `04`. Um ciclo não fecha sem isso.
5. **Nada de "percentual pronto" sem critério.** Para dizer que algo está pronto, use as três perguntas: foi **demonstrado** numa tela? foi **testado com banco de dados**? foi **aceito pelo André por escrito**?
6. **Documentos antigos não são editados.** Se algo voltar a valer, copia-se para o conjunto atual, com data.

## Como o André valida cada ciclo (resumo)

1. Recebe um **link do ambiente de testes**, um **roteiro de validação** passo a passo e um **vídeo curto**.
2. Marca cada passo como **verde** (fez o que o roteiro diz), **amarelo** (fez, mas está confuso, feio ou lento) ou **vermelho** (não fez ou quebrou).
3. **Qualquer vermelho reprova o ciclo.** Amarelos viram ajustes do ciclo seguinte.
4. Os detalhes estão em `05-plano-de-continuidade.md`.

## Situação em uma frase

O servidor é grande e bem testado em partes, mas o que o usuário vê numa tela é pequeno: login, cadastros, clientes com medidas e uma tela de ordens de serviço. Produção por QR, WhatsApp, assinatura, financeiro e dashboard ainda não têm tela. Detalhes em `04-estado-atual.md`.
