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

export function getCinemaShortName(name: string): string {
  return CINEMA_SHORT_NAMES[name] ?? name;
}
