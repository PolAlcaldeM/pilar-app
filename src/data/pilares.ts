import { PilarDelDia } from '@/types/pilar';

export const PILARES: PilarDelDia[] = [
  { id: 1, emoji: '💬', titulo: 'Comunicación honesta', frase: 'Hablar con verdad es el primer acto de amor.', categoria: 'pilar' },
  { id: 2, emoji: '🤝', titulo: 'Respeto mutuo', frase: 'Respetar es amar sin condiciones.', categoria: 'pilar' },
  { id: 3, emoji: '🔒', titulo: 'Confianza', frase: 'La confianza se construye en los pequeños gestos.', categoria: 'pilar' },
  { id: 4, emoji: '✨', titulo: 'Admiración', frase: 'Admira lo que tu pareja es, no lo que quieres que sea.', categoria: 'pilar' },
  { id: 5, emoji: '🌱', titulo: 'Apoyo en el crecimiento', frase: 'Crecer juntos es la mayor aventura.', categoria: 'pilar' },
  { id: 6, emoji: '💛', titulo: 'Responsabilidad emocional', frase: 'Tus emociones importan, las suyas también.', categoria: 'pilar' },
  { id: 7, emoji: '🔥', titulo: 'Intimidad', frase: 'La intimidad va más allá del cuerpo.', categoria: 'pilar' },
  { id: 8, emoji: '🎯', titulo: 'Proyectos en común', frase: 'Soñar juntos da sentido al camino.', categoria: 'pilar' },
  { id: 9, emoji: '🧘', titulo: 'Espacio individual', frase: 'Estar bien contigo es estar bien con el otro.', categoria: 'pilar' },
  { id: 10, emoji: '🕊️', titulo: 'Resolución sana de conflictos', frase: 'Discutir con amor es posible.', categoria: 'pilar' },
  { id: 11, emoji: '🙏', titulo: 'Gratitud compartida', frase: 'Dar gracias juntos multiplica la bendición.', categoria: 'mandamiento' },
  { id: 12, emoji: '❤️', titulo: 'Amor incondicional', frase: 'Amar sin esperar, esa es la clave.', categoria: 'mandamiento' },
  { id: 13, emoji: '🌟', titulo: 'Fe en el proceso', frase: 'Confía en que están en el camino correcto.', categoria: 'mandamiento' },
  { id: 14, emoji: '🤲', titulo: 'Servicio mutuo', frase: 'Servir al otro es la forma más pura de amar.', categoria: 'mandamiento' },
  { id: 15, emoji: '🕯️', titulo: 'Paz interior', frase: 'La paz dentro de ti irradia hacia tu relación.', categoria: 'mandamiento' },
  { id: 16, emoji: '📿', titulo: 'Conexión espiritual', frase: 'Orar juntos fortalece los lazos invisibles.', categoria: 'mandamiento' },
  { id: 17, emoji: '🌈', titulo: 'Esperanza activa', frase: 'Cada día es una nueva oportunidad para amar mejor.', categoria: 'mandamiento' },
  { id: 18, emoji: '💎', titulo: 'Fidelidad del corazón', frase: 'Ser fiel es una elección diaria.', categoria: 'mandamiento' },
  { id: 19, emoji: '🌻', titulo: 'Alegría compartida', frase: 'La alegría es más grande cuando se comparte.', categoria: 'mandamiento' },
  { id: 20, emoji: '🏡', titulo: 'Hogar como refugio', frase: 'El hogar es donde ambos se sienten seguros.', categoria: 'mandamiento' },
];

export function getPilarDelDia(): PilarDelDia {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PILARES[dayOfYear % PILARES.length];
}
