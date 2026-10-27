// © 2026 Alessandro Mata · alessandro.mata@gmail.com · +55 31 98754-9399 · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import React from 'react';
export const AUTHOR={name:'Alessandro Mata',email:'alessandro.mata@gmail.com',phone:'+55 31 98754-9399',tel:'+5531987549399',repo:'https://github.com/AlessandroMata/bancada-asic'};
// Crédito fixo no rodapé. A licença (LICENSE) exige que ele permaneça visível em qualquer produto derivado.
export default function CreditFooter(){
 return <div className="credit" role="contentinfo" aria-label="Créditos do sistema">
  <span>Desenvolvido por <strong>{AUTHOR.name}</strong></span>
  <a href={'mailto:'+AUTHOR.email}>{AUTHOR.email}</a>
  <a href={'tel:'+AUTHOR.tel}>{AUTHOR.phone}</a>
  <a href={AUTHOR.repo} target="_blank" rel="noopener noreferrer">GitHub: AlessandroMata/bancada-asic</a>
 </div>;
}
