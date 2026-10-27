# Bancada — guia de uso

Esta entrega é um sistema único de assistência para mineradoras ASIC. Consulte **GUIA-ASIC.md** para a documentação atualizada de recursos, instalação, banco de dados, permissões e limitações.

## Fluxo básico

1. Cadastre clientes e equipe.
2. Abra uma ordem em Chamados, com equipamento, defeito, acessórios e previsão.
3. Registre diagnóstico, orçamento, aprovação, peças e pagamentos.
4. Finalize testes, libere para retirada e entregue com saldo quitado.
5. Preserve o histórico: use Cancelado para uma OS sem continuidade e abra retornos vinculados à original.

Abra a OS a partir de um equipamento ASIC (existente ou novo). Diagnóstico, testes, firmware e orçamento por componente ficam nas abas da própria OS; lotes pelo menu Lotes e logística.

O acesso é por e-mail e senha (ver **Acesso e senhas** em GUIA-ASIC.md). Permissões do aplicativo são verificadas no servidor; o administrador cadastra a pessoa e gera o link para ela definir a senha.

PDF é gerado pela impressão do navegador. WhatsApp abre uma mensagem para revisão e envio manual. Não há processamento de pagamentos, emissão fiscal ou instalação remota de firmware.

O banco local e o banco de produção são separados. Não há dados de exemplo em produção. Os testes ficam em lib/domain.test.mjs e lib/asic.test.mjs.
