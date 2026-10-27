# Bancada ASIC — operação e instalação

Esta versão amplia o Bancada existente para assistência de mineradoras ASIC. São módulos funcionais com persistência SQL e autorização no servidor. Não são incluídos clientes, equipamentos, critérios técnicos ou resultados fictícios em produção.

## Comece por aqui

1. Cadastre clientes em **Clientes** e sua equipe em **Administração**.
2. Abra **Equipamentos** e cadastre mineradoras, hashboards, fontes e controladoras. Use uma identificação única para peças sem número de série. Modelo e revisão identificam a compatibilidade dos roteiros.
3. Selecione cada equipamento para ver QR Code, composição, estado, fotos e histórico. A etiqueta abre o cadastro autenticado no próprio site. O sistema gera a imagem QR localmente; não envia identificadores para serviços de QR externos.
4. Registre a remessa em **Lotes**, confira as unidades e use **Gerar OS individuais**. A ação cria uma OS por equipamento principal e vincula seus componentes. Equipamentos com OS aberta são preservados sem duplicação. É possível abrir OS individual pela tela Chamados e depois vincular componentes.
5. Abra a OS em **Ordens de serviço**: equipamentos, diagnóstico, testes, firmware, orçamento por componente, peças, pagamentos, viabilidade/retorno, anexos e histórico ficam nas abas da própria OS.

## Os 15 grupos de funcionalidades

| Grupo | Recursos disponíveis |
|---|---|
| Rastreabilidade | Identificação única, QR e etiqueta, composição de mineradora, transferências temporárias ou definitivas, localização e histórico com responsável. Transferências são restritas ao mesmo cliente. |
| Lotes | Protocolo, quantidade esperada e conferida, divergências, fotos, OS individuais por equipamento e encerramento com validação. |
| Roteiros | Modelo/revisão exatos, versão, fonte, checklist e limites configuráveis; cópia do procedimento fica preservada em cada diagnóstico. |
| Mapa de defeitos | Pontos por coordenadas percentuais, referência do componente, medição, substituição e solução. O desenho é um esquema relativo, não um layout elétrico específico. |
| Bancadas | Recursos e instrumentos identificados, validade e referência de calibração, reserva por horário, prevenção de conflito e liberação. |
| Testes | Sessão antes/depois, bancada, instrumentos, firmware, configuração, condições, amostras manuais, evidências, interrupção e aprovação calculada pelos critérios registrados. |
| Firmware | Versão recebida/entregue, autorização, alterações, configuração sem senhas e referência a backup de acesso interno. |
| Conhecimento | Artigos derivados de OS entregues, com modelo, revisão, sintoma, solução e resultado. Busca textual e sugestões pelo mesmo modelo. |
| Retrabalho | Retorno vinculado à OS original e ao componente, classificação, prazo de garantia calculado a partir da entrega e decisão de cobertura justificada. |
| Sucata | Origem e autorização da placa doadora, componente recuperado, teste, quantidade disponível, lote, compatibilidade, destino e autorização de uso pelo cliente. |
| Viabilidade | Comparação de reparo/substituição/valor informado, prazo, resultado diário estimado, premissas, decisão e retorno simples calculado. Sem consulta de mercado ou promessa de rentabilidade. |
| Logística | Devolução parcial ou total do lote, embalagem, fotos, peso, seguro, transportadora, rastreamento manual e comprovante de entrega. |
| Contratos | Vigência, prioridade, SLA em horas corridas, limite por OS, aprovadores e condições comerciais. Aberturas dentro da vigência recebem prazo e prioridade padrão. |
| Portal empresarial | Contas de consulta/aprovação por cliente; equipamentos, OS, decisões por componente, laudos, anexos compartilhados, lotes, transporte, contratos e visitas. |
| Indicadores | Tempo até entrega, espera por etapa, primeiro teste aprovado, reincidência, custo/margem orçada, ocupação, atraso contratual, falhas por modelo/revisão/ponto e lotes de peças em equipamentos retornados. |

## Diagnóstico e critérios técnicos

Um administrador deve cadastrar o roteiro aplicável ao modelo e à revisão exatos. Informe uma fonte ou responsável e uma versão. Cadastre limites de hashrate mínimo (TH/s), temperatura máxima (°C), consumo máximo (W), erros máximos, duração mínima (minutos) e chips esperados, se aplicável. Esses valores dependem do equipamento e devem ser definidos pela assistência; o sistema não fornece parâmetros técnicos presumidos.

