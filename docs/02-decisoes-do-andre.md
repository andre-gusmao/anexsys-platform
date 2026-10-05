# Decisões do André

**Atualizado em:** 05/10/2026
**Substitui:** as regras de negócio da documentação antiga (`docs/arquivo/`) nos pontos em que elas divergem deste documento.
**Valor:** este é o documento **oficial** das regras de negócio. Quando outro documento discordar, vale este.

Fonte: respostas do André ao questionário, em 05/10/2026. Onde a resposta é "?" ou ausente vale a opção recomendada, marcada como "assumido, a confirmar". Os itens marcados com **[EM ABERTO]** contradizem outra resposta ou o plano e aguardam as perguntas complementares.

Os números citados em "resposta N" ou "pergunta N" nas seções 1 a 8 referem-se ao questionário respondido em 05/10/2026, que não faz parte deste conjunto. Já os números da seção 9 em diante ("perguntas complementares") referem-se ao documento de perguntas complementares do mesmo dia.

## 1. Decisões gerais

| # | Decisão |
|---|---------|
| 1 | Ambiente de testes: serviço em nuvem simples e barato, montado por nós (A). |
| 2 | Idioma: tudo em português do Brasil (A). |
| 3 | Fonte oficial: conjunto novo e único de documentos em português; antigos para pasta de arquivo somente leitura (A). |
| 4 | Não há dado real a preservar; tudo é teste (A). |
| 5 | Nomes dos níveis: Conta / Empresa / Filial (A). |
| 6 | Uma Conta pode ter várias Empresas e cada Empresa várias Filiais (A). |
| 7 | Cliente é da Conta e pode ser atendido em qualquer Empresa ou Filial dela (A). Entre Contas nunca compartilha. |
| 8 | Permissão vem só de papel + escopo (Empresa/Filial). Comunidades congeladas (A). |
| 13 | Piloto completo (B): só entra em produção com financeiro, portal e concierge prontos. Ele é o homologador de tudo e não tem pressa de ajustes. |
| 14 | Produção em março de 2027; dedicação de 4 a 8 horas por dia, bem intenso. |
| 17 | Usuário novo sem nenhuma Filial até o administrador marcar (A). |
| 18 | Papéis iniciais: recepção, atendente/medidor, produção, qualidade, gerente (A). |
| 19 | Só o André cria Contas por ora (A). |
| 20 | Login por e-mail e senha com recuperação por e-mail (A). |
| 21 | Senhas dos guias são só de teste (A). |
| 24 | Peça = uma peça de roupa, com um ou mais serviços dentro (A). |
| 25 | Tabela de serviços com preço fixo e ajuste manual por quem tem permissão (A). |
| 29 | Medida usada fica travada na aprovação da OS (A). |
| 33 | Cliente vê a última fase pública atingida; fases configuráveis por Conta (A, A). |
| 34 | Modo estação: o funcionário escolhe onde está e cada leitura move a peça (B). **[EM ABERTO]** com o fluxo descrito na pergunta 9, em que cada leitura avança sozinha para o próximo status. |
| 40 | Um número de WhatsApp por Conta (A). |
| 42 | Só envia com consentimento registrado (A). Se o cliente não autorizar compartilhar o endereço, ele marca que não concorda e os dados sensíveis são apagados da OS. |
| 44 | Falha de mensagem: lista de falhas para o atendente (A). |
| 46 | Roupa infantil só com responsável cadastrado; fotos só da peça, nunca da criança. |
| 47 | Ateliê é o controlador e o ANEXSYS o operador (A); guarda de inativos 5 anos (A). Controle de LGPD fica para mais adiante, mas é importante. |
| 48 | Retirada: cliente informa número da OS ou nome e o atendente confere (A). Próxima versão: token enviado por WhatsApp para retirada por terceiros (portador informa número da OS e token). |
| 50 | Saldo em aberto bloqueia a entrega, mas o gerente libera com motivo (B). |
| 51 | Fila de chegada fica para depois (B). |
| 52 | Concierge e reconhecimento facial ficam para versão futura. Ideia: câmera identifica cliente, monta fila por ordem de chegada, abre a porta para cliente conhecido; foto apagada após cadastro ou guardada fora do sistema. |
| 54 | Sistema antigo em paralelo até o André ter confiança (A). |
| 56 | Cobrança do ANEXSYS: quer painel de preços e planos, pagamento mensal por cartão online, pix ou boleto, preço configurável, à vista ou parcelado, contrato de um ano; sem regras rígidas no começo (B). |
| 57 | Segundo tipo de negócio só depois do piloto do ateliê (A). |

