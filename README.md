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
| [`docs/06-parecer-token-lgpd-entrega.md`](docs/06-parecer-token-lgpd-entrega.md) | Avaliação do token de retirada, da LGPD e da entrega em domicílio |
| [`docs/07-parecer-integracao-maquininha.md`](docs/07-parecer-integracao-maquininha.md) | Integração com a maquininha: pesquisa, recomendação, passo a passo e e-mails prontos |
| [`docs/arquivo/`](docs/arquivo/LEIAME.md) | Documentação antiga, somente leitura |

## Como rodar na sua máquina

Os nomes no código estão em inglês. O equivalente em português de cada termo está em `docs/01-glossario.md`.

**A conta na nuvem e o domínio `atelierizagusmao.com.br` são do André.** Este guia só cobre o ambiente local (computador de quem desenvolve).

### 1. Pré-requisitos

- Node.js 22
- PostgreSQL 16 (Docker ou instalação local)
- Copie `.env.example` para `.env` e preencha `DB_PASSWORD`, `JWT_SECRET`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`. **Não há senha padrão.**

### 2. Primeira vez

Com Docker:

```bash
cp .env.example .env
# edite o .env
export BOOTSTRAP_ADMIN_EMAIL='seu-email@local'
export BOOTSTRAP_ADMIN_PASSWORD='uma-senha-forte'
bash scripts/dev-setup.sh
```

Sem Docker: instale o PostgreSQL, crie o banco `anexsys`, defina as mesmas variáveis e rode `bash scripts/dev-setup.sh`.

O `npm run build` do servidor usa `tsc` (não o `nest build`, que quebra neste Node). `npm run start:dev` sobe o servidor em modo observação.

Quem já tinha administrador mestre de antes precisa rodar `npm run bootstrap:master-admin` de novo, para ele receber a permissão `platform.tenants.create` (criar Contas).

### 3. No dia a dia

Em dois terminais:

```bash
npm run start:dev
npm run frontend:dev
```

A tela abre em `http://127.0.0.1:3001`. O servidor responde em `http://127.0.0.1:3000`. Entre com o e-mail e a senha definidos no bootstrap.

Ajuste `frontend/.env.local` a partir de `frontend/.env.example` (`BACKEND_ORIGIN=http://127.0.0.1:3000`).

## Homologação gratuita (Render + Neon)

Não usa `atelierizagusmao.com.br` nem `anexsys.com.br`. Um serviço web gratuito no Render e um PostgreSQL gratuito no Neon.

Arquivos: `render.yaml`, `Dockerfile`, `scripts/start-web.cjs`. A branch a publicar é `cursor/homologacao-gratuita-a1bd` (inclui o Ciclo 1 / PR #9).

No Render, escolha o plano **Free**, cole a `DATABASE_URL` **direta** do Neon (host **sem** `-pooler`) e as variáveis `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`. O primeiro acesso pode demorar cerca de um minuto (o site dorme após ~15 min sem uso).

### 4. Testes

```bash
npm run test:unit
npm run test:integration
```

Os testes de integração criam bancos PostgreSQL temporários (`anexsys_sprint*_integration`). O PostgreSQL precisa estar no ar.

O atalho `bootstrap-local.js` também exige `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`. Sem essas variáveis, o script para e explica o que falta.