No diagnóstico, a seleção do roteiro carrega um campo de resultado para cada etapa. Registre medições com ponto e unidade, inspeção de oxidação/poeira/conectores, placas, chips, ventoinhas e logs sem credenciais. Anexe fotos ou documentos na OS ou no equipamento.

Para marcar um defeito, selecione a hashboard, clique no mapa para escolher coordenadas e use **Marcar defeito na placa**. Os pontos preservam o reparo documentado e podem ser consultados em reincidências.

## Testes de estabilidade

Cadastre bancada e instrumentos. Recursos que exigem calibração precisam estar válidos até o final da reserva. Registre nova calibração pelo botão correspondente, mantendo uma referência do certificado. Reserve bancada e cada instrumento durante todo o intervalo do teste.

Inicie a sessão dentro do intervalo reservado e com o modelo/revisão do roteiro compatíveis. Registre amostras durante todo o ensaio; o sistema não faz leituras automáticas do hardware. Antes de concluir, anexe à OS uma **Evidência de teste** registrada depois do início da sessão.

A conclusão compara o menor hashrate, a maior temperatura, o maior consumo, o maior total de erros, o menor número de chips e o tempo real decorrido com os critérios preservados no início. Uma interrupção não aprova o componente. O resultado serve como documentação dos registros fornecidos, não como certificação independente do aparelho.

Para liberar para retirada ou entregar um serviço com orçamento por componente aprovado, cada componente aprovado deve estar **Testado** e ter um teste final **Depois** aprovado. A aprovação comercial e a quitação do saldo continuam obrigatórias para a entrega. Alterar manualmente o estado para Testado não substitui o teste registrado.

## Orçamento parcial e garantia

Na aba **Orçamento** da OS, edite o orçamento por componente. Cada item tem componente, serviço, quantidade, preço, custo interno e garantia. A decisão é tomada por componente: todos os itens daquele componente são aprovados ou recusados juntos. Itens recusados saem do total; o desconto global é aplicado sobre os itens restantes, com mínimo de zero. A decisão não pode reduzir o total abaixo dos pagamentos já registrados.

Qualquer nova versão do orçamento reinicia as decisões. A aprovação geral é formada quando não restam itens pendentes. O técnico não registra decisões comerciais. Para retorno, abra nova OS, vincule o mesmo componente e classifique em Retornos; a garantia é obtida do orçamento original, com data limite calculada. A assistência registra a cobertura e a justificativa.

## Tabela de preços e comentários

**Tabela de preços** (menu *Tabela de preços*, visível a administração e atendimento; só o administrador altera). Cada item tem descrição, categoria (Serviço ou Peça), preço, custo interno, garantia em dias e modelos compatíveis (opcional); itens podem ser desativados. No orçamento, o técnico **escolhe o item da tabela**: o preço, o custo e a garantia são aplicados pelo servidor e não podem ser digitados; ele só informa a quantidade. Se o item não existir na tabela, usa **Outro item (fora da tabela)** e informa descrição, preço e garantia; esse item fica marcado como *fora da tabela* para conferência. Alterar um preço na tabela vale para os orçamentos novos e não muda os já feitos.

**O técnico não vê custo nem define desconto.** Custo interno e margem ficam com administração e atendimento; o desconto global só pode ser alterado pelo atendimento.

**Comentários com visibilidade.** Cada OS tem a aba **Comentários**, e cada item do orçamento aceita um comentário. Todo comentário é **interno** (oculto ao cliente, o padrão) ou **visível ao cliente**. O portal mostra apenas o que foi marcado como visível, sem o nome de quem escreveu; o painel público do cliente não mostra comentários. Comentários não são editados nem apagados, para manter o histórico.

## Contratos, campo e portal

Cadastre contratos por cliente com vigência, SLA, prioridade, limite e e-mails autorizados a aprovar. O limite de aprovação do portal é cumulativo por OS, não por clique ou por item. Usuários de consulta não podem aprovar. Acima do limite, a assistência precisa registrar a autorização pelo atendimento.

Agende preventiva ou atendimento em campo com técnico responsável. Ao concluir uma preventiva, o sistema gera a próxima visita pelo intervalo do contrato, desde que a próxima data permaneça dentro da vigência. É uma agenda persistente da aplicação: não envia e-mails, SMS ou notificações fora do site.

