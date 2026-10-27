# Funcionalidades da Bancada

Catálogo completo do que o sistema faz, organizado pelo caminho de um equipamento: **entrada → diagnóstico → orçamento → reparo e teste → entrega → pós-venda**. Cada item indica quem usa: **Adm** (administrador), **Atd** (atendente), **Téc** (técnico) e **Cli** (cliente). Para instalar e operar, veja o [README](README.md); para o passo a passo de uso, o [GUIA-ASIC.md](GUIA-ASIC.md).

## Sumário

1. [Entrada do equipamento](#1-entrada-do-equipamento)
2. [Rastreabilidade](#2-rastreabilidade)
3. [Lotes de fazendas](#3-lotes-de-fazendas)
4. [Diagnóstico](#4-diagnóstico)
5. [Orçamento e tabela de preços](#5-orçamento-e-tabela-de-preços)
6. [Testes e firmware](#6-testes-e-firmware)
7. [Peças, sucata e viabilidade](#7-peças-sucata-e-viabilidade)
8. [Entrega, retorno e garantia](#8-entrega-retorno-e-garantia)
9. [Contratos e campo](#9-contratos-e-campo)
10. [Comunicação com o cliente](#10-comunicação-com-o-cliente)
11. [Conhecimento e indicadores](#11-conhecimento-e-indicadores)
12. [Acesso, perfis e auditoria](#12-acesso-perfis-e-auditoria)
13. [Documentos e exportação](#13-documentos-e-exportação)
14. [Vendas de máquinas e peças](#14-vendas-de-máquinas-e-peças)

## 1. Entrada do equipamento

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Nova OS a partir de um equipamento** | Adm, Atd | Toda OS nasce ligada a um equipamento ASIC (mineradora, hashboard, fonte ou controladora). Não existe OS solta. |
| **Cliente na hora (+ Novo)** | Adm, Atd | Cadastra o cliente dentro da própria tela da OS, sem sair do fluxo. |
| **Série obrigatória** | Adm, Atd, Téc | Recusa valores falsos ("sem", "n/a", "0000"…). Se a etiqueta estiver apagada, a opção **Ilegível** gera um identificador único. Correção posterior exige motivo e fica na auditoria. |
| **Fotos no check-in** | Adm, Atd, Téc | Várias fotos de uma vez (câmera ou galeria), reduzidas no aparelho antes do envio. |
| **Estado de entrega** | Adm, Atd | *Máquina completa* ou *faltando itens*, com lista marcável (hashboard, fonte, controladora, ventoinha, cabos, carcaça, dissipadores, parafusos e outros). Visível ao cliente. |
| **Defeito relatado e prioridade** | Adm, Atd | Registra o que o cliente informou e a urgência, que pode vir do contrato. |

## 2. Rastreabilidade

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **QR Code e etiqueta** | Adm, Atd, Téc | Gera o QR e a etiqueta de cada equipamento localmente, sem serviço externo. |
| **Composição da mineradora** | Adm, Atd, Téc | Lista hashboards, fonte e controladora que formam a máquina. |
| **Transferência de componentes** | Adm, Atd | Move uma peça entre mineradoras do **mesmo cliente**, com responsável e histórico. |
| **Linha do tempo do equipamento** | Adm, Atd, Téc | Cada evento (entrada, teste, troca, entrega) fica registrado com data e autor. |

## 3. Lotes de fazendas

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Recebimento por remessa** | Adm, Atd | Registra a chegada de vários equipamentos de uma vez e confere item a item. |
| **Uma OS por equipamento** | Adm, Atd | Gera as OS individuais a partir do lote, mantendo o vínculo com a remessa. |
| **Devolução parcial ou total** | Adm, Atd | Devolve o que ficou pronto sem esperar o lote inteiro. |
| **Embalagem e transporte** | Adm, Atd | Fotos da embalagem, transportadora, código de rastreio e comprovante de entrega. |

## 4. Diagnóstico

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Roteiro por modelo** | Adm, Téc | Roteiros versionados por **modelo e revisão exatos**, para o técnico seguir o procedimento certo. |
| **Checklist guiado** | Téc | Passos marcáveis, com resultado registrado na OS. |
| **Mapa de defeitos** | Téc | Marca o defeito por coordenadas na hashboard, para estatística de falhas por ponto. |

## 5. Orçamento e tabela de preços

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Tabela de preços** | Adm (ou quem tiver a permissão) | Serviços e peças com preço, custo, garantia e modelos atendidos. |
| **Item escolhido, preço do servidor** | Téc, Atd | O técnico escolhe o item da tabela; **o preço vem do servidor, nunca do campo digitado**. Item fora da tabela fica marcado para conferência. |
| **Orçamento por componente** | Téc, Atd | Cada peça ou serviço é uma linha, com decisão própria. |
| **Decisão do cliente** | Cli, Atd | Aprovar ou recusar cada componente, com histórico de decisões e limite de aprovação por contrato. |
| **Desconto e custos** | Adm, Atd | Só quem tem permissão vê custo e define desconto; o técnico não recebe esses dados. |
| **Pagamentos** | Adm, Atd | Registro de pagamentos por OS, com total e saldo. |

## 6. Testes e firmware

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Bancadas e instrumentos** | Adm, Téc | Cadastro com calibração e validade; instrumento vencido é sinalizado. |
| **Reserva de horário** | Téc | Agenda a bancada sem conflito entre técnicos. |
| **Sessão de teste antes/depois** | Téc | Registra amostras reais de hashrate, temperatura, consumo, erros e chips. |
| **Aprovação por critério** | Sistema | Calcula o resultado pelos critérios do roteiro (hashrate, temperatura, consumo, erros, duração, chips) e compara antes e depois. |
| **Firmware documentado** | Téc, Atd | Versão recebida e entregue, autorização do cliente e backup de acesso restrito à equipe (nunca vai ao portal). |

## 7. Peças, sucata e viabilidade

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Estoque de peças** | Adm, Atd, Téc | Entradas, saídas e saldo por item, com movimentos rastreados. |
| **Placas doadoras** | Adm, Téc | Controle de placas que viram fonte de componentes. |
| **Componentes recuperados** | Adm, Téc | Peças retiradas de sucata, com lote, destino e autorização do cliente. |
| **Viabilidade** | Adm, Atd | Compara reparar, substituir ou devolver, registrando as premissas. Não promete rentabilidade. |

## 8. Entrega, retorno e garantia

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Status da OS** | Todos | Acompanhamento do fluxo da entrada à entrega, com recado ao cliente. |
| **Garantia por componente** | Adm, Atd | Prazo calculado a partir da data de entrega, por peça ou serviço. |
| **Retorno** | Adm, Atd, Téc | Registra a volta do equipamento, classifica o motivo e liga à OS original. |
| **Reincidência** | Adm, Atd | Detecta o mesmo defeito voltando dentro da garantia. |

## 9. Contratos e campo

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Contratos** | Adm | Vigência, SLA em horas, prioridade e limite de aprovação por cliente. |
| **Visitas** | Adm, Atd, Téc | Atendimento em campo, com registro do que foi feito. |
| **Preventivas** | Adm, Atd | Manutenção programada; a próxima data é gerada automaticamente. |

## 10. Comunicação com o cliente

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Portal com login** | Cli | Equipamentos, OS, laudos, mensagens e aprovação do orçamento por componente, conforme contrato e limite. |
| **Painel por código** (`PLANO=pago`) | Cli | Entrada por link ou código de 12 caracteres, **sem login**. Mostra só o que a assistência liberou. |
| **Mensagens e fotos do cliente** | Cli | O cliente escreve e envia fotos, sempre ligadas a uma OS aberta. |
| **Respostas rápidas** | Cli | Frases prontas para os pedidos mais comuns. |
| **Código salvo no aparelho** | Cli | "Manter neste aparelho" evita digitar o código a cada visita. |
| **Ativar, pausar e renovar** | Adm, Atd | Liga o painel só para os clientes que devem ver, pausa ou gera um código novo. |
| **Comentário interno ou visível** | Adm, Atd, Téc | Cada comentário da OS ou do item é marcado como oculto ou visível ao cliente. O cliente só vê o que foi liberado. |
| **Acompanhamento público da OS** | Qualquer pessoa com o link | Status e recado da OS por link (`/?acompanhar=…`). |
| **Mensagem de WhatsApp** | Adm, Atd | Abre a mensagem pronta para revisão e envio manual. |

## 11. Conhecimento e indicadores

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Base de conhecimento** | Adm, Téc | Casos de reparo pesquisáveis por modelo. |
| **Indicadores** | Adm | Tempo até a entrega, primeiro teste aprovado, reincidência, margem orçada, falhas por modelo/revisão/ponto e ocupação de bancada. |

## 12. Acesso, perfis e auditoria

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Login por e-mail e senha** | Todos | Sessão de 30 dias, com limite de tentativas. |
| **Primeiro administrador** | Adm | Criado com o `SETUP_TOKEN`; a opção some depois do primeiro usuário. |
| **Convites** | Adm | Link de uso único para a pessoa definir a própria senha. Envio por e-mail é opcional. |
| **Minha conta** | Todos | Cada pessoa troca a própria senha e o próprio e-mail. |
| **Recuperação de senha** | Todos | Por e-mail, quando o envio está configurado. |
| **Perfis** | Adm | Administrador, Atendente, Técnico, Cliente e Desativado. |
| **Permissões granulares** | Adm | Libera ou bloqueia 8 ações por pessoa (custos, orçamento, decisões, tabela de preços, clientes, pagamentos, estoque e painel). |
| **Gerenciar clientes** | Adm, Atd | Tela própria para cadastro, edição e ativação do painel por cliente. |
| **Auditoria** | Adm | Registro de alterações sensíveis com autor, data e motivo. |

## 13. Documentos e exportação

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Termo de entrada em PDF** | Adm, Atd, Téc | Na OS: cliente, equipamentos e séries, estado de entrega, acessórios, fotos do recebimento, cláusulas e assinaturas. Cláusulas editáveis pelo administrador. |
| **Laudo técnico em PDF** | Adm, Atd, Téc | Página própria para impressão e PDF pelo navegador. |
| **Etiquetas** | Adm, Atd, Téc | Etiqueta com QR Code para colar no equipamento. |
| **Exportação CSV** | Adm | Dados em planilha, com proteção contra injeção de fórmulas. |
| **Backup JSON** | Adm | Exportação dos registros, sem credenciais. |

## 14. Vendas de máquinas e peças

> Cada menu tem os próprios botões de "novo" no topo (por exemplo *Receber lote* em Lotes, *Entrada de sucata* em Estoque e *Nova venda* em Vendas); veja a tabela em [GUIA-ASIC.md](GUIA-ASIC.md#onde-cadastrar-cada-coisa-botões-no-topo-de-cada-menu).

Item **Vendas** no menu lateral, separado das OS. Visível só para quem tem a permissão *Gerenciar vendas de máquinas* (administrador sempre; atendente por padrão). Não aparece no portal nem no painel por código do cliente.

| Funcionalidade | Quem | O que faz |
|---|---|---|
| **Máquinas para venda** | Adm, Atd | Estoque próprio para revenda: modelo, marca, série única, condição (nova, usada testada, recondicionada, para peças), hashrate, origem, preço e custo. Editar e remover enquanto disponível. |
| **Vender máquina** | Adm, Atd | Comprador cliente cadastrado ou avulso, valor, forma de pagamento (Pix, dinheiro, cartão, transferência, boleto), valor pago agora e garantia. A máquina fica *Vendida* e não pode ser vendida de novo. |
| **Vender peça** | Adm, Atd | Escolhe a peça do estoque e a quantidade; o valor sugerido vem do preço da peça. Baixa o saldo e grava a movimentação, sem vender o que está reservado para uma OS. |
| **Recebimentos** | Adm, Atd | Registra pagamentos parciais até quitar; o saldo nunca fica negativo. |
| **Cancelamento** | Adm | Exige motivo, devolve a máquina ao estoque de venda ou as peças ao saldo, e fica na auditoria. |
| **Indicadores** | Adm, Atd | Disponíveis, valor em estoque, vendas concluídas e a receber. Custo e margem só com a permissão *Ver custos*. |

---

**Fora do escopo (hoje):** leitura automática da mineradora, gravação de firmware, integração com pools, nota fiscal e pagamentos online. Veja [Limitações conhecidas](README.md#limitações-conhecidas).
