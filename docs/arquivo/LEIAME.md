# Arquivo (somente leitura)

**Atualizado em:** 05/10/2026

Esta pasta guarda a documentação **antiga** do projeto, escrita em inglês técnico entre 19 e 24 de setembro de 2026. Ela foi **mantida apenas como histórico**. **Nada aqui vale como regra atual.** Quando um documento daqui disser uma coisa e os documentos de `docs/00` a `docs/05` disserem outra, **valem os de `docs/00` a `docs/05`**.

## Regras da pasta

1. **Somente leitura.** Não se altera nem se acrescenta nada aqui. Se algo daqui voltar a valer, copie para o conjunto atual, atualize, date e registre em `docs/02-decisoes-do-andre.md`.
2. **Links internos podem estar quebrados**, porque os arquivos foram movidos.
3. **Trechos com senha, e-mail e segredo de exemplo** foram trocados por marcadores como `<senha-do-administrador>`. Os valores originais eram só de teste local e **não devem ser reutilizados em nenhum ambiente**.
4. **Alguns documentos se contradizem entre si** (por exemplo, dois arquivos chamados `ARQUITETURA_V1.md` com regras opostas). Isso é parte do motivo de esta pasta ter sido arquivada.

## O que há aqui

- `especificacoes-e-baselines/`: a especificação funcional (versões V1 a V1.3), arquitetura, modelo de banco em três níveis, API, plano de servidor e de frontend, plano de sprints, baselines V1.0, V2.0 e V3.0, e o documento de migração e onboarding.
  - A **última versão da especificação** é `frozen/SRS_MASTER_V1.3.md`. Ela continua sendo **referência** de regras de negócio, mas **foi superada nos pontos em que o André decidiu de outra forma** (veja `docs/02-decisoes-do-andre.md`).
  - O arquivo `ARQUITETURA_V1.md` **fora** da pasta `frozen/` é uma versão antiga já revogada.
- `relatorios-da-raiz/`: relatórios de sprint, auditorias, relatórios de correção, guias de instalação e padrões de interface, que ficavam soltos na raiz do projeto.
  - **Os documentos de "status" daqui estão desatualizados** (alguns dizem "sem frontend" ou "sem código"). Para o estado real, use `docs/04-estado-atual.md`.

## Lugar certo para cada pergunta

| Se você quer saber | Leia |
|---|---|
| O que significa cada termo | `docs/01-glossario.md` |
| O que o André decidiu | `docs/02-decisoes-do-andre.md` |
| Como a OS anda do balcão à retirada | `docs/03-fluxo-de-status.md` |
| O que funciona hoje | `docs/04-estado-atual.md` |
| O que será construído e em que ordem | `docs/05-plano-de-continuidade.md` |