Em **Acesso ao portal**, cadastre o e-mail e a empresa correspondente e, em **Administração**, gere o **Link de senha** para a pessoa definir a própria senha. Ao entrar, um cliente recebe somente os registros de sua empresa. Custos internos, backups, logs, rotinas e registros técnicos internos não são enviados ao portal. Diagnóstico técnico da OS é mostrado ao cliente apenas quando estiver pronta para retirada ou entregue.

Anexos são internos por padrão. Para compartilhar fotos/laudos da OS, marque visibilidade **Cliente**. Backups são sempre internos. Não registre senhas, chaves de API ou credenciais de pools nos campos de texto. Backups binários ficam em R2, com download autorizado no servidor; o sistema não executa nem instala esses arquivos.

## Transporte e documentos

Libere o equipamento e finalize a etapa técnica/comercial antes de preparar uma devolução. Anexe ao lote fotos na categoria Embalagem antes de registrar o despacho e um Comprovante antes de confirmar a entrega. O rastreamento é manual; não há contratação de frete ou compra de seguro pelo sistema.

O botão **Laudo técnico / PDF** abre uma prévia com identificação, serviço, decisões, garantias, resultados antes/depois e imagens anexadas. Use Imprimir → Salvar como PDF. Etiquetas QR também têm impressão própria. CSV é disponibilizado nos relatórios existentes e nos indicadores ASIC.

## Persistência e atualização de uma instalação existente

O banco D1 agora possui a tabela `records` (coleção, identificador e documento por registro), além do controle global de versão em `store`. Não há um único documento contendo toda a base. A migração SQL cria a nova tabela sem alterar registros legados. A primeira gravação converte a base anterior em registros separados dentro de uma transação. A leitura continua compatível com o formato anterior até essa conversão.

As gravações usam versão otimista e um identificador de transação. O batch SQL condiciona todas as alterações ao identificador da gravação vencedora. Uma alteração concorrente retorna conflito sem sobrescrever a outra. Leitura verifica a versão antes/depois para evitar montar um estado misturado.

O backup JSON do administrador exporta os registros e as referências dos anexos. Os arquivos R2 precisam de backup separado: o JSON não contém seus bytes. Esta versão oferece exportação de dados, não restauração por upload no painel.

## Menu e abertura de OS

O sistema é voltado a ASIC: toda OS nasce de um equipamento. Em **Nova ordem de serviço**, escolha um equipamento já cadastrado ou preencha os dados de um novo (ele é cadastrado junto). No check-in informe o **estado de entrega**: *Máquina completa* ou *Faltando itens* (marque hashboard, fonte, controladora, ventoinha, cabos, carcaça, dissipadores, parafusos e/ou descreva outros); isso fica na OS, no laudo de entrada e no painel do cliente. O **número de série é obrigatório** (real, sem “sem”, “n/a” ou “0000”) ou marque **Ilegível**, que gera um identificador único (`ILEGÍVEL-ASIC-00014`); depois ele pode ser corrigido em *Equipamentos → Corrigir número de série*, com motivo e registro de auditoria. Toda OS nasce vinculada a um equipamento ASIC. Se o cliente ainda não existe, use o **+ Novo** ao lado do campo Cliente: informe nome e telefone (e-mail e documento são opcionais) e o cliente, o equipamento e a OS são criados juntos; se algo falhar, nada é gravado. Ao escolher uma mineradora, seus componentes entram na mesma OS. Ainda no formulário, use **Fotos da entrada** para tirar ou escolher até 12 fotos (no celular abre a câmera ou a galeria); elas são reduzidas no próprio aparelho, entram como *Recebimento*, ficam internas e aparecem na aba Anexos da OS. A aba Anexos também aceita várias fotos de uma vez. Menu: Painel, Ordens de serviço, Equipamentos, Lotes e logística, Bancada e testes, Conhecimento, Clientes e contratos, Estoque e sucata, Relatórios e Administração. Não há mais cadastro de aparelhos genéricos nem orçamento fora do por componente.

## Gerenciar clientes e painel do cliente

Em **Clientes e contratos**, clique no cliente para gerenciá-lo: **Dados** (editar nome, telefone, e-mail e CPF/CNPJ; atendimento e administração), **Equipamentos**, **Ordens** e **Acesso e painel** (usuários do portal e controle do painel).

