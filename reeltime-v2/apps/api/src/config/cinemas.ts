export interface CinemaConfig {
  name: string;
  allocineId: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const CINEMAS: CinemaConfig[] = [
  {
    allocineId: 'P0153',
    name: 'Les Studios',
    address: '136 Rue Jean Jaurès, 29200 Brest',
    city: 'Brest',
    latitude: 48.3886,
    longitude: -4.4942,
  },
  {
    allocineId: 'P0151',
    name: 'CGR Brest Le Celtic',
    address: '38 Rue de Glasgow, 29200 Brest',
    city: 'Brest',
    latitude: 48.3897,
    longitude: -4.4864,
  },
  {
    allocineId: 'P0417',
    name: 'Multiplexe Liberté',
    address: '2 Rue de la Porte, 29200 Brest',
    city: 'Brest',
    latitude: 48.3904,
    longitude: -4.4861,
  },
  {
    allocineId: 'W2920',
    name: 'Pathé Capucins',
    address: 'Centre Commercial Les Capucins, 29200 Brest',
    city: 'Brest',
    latitude: 48.3838,
    longitude: -4.4977,
  },
  {
    allocineId: 'G02PD',
    name: 'Ciné Galaxy',
    address: 'Zone de Mescoat, 29800 Landerneau',
    city: 'Landerneau',
    latitude: 48.4474,
    longitude: -4.2544,
  },
  {
    allocineId: 'P0328',
    name: 'Les Baladins',
    address: '34 Avenue du Général de Gaulle, 22300 Lannion',
    city: 'Lannion',
    latitude: 48.7279,
    longitude: -3.4607,
  },
  {
    allocineId: 'P1883',
    name: 'La Salamandre',
    address: '39 ter Quai du Léon, 29600 Morlaix',
    city: 'Morlaix',
    latitude: 48.5831,
    longitude: -3.8344,
  },
  {
    allocineId: 'G0FOX',
    name: 'Cinéville Morlaix',
    address: '2 rue Karine Ruby, 29600 Plourin-lès-Morlaix',
    city: 'Morlaix',
    latitude: 48.5348,
    longitude: -3.7905,
  },
  {
    allocineId: 'P0326',
    name: 'Les Baladins',
    address: '27 Boulevard Thalassa, 22700 Perros-Guirec',
    city: 'Perros-Guirec',
    latitude: 48.8271,
    longitude: -3.4827,
  },
  {
    allocineId: 'P0299',
    name: 'Cinéville Quimper',
    address: '67 rue de la Providence, 29000 Quimper',
    city: 'Quimper',
    latitude: 48.0006,
    longitude: -4.1100,
  },
  {
    allocineId: 'P0633',
    name: 'Katorza',
    address: '38 boulevard Dupleix, 29000 Quimper',
    city: 'Quimper',
    latitude: 47.9946,
    longitude: -4.1021,
  },
  {
    allocineId: 'W2900',
    name: 'Quai Dupleix',
    address: '38 boulevard Dupleix, 29000 Quimper',
    city: 'Quimper',
    latitude: 47.9946,
    longitude: -4.1021,
  },
];

export function getCinemaByAllocineId(id: string): CinemaConfig | undefined {
  return CINEMAS.find((c) => c.allocineId === id);
}
