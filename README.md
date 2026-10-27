# Bancada — gestão para assistências de mineradoras ASIC

Sistema web para assistências técnicas de mineradoras ASIC: check-in com fotos e número de série, rastreabilidade por QR Code, lotes, diagnóstico por roteiro, testes de estabilidade, orçamento por componente com tabela de preços, firmware documentado, retorno e garantia, contratos, portal e painel do cliente.

> Código aberto sob a licença [MIT com requisito de atribuição](LICENSE): pode usar, modificar e **comercializar**, desde que mantenha o aviso de autoria e o crédito visível no rodapé do sistema.

## Funcionalidades

- **Entrada do equipamento:** fotos, série obrigatória (ou "ilegível"), máquina completa ou itens faltando, vínculo obrigatório da OS a um equipamento ASIC.
- **Rastreabilidade:** QR Code, composição da mineradora, transferência de componentes, histórico com responsável, lotes e devolução.
- **Reparo:** roteiros por modelo e revisão, mapa de defeitos, bancadas e instrumentos calibrados, testes de estabilidade, firmware, sucata e peças recuperadas.
- **Comercial:** tabela de preços, orçamento e decisão por componente, comentários internos ou visíveis ao cliente, contratos e SLA.
- **Cliente:** portal com login e painel público por código (recurso opcional, `PLANO=pago`), com mensagens, respostas rápidas e fotos vinculadas a uma OS aberta.
- **Acesso:** login por e-mail e senha, perfis (Administrador, Atendente, Técnico, Cliente) e permissões granulares por usuário.

A documentação de uso está em [`GUIA-ASIC.md`](GUIA-ASIC.md).

## Tecnologia

Next 16 (via [vinext](https://github.com/cloudflare/vinext)), React 19, TypeScript. Roda como Cloudflare Worker (D1 + R2) ou no runtime local do Cloudflare (`wrangler dev`) com banco SQLite e fotos em disco. Regras de negócio em `lib/` (JavaScript puro, com testes).

## Rodando localmente

Requer Node 22.13 ou superior.

```sh
npm ci
npm run build
for f in drizzle/*.sql; do
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local \
    --config dist/server/wrangler.json --persist-to .wrangler/state --file "$f"
done
npm start -- --var SETUP_TOKEN:troque-este-codigo
```

Abra a porta indicada. Na primeira vez, use **Primeiro acesso do administrador** com o `SETUP_TOKEN`; ele só vale enquanto não existir nenhum usuário.

Testes e verificação de tipos:

```sh
node --test lib/*.test.mjs
npx tsc --noEmit
```

## Configuração (variáveis do servidor)

| Variável | Para quê |
|---|---|
| `SETUP_TOKEN` | Código para criar o primeiro administrador. Sem ele, ninguém consegue. |
| `PLANO` | `pago` liga o painel do cliente por código. |
| `RESEND_API_KEY`, `MAIL_FROM` | Opcionais: envio de e-mail (convite e recuperação de senha). |

Nenhum segredo vai para o repositório: use variáveis de ambiente ou `.dev.vars` (ignorado pelo Git).

## Implantação

`deploy/instalar-hetzner.mjs` instala um ambiente isolado por cliente num servidor próprio (Docker), acessível **somente por Cloudflare Tunnel**, sem porta publicada, com backup diário. Parâmetros por variável de ambiente; veja o cabeçalho do script. `deploy/cliente.mjs` publica o mesmo sistema como Worker na Cloudflare (D1 + R2).

## Segurança

Autorização sempre no servidor (`lib/perms.mjs`, `lib/asic.mjs`). Senhas com PBKDF2-SHA256, sessões e convites guardados apenas como hash, limite de tentativas por e-mail e por IP, verificação de origem em toda gravação. Encontrou uma vulnerabilidade? Abra uma *security advisory* privada neste repositório em vez de uma issue pública.

## Autor e licença

Desenvolvido por **Alessandro Mata** · [alessandro.mata@gmail.com](mailto:alessandro.mata@gmail.com) · +55 31 98754-9399 · [github.com/AlessandroMata/bancada-asic](https://github.com/AlessandroMata/bancada-asic)

[MIT com requisito de atribuição](LICENSE): uso, cópia, modificação, distribuição e venda são permitidos, inclusive em produtos comerciais, desde que o crédito ao autor (nome e contato) continue visível na interface (o rodapé fixo, em `app/credits.tsx`) e os cabeçalhos de autoria dos arquivos sejam mantidos. Versões modificadas devem informar que foram modificadas, mantendo o crédito original. Sem garantia de nenhum tipo.