**Painel do cliente (versão paga).** Página para o cliente acompanhar OS (etapa, previsão, recado e mensagens visíveis), equipamentos, lotes e devoluções, **sem** valores, custos, pagamentos, diagnóstico nem observações internas. O código fica salvo no aparelho (opção *Manter neste aparelho*, marcada por padrão; o botão *Sair* esquece). No painel o cliente também pode **enviar mensagens e fotos**, com **respostas rápidas** prontas, sempre vinculadas a uma **OS aberta** dele: a mensagem aparece na aba Comentários da OS (marcada *Mensagem do cliente*, com aviso *Cliente respondeu*) e a foto em Anexos (categoria *Cliente*). Limites: 30 envios por cliente a cada 15 minutos e 30 fotos por OS; só imagens até 8 MB; OS encerrada não recebe mensagens. É opcional por cliente: nem todo cliente precisa ter.
1. O administrador abre o cliente → *Acesso e painel* e liga o interruptor **Painel do cliente**. Isso gera um código de 12 caracteres, como `K7MQ-2XH9-PD4T`.
2. Passe ao cliente o **código** (ele digita em `seusite/painel`) ou o **link** (`/?painel=CÓDIGO`, já entra direto). Há botões para copiar os dois.
3. **Desativar** corta o acesso na hora, mas guarda o código: ao reativar, o mesmo código volta a valer. **Novo código** invalida o anterior.

Proteções: o código usa letras e números sem ambiguidade (sem 0/O nem 1/I/L), com cerca de 59 bits de entropia; 10 tentativas erradas bloqueiam o IP por 15 minutos (acertos não contam); o bloqueio é por IP, e não por código, para ninguém conseguir travar o painel de outro cliente. O código fica visível a atendimento e administração (para reenviar) e é omitido de técnicos e do portal. Trate o código como informação do cliente.

O recurso só existe com `PLANO=pago` no servidor (variável de ambiente, fora do banco, para o cliente não se habilitar sozinho). Sem o plano, o controle aparece bloqueado, a rota recusa (402) e os painéis já ativados deixam de responder.

## Onde cadastrar cada coisa (botões no topo de cada menu)

Cada menu tem seus próprios botões de "novo" no canto superior direito. O primeiro (azul) é a ação principal da tela:

| Menu | Botões no topo |
|---|---|
| Painel e Ordens de serviço | Nova ordem de serviço |
| Equipamentos | Novo equipamento |
| Lotes e logística | Receber lote · Preparar devolução |
| Bancada e testes | Novo recurso (bancada ou instrumento, só administrador) · Iniciar teste |
| Conhecimento | Novo artigo (a partir de um reparo concluído) |
| Clientes e contratos | Novo cliente · Novo contrato (só administrador) |
| Tabela de preços | Novo item |
| Estoque e sucata | Nova peça · Entrada de estoque · Entrada de sucata (registra a placa doadora) |
| Vendas | Nova venda (máquina ou peça) · Nova máquina (para venda) |
| Administração | Novo usuário |

O botão só aparece para quem tem permissão para a ação. Relatórios não tem botão de cadastro.

## Vendas de máquinas e peças

O item **Vendas** do menu reúne duas coisas, separadas das ordens de serviço:

1. **Máquinas para venda** — o estoque de revenda. Use **Nova máquina** e informe modelo, série, condição, origem e preço (o custo só aparece para quem vê custos). Enquanto estiver *Disponível*, a máquina pode ser editada ou removida.
2. **Vendas** — o histórico. Para vender uma máquina, use o ícone de venda na linha dela; para vender uma peça, use **Vender peça** e escolha item e quantidade.

Em ambos os casos informe o comprador (um cliente cadastrado ou um nome avulso), o valor, a forma de pagamento, quanto foi pago agora e a garantia. Se sobrar saldo, use o ícone de **receber** na venda para lançar os próximos pagamentos. A venda de peça baixa o saldo do estoque de peças e não deixa vender o que está reservado para uma OS.

O **administrador** pode cancelar uma venda (com motivo): a máquina volta a ficar disponível e as peças voltam ao saldo.

## Perfis e permissões