## 2. Fluxo de produção descrito pelo André (resposta 9)

1. **Atendimento / OS aberta**: gera a OS; não gera etiqueta nem leitura de QR. A OS é enviada ao cliente por WhatsApp com status **Em aberto (público)**. O cliente recebe um link para acompanhar e para aprovar.
2. **Medição das roupas**: não gera etiqueta, não lê QR, sem WhatsApp. É a etapa que origina a abertura da OS.
3. **Aprovação do cliente**: o status continua Em aberto; a aprovação não é status, é uma **assinatura "concordo com o serviço e preço"**, registrada por escrito.
4. **Sacola física**: após a OS, as peças vão para uma sacola física, sem controle sistêmico, com **limite de até 5 peças por OS** e um bolso transparente com a **Ordem de Produção impressa e um QR code**. A sacola vai para a esteira de "a fazer", por ordem de chegada. Quando o técnico pega a sacola e lê o QR, o status vai para **Em produção (público)** com data, hora e técnico registrados, para controle de produtividade.
5. Não existe essa etapa (numeração do André).
6. **Acabamento/passadoria**: ao terminar, o técnico lê o QR, leva a sacola para a esteira de finalizadas e o status vai para **Aguardando controle de qualidade (público)**.
7. **Revisão de qualidade**: o revisor tira a sacola da esteira, lê o QR e o status vai para **Controle de qualidade (público)**. Aprova (vai para Pronto para retirada) ou reprova.
8. **Pronto para retirada (público)**: aqui sai a mensagem de WhatsApp. O cliente usa o mesmo link para acompanhar quando quiser, sem o sistema avisar a cada etapa.
9. **Entregue**: lê o QR na retirada, o cliente assina eletronicamente que retirou. Status **Retirado pelo cliente (público)**.

**Resumo das mensagens:** o cliente recebe WhatsApp em apenas duas etapas: registro da OS e Pronto para retirada. Todo o resto ele acompanha pelo link.

### Observações do André
- a) O único status não público é **Reprovado pela qualidade (interno)**: a qualidade lê o QR e muda para Reprovado; só funcionários sabem; a sacola volta para a esteira para refação.
- b) Na entrega, se a OS não estiver paga, mostrar aviso na tela "Falta pagamento". **Não é status**, é só uma questão financeira.
- c) Deve haver **cadastro de status com parâmetros**, configurável, sem engessar o sistema.
- d) **Reconserto**: cliente volta em até 7 dias úteis reclamando (ficou curto ou largo); analisa-se e registra-se **nova OS sem valor financeiro**, vinculada à OS original (rastreabilidade), e é preciso saber **qual técnico fez a primeira vez** para medir eficiência.

