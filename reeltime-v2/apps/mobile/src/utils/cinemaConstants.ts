export const DEPARTMENTS = [
  { label: 'Finistère (29)', cities: ['Brest', 'Landerneau', 'Morlaix', 'Quimper'] },
  { label: "Côtes-d'Armor (22)", cities: ['Lannion', 'Perros-Guirec'] },
];

const CINEMA_SHORT_NAMES: Record<string, string> = {
  'Les Studios': 'Studios',
  'CGR Brest Le Celtic': 'CGR',
  'Multiplexe Liberté': 'Liberté',
  'Pathé Capucins': 'Pathé',
  'Ciné Galaxy': 'Galaxy',
  'La Salamandre': 'Salamandre',
  'Cinéville Morlaix': 'Cinéville M.',
  'Cinéville Quimper': 'Cinéville Q.',
  'Katorza': 'Katorza',
  'Quai Dupleix': 'Dupleix',
};

export function getShortName(name: string, city: string): string {
  if (name === 'Les Baladins') {
    return city === 'Perros-Guirec' ? 'Baladins P-G' : 'Baladins Lan.';
  }
  return CINEMA_SHORT_NAMES[name] ?? name;
}