Cada usuário tem um **perfil**: Administrador, Atendente, Técnico ou Cliente (portal). O perfil define o que a pessoa pode fazer; o administrador pode **liberar ou bloquear itens por pessoa** em *Administração → Permissões* (atendentes e técnicos). O Administrador sempre tem tudo, e o Cliente do portal nunca ganha permissão interna.

| Permissão | Atendente | Técnico |
|---|---|---|
| Ver custos e margem | sim | não |
| Montar orçamentos | sim | sim |
| Registrar decisão e desconto | sim | não |
| Gerenciar a tabela de preços | não | não |
| Cadastrar e editar clientes | sim | não |
| Registrar pagamentos | sim | não |
| Gerenciar o estoque | não | não |
| Gerenciar vendas de máquinas | sim | não |
| Gerenciar o painel do cliente | não | não |

Esses são os padrões (iguais ao comportamento anterior). Itens que mudam são destacados na tela e podem ser revertidos com **Restaurar padrão do perfil**. Trocar o perfil da pessoa também restaura o padrão do novo perfil. Quem não pode ver custos não recebe o custo em lugar nenhum (OS, tabela de preços, estoque, indicadores). Liberar uma permissão **não** dá acesso a telas que o perfil nunca tem (por exemplo, um técnico com “editar clientes” continua sem atendimento). Usuários, perfis, backup, configurações e contratos continuam exclusivos do administrador. Cada alteração fica na auditoria.

## Acesso e senhas

O login é por **e-mail e senha**, sem depender de conta ChatGPT. Senhas têm 10 a 128 caracteres, são guardadas com PBKDF2-SHA256 em tabela própria (`credentials`, fora do backup JSON e das respostas da API) e a sessão é um cookie `HttpOnly` de 30 dias cujo token é guardado só como hash.

1. **Primeiro administrador**: defina o segredo `SETUP_TOKEN` no servidor (em local: `npm start -- --var SETUP_TOKEN:<código>`). Na tela de entrada aparece *Primeiro acesso do administrador*; informe nome, e-mail, senha e o código. A opção some quando existe qualquer usuário.
2. **Demais pessoas**: o administrador cadastra o usuário (Administração, ou Acesso ao portal para clientes) e clica em **Link de senha**. O link vale 72 horas, serve uma única vez e também redefine senha esquecida; ao usá-lo, as sessões antigas da pessoa são encerradas.
3. **Trocar senha / sair**: ícones de chave e saída no rodapé do menu (e no topo do portal). Trocar a senha encerra as outras sessões.
4. **Proteções**: 5 tentativas erradas por e-mail e 30 por IP a cada 15 minutos bloqueiam o login por alguns minutos; usuário *Desativado* perde o acesso na hora.

**E-mail é opcional.** Sem configuração, o administrador copia o link e envia por onde preferir. Se definir `RESEND_API_KEY` e `MAIL_FROM` no servidor, aparecem *Enviar por e-mail* no link de senha e *Esqueci minha senha* na entrada. Nunca coloque essas chaves no repositório.

## Instalação local

Node.js 22.13 ou superior. No PowerShell, use `npm.cmd` se `npm.ps1` estiver bloqueado.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_noisy_zaladane.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_reflective_nocturne.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_login_senha.sql
npm run dev
```

Em instalação existente, aplique apenas migrações pendentes. Não repita uma migração já aplicada. Publicações pelo Sites aplicam as migrações na base hospedada. Bancos de teste local e produção são separados. Não execute db:generate sem alterar o esquema.

```sh
node --test lib/domain.test.mjs lib/asic.test.mjs
npx tsc --noEmit
```

Preserve os bindings DB e BUCKET. A autenticação é própria (ver *Acesso e senhas*); configure o segredo `SETUP_TOKEN` antes do primeiro acesso. Futuras integrações devem usar segredos no servidor, nunca no frontend. Horários de agenda são informados em Brasília; a base guarda instantes UTC.

## Limites operacionais

As medições, autorização do cliente, rastreamento e dados de viabilidade são registrados pela equipe. Não há monitoramento automático pela rede local, gravação de firmware, integração com pools, transportadoras, emissão fiscal ou processamento de pagamentos. Procedimentos de reparo devem ser cadastrados e revisados por responsáveis técnicos. A aplicação carrega os registros autorizados em memória por sessão; operações de grande escala poderão exigir paginação e consultas específicas no SQL.
