// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Permissões granulares. O perfil (função) define o padrão; o administrador libera ou bloqueia itens por usuário.
// Administrador sempre tem tudo (evita se trancar fora); Cliente do portal e Desativado nunca têm.
export const PERMS=[
 ['verCustos','Ver custos e margem','Custo interno de peças e serviços, custo na tabela de preços e margem nos indicadores.'],
 ['editarOrcamento','Montar orçamentos','Criar e editar o orçamento por componente, usando a tabela de preços.'],
 ['decidirOrcamento','Registrar decisão e desconto','Aprovar ou recusar por componente em nome do cliente e definir o desconto.'],
 ['gerenciarPrecos','Gerenciar a tabela de preços','Cadastrar, alterar e desativar itens da tabela.'],
 ['gerenciarClientes','Cadastrar e editar clientes','Criar clientes e alterar os dados cadastrais.'],
 ['registrarPagamentos','Registrar pagamentos','Lançar pagamentos recebidos nas OS.'],
 ['gerenciarEstoque','Gerenciar o estoque','Cadastrar peças e dar entrada no estoque.'],
 ['gerenciarPainel','Gerenciar o painel do cliente','Ativar, desativar e renovar o código do painel.']
];
const make=(on=[])=>Object.fromEntries(PERMS.map(([k])=>[k,on.includes(k)]));
export const DEFAULTS={
 Administrador:make(PERMS.map(([k])=>k)),
 Atendente:make(['verCustos','editarOrcamento','decidirOrcamento','gerenciarClientes','registrarPagamentos']),
 'Técnico':make(['editarOrcamento']),
 Cliente:make(),Desativado:make()
};
export const CUSTOMIZABLE=['Atendente','Técnico'];
export function can(u,key){
 if(!u||!(u.role in DEFAULTS))return false;if(u.role==='Administrador')return true;if(!CUSTOMIZABLE.includes(u.role))return false;
 const o=u.perms?.[key];return typeof o==='boolean'?o:DEFAULTS[u.role][key]===true;
}
export const resolved=u=>Object.fromEntries(PERMS.map(([k])=>[k,can(u,k)]));
// Guarda só o que difere do padrão do perfil (assim, mudar o padrão no futuro vale para quem não foi personalizado).
export const cleanOverrides=(role,input)=>Object.fromEntries(PERMS.filter(([k])=>typeof input?.[k]==='boolean'&&input[k]!==DEFAULTS[role][k]).map(([k])=>[k,input[k]]));