### Regras de operação (perguntas 15, 31, 32, 35)
- Cada funcionário tem o leitor de QR no celular, cadastrado, e muda o status seguindo uma **ordem sem pular nem retroagir** (resposta 32: C, fluxo rígido). A reprovação é o único retorno previsto.
- **Quem faz o quê:** costureiras (técnicas) fazem a produção; atendentes fazem medição, revisão e controle de qualidade. Só o papel responsável pela fase avança (resposta 31: B).
- Reprovado: volta para a mesma técnica, se estiver escalada no dia, ou para outra; ao ler o QR a outra técnica **assume a refação**.
- Quando a peça é produzida em tempo diferente, o André controla por **quantidade de peças da OS** (para dimensionar a grade de costureiros e contratar) e por **grau de dificuldade 1, 2, 3, 4** (para definir tempo médio).
- **Diaristas/terceiros (35 C)**: hoje se identificam anotando dia e hora na OS e em caderno. Querem log próprio (login) como **diário de bordo**, para saber o que produziram e para um **bônus por produtividade**. O diário de bordo deve mostrar a **descrição do serviço** de cada peça, como alternativa ao papel.

### Controle da unidade (pergunta 10)
- **QR por OS** (resposta B), não por peça. Motivo: a costureira não compartilha o serviço; abre uma sacola e termina ela. Mas o sistema deve registrar a **quantidade de peças da OS** para o controle de produção e o **grau de dificuldade (1 a 4)**.
- Isso **contraria a recomendação do plano**, que propunha QR assinado por peça.

### Etiquetas (perguntas 36, 38, 39)
- **Não haverá etiqueta adesiva.** O QR é impresso **grande na Ordem de Produção**, que fica no bolso da sacola (resposta 39: B, sacola).
- Não precisa de impressora de etiqueta; basta impressão comum.
- Celulares: parte dos funcionários tem, parte usa o da loja; sistema misto (Android e iPhone).
- Wi-Fi bom e estável em todo o ateliê (37: A), então o modo offline não é prioridade.
- Perda ou ilegibilidade: reimpressão pelo gerente (38: B), mas o André repete que não há etiqueta.

## 3. Prazos, garantia e fluxos de entrega

- **Prazo Normal**: entrega no **mesmo dia da semana da semana seguinte** (segunda para segunda, terça para terça, etc., inclusive sábado). Em feriado, antecipa ou adia. O sistema **sugere a data** pela regra, e o atendente pode **alterar**.
- Feriados fechados, cadastrados por Filial (a). Horário de corte (b): A (sim, depois de certa hora; horário não informado). Tipos de entrega (c): A, diferentes. Prazo padrão (d): 7.
- **Tipos de entrega**: Normal (mesmo dia da semana seguinte); **Expresso** (até 2 horas por peça); **Urgente** (2 a 3 dias depois, foge da regra do mesmo dia da semana).
- **Garantia**: 7 dias para reparos (cliente que não provou na hora da retirada pode voltar para refação, como reconserto, contados em dias úteis no texto das observações e "corridos" na resposta 27b). **Garantia de serviço por peça: 90 dias** (descosturou, barra se desfez), negociável no balcão; conta a partir da conclusão da peça (27 c: C).
- Fotos: opcionais, no máximo 3 por peça, uso pouco frequente (28: B).

## 4. Clientes e atendimento

- Cadastro: nome completo obrigatório, **WhatsApp** obrigatório, endereço pela busca do CEP; CPF/CNPJ não obrigatório.
- Busca de cliente **multicritério** em uma só tela: nome, telefone, CPF ou CNPJ.
- Ficha de medidas: não existe hoje; o André estava criando um modelo em lista (linha: Ombro, medida, unidade).

## 5. WhatsApp, e-mail, pagamento

- **WhatsApp (11)**: respondeu A e B (API oficial da Meta ou intermediário). Precisa de um **cadastro de Empresa com as configurações necessárias**. Hoje usa WhatsApp Business com número Vivo, compartilhado via **WhatsApp Web**, sem pagar por mensagem. **[EM ABERTO]** Respostas 41, 44 e 45 descrevem o uso atual por WhatsApp Web no celular, e a 45 quer responder pelo celular. Isso é diferente de uma API oficial com custo por mensagem. Precisa decidir o caminho.
- Quem paga a mensagem (41): não decidido (C).
- Mensagem: **configurável na plataforma**. Modelo: "Olá, [nome do cliente], aqui é do [nome do estabelecimento], você está recebendo a sua ordem de serviço digital, acompanhe o status de produção, mas fique tranquila que por este canal avisaremos quando estiver pronto, entre agora para aprovar o que ficou combinado."
- Respostas do cliente (45): quer que a conversa fique no celular dele (WhatsApp Web); **não precisa de logs de conversa no sistema**; as aprovações ficam na OS.
- **E-mail (12)**: respondeu B e A; domínio **anexsys.com.br** já registrado.
- **Pagamento (49)**: respondeu **C, integração com maquininha**; hoje usa Cielo, aceita Stone ou Rede (Itaú). **[EM ABERTO]** O plano previa registro manual no piloto. Como o piloto escolhido é completo, a integração pode entrar, mas é trabalho grande e depende de contrato.

