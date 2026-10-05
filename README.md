# ANEXSYS

Plataforma SaaS multiempresa de gestão de ordens de serviço, ordem de produção com QR code, acompanhamento pelo cliente e WhatsApp. O primeiro cliente é um ateliê de costura e conserto de roupas.

## Documentação

Comece por [`docs/00-leia-primeiro.md`](docs/00-leia-primeiro.md).

| Documento | Conteúdo |
|---|---|
| [`docs/01-glossario.md`](docs/01-glossario.md) | Significado dos termos (Conta, Empresa, Filial, OS, Ordem de Produção etc.) |
| [`docs/02-decisoes-do-andre.md`](docs/02-decisoes-do-andre.md) | Regras de negócio decididas pelo dono do produto |
| [`docs/03-fluxo-de-status.md`](docs/03-fluxo-de-status.md) | O caminho da OS do balcão à retirada |
| [`docs/04-estado-atual.md`](docs/04-estado-atual.md) | O que funciona hoje |
| [`docs/05-plano-de-continuidade.md`](docs/05-plano-de-continuidade.md) | Plano em ciclos até o piloto de março de 2027 |
| [`docs/arquivo/`](docs/arquivo/LEIAME.md) | Documentação antiga, somente leitura |

## Para quem desenvolve

Os nomes no código estão em inglês. O equivalente em português de cada termo está em `docs/01-glossario.md`.

```bash
npm ci
npm --prefix frontend ci
npm run test:unit
```

Os scripts `bootstrap-local.js` e `npm run bootstrap:master-admin` exigem as variáveis de ambiente `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`. **Não há mais senha padrão.** Quem já criou o administrador mestre antes desta mudança deve executar `npm run bootstrap:master-admin` de novo, para que ele receba a nova permissão `platform.tenants.create` (necessária para criar Contas).