## 6. Acompanhamento e indicadores

- **Dashboard de produtividade** na tela do sistema (por técnico e por quantidade de peças da OS) e **alertas de atraso** antes que a entrega atrase, com parâmetros configuráveis.
- Validação: quer receber pelo próprio sistema o painel e os alertas, não só link e roteiro.

## 7. Dados do sistema atual (55)
- Importação (C): o sistema atual gera tudo em Excel; ele pensa em importar histórico completo, **depois da validação**.

## 8. Prints (Parte 3)
- Ficha de medidas: não existe; há um modelo em lista em construção no sistema.
- Mensagem de WhatsApp: não tem agora.
- Retirada: ele assina a OS na caneta; sem exemplo.
- Demais prints ainda não enviados.

## 9. Pontos em aberto (aguardam as perguntas complementares)

1. **QR por OS versus plano por peça**: o plano propunha QR assinado por peça; o André escolheu QR por OS (Ordem de Produção na sacola), mantendo a quantidade de peças e o grau de dificuldade como dado.
2. **Modo estação (34 B) versus fluxo de status automático**: no fluxo descrito, cada leitura avança o status sozinha conforme o papel; no modo estação o funcionário escolhe a fase.
3. **WhatsApp**: API oficial/BSP (pergunta 11) versus WhatsApp Web no celular, sem custo e sem logs (41, 44, 45).
4. **Piloto completo e maquininha** versus plano de piloto fino com pagamento manual.
5. **Garantia**: 7 dias (reconserto) versus 90 dias (serviço), dias úteis versus corridos.
6. **Status públicos**: o André quer vários status públicos, mas só duas mensagens ativas; o link de acompanhamento mostra o resto.
7. **Reprovação**: único retorno de fase permitido; precisa ficar explícito, pois a resposta 32 é "fluxo rígido".
8. **Sobre a sequência de status**: o André numerou as etapas pulando a 5 e juntando acabamento e passadoria com a produção.

### Correspondência com as perguntas complementares

| Ponto em aberto | Pergunta complementar |
|---|---|
| 1. QR por OS versus por peça (a decisão do André vale: QR por OS) | Resolvido; só falta a regra do limite de 5 peças (pergunta 7) e da dificuldade (pergunta 8) |
| 2. Modo estação versus avanço automático | Pergunta 6 |
| 3. API oficial versus WhatsApp Web | Perguntas 1 e 2 |
| 4. Piloto completo e maquininha | Pergunta 11 (modelo de integração com a Cielo) |
| 5. Garantia: 7 dias, 90 dias, úteis ou corridos | Pergunta 10 |
| 6. Status públicos e só duas mensagens | Resolvido: o link público mostra o resto |
| 7. Reprovação como único retorno | Pergunta 5 (se volta para "Em produção" ou para um status "Em refação") |
| 8. Sequência de status (etapa 5 inexistente) | Pergunta 5 |

Outros pontos que ainda dependem de resposta: concierge e portal no piloto completo (pergunta 15), aprovação e assinatura (perguntas 12 e 13), dados a apagar (pergunta 14), nuvem e domínio (pergunta 3), estrutura real do ateliê (pergunta 4), regras de prazo (pergunta 9).
