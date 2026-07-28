export interface Region { id: string; name: string; lat: number; lng: number; communes: { name: string; lat: number; lng: number }[] }

export const REGIONS: Region[] = [
  { id: 'XV', name: 'Arica y Parinacota', lat: -18.4746, lng: -70.2968, communes: [
    { name: 'Arica', lat: -18.4746, lng: -70.2968 }, { name: 'Camarones', lat: -19.0234, lng: -69.8551 }, { name: 'Putre', lat: -18.1959, lng: -69.5604 }, { name: 'General Lagos', lat: -17.8176, lng: -69.4971 }
  ]},
  { id: 'I', name: 'Tarapaca', lat: -20.2132, lng: -70.1493, communes: [
    { name: 'Iquique', lat: -20.2132, lng: -70.1493 }, { name: 'Alto Hospicio', lat: -20.2469, lng: -70.0991 }, { name: 'Pozo Almonte', lat: -20.2561, lng: -69.7866 }, { name: 'Camina', lat: -19.3122, lng: -69.4285 }, { name: 'Colchane', lat: -19.2787, lng: -68.6435 }, { name: 'Huara', lat: -19.9944, lng: -69.7883 }, { name: 'Pica', lat: -20.4932, lng: -69.3296 }
  ]},
  { id: 'II', name: 'Antofagasta', lat: -23.6470, lng: -70.3981, communes: [
    { name: 'Antofagasta', lat: -23.6470, lng: -70.3981 }, { name: 'Mejillones', lat: -23.1003, lng: -70.4474 }, { name: 'Sierra Gorda', lat: -22.8886, lng: -69.3220 }, { name: 'Taltal', lat: -25.4104, lng: -70.4824 }, { name: 'Calama', lat: -22.4628, lng: -68.9284 }, { name: 'Ollague', lat: -21.2238, lng: -68.2529 }, { name: 'San Pedro de Atacama', lat: -22.9100, lng: -68.2015 }, { name: 'Tocopilla', lat: -22.0905, lng: -70.1927 }, { name: 'Maria Elena', lat: -22.3439, lng: -69.6649 }
  ]},
  { id: 'III', name: 'Atacama', lat: -27.3664, lng: -70.3320, communes: [
    { name: 'Copiapo', lat: -27.3664, lng: -70.3320 }, { name: 'Caldera', lat: -27.0666, lng: -70.8209 }, { name: 'Tierra Amarilla', lat: -27.4822, lng: -70.2601 }, { name: 'Chanaral', lat: -26.3445, lng: -70.6183 }, { name: 'Diego de Almagro', lat: -26.3701, lng: -70.0505 }, { name: 'Vallenar', lat: -28.5779, lng: -70.7631 }, { name: 'Alto del Carmen', lat: -28.7591, lng: -70.4856 }, { name: 'Freirina', lat: -28.5079, lng: -71.0784 }, { name: 'Huasco', lat: -28.4697, lng: -71.2209 }
  ]},
  { id: 'IV', name: 'Coquimbo', lat: -29.9545, lng: -71.3406, communes: [
    { name: 'La Serena', lat: -29.9045, lng: -71.2506 }, { name: 'Coquimbo', lat: -29.9545, lng: -71.3406 }, { name: 'Andacollo', lat: -30.2340, lng: -71.0853 }, { name: 'La Higuera', lat: -29.5077, lng: -71.2747 }, { name: 'Paiguano', lat: -30.0252, lng: -70.4163 }, { name: 'Vicuna', lat: -30.0346, lng: -70.7041 }, { name: 'Illapel', lat: -31.6307, lng: -71.1670 }, { name: 'Canela', lat: -31.3913, lng: -71.3975 }, { name: 'Los Vilos', lat: -31.9072, lng: -71.5151 }, { name: 'Salamanca', lat: -31.7750, lng: -70.9693 }, { name: 'Ovalle', lat: -30.5998, lng: -71.1990 }, { name: 'Combarbala', lat: -31.1786, lng: -70.9983 }, { name: 'Monte Patria', lat: -30.6947, lng: -70.9528 }, { name: 'Punitaqui', lat: -30.8297, lng: -71.2623 }, { name: 'Rio Hurtado', lat: -30.2614, lng: -70.6981 }
  ]},
  { id: 'V', name: 'Valparaiso', lat: -33.0472, lng: -71.6127, communes: [
    { name: 'Valparaiso', lat: -33.0458, lng: -71.6197 }, { name: 'Vina del Mar', lat: -33.0245, lng: -71.5518 }, { name: 'Concon', lat: -32.9235, lng: -71.5135 }, { name: 'Quintero', lat: -32.7869, lng: -71.5329 }, { name: 'Puchuncavi', lat: -32.7253, lng: -71.4169 }, { name: 'Casablanca', lat: -33.3216, lng: -71.4053 }, { name: 'San Antonio', lat: -33.5929, lng: -71.6217 }, { name: 'Cartagena', lat: -33.5467, lng: -71.6073 }, { name: 'El Tabo', lat: -33.4580, lng: -71.6693 }, { name: 'El Quisco', lat: -33.3987, lng: -71.6948 }, { name: 'Algarrobo', lat: -33.3698, lng: -71.6680 }, { name: 'Santo Domingo', lat: -33.6383, lng: -71.6758 }, { name: 'Quillota', lat: -32.8797, lng: -71.2476 }, { name: 'La Calera', lat: -32.7908, lng: -71.2150 }, { name: 'La Cruz', lat: -32.8305, lng: -71.2421 }, { name: 'Nogales', lat: -32.7340, lng: -71.2096 }, { name: 'Hijuelas', lat: -32.7985, lng: -71.1472 }, { name: 'Los Andes', lat: -32.8337, lng: -70.5984 }, { name: 'San Esteban', lat: -32.8025, lng: -70.5793 }, { name: 'Calle Larga', lat: -32.8595, lng: -70.6276 }, { name: 'San Felipe', lat: -32.7497, lng: -70.7264 }, { name: 'Llay Llay', lat: -32.8433, lng: -70.9337 }, { name: 'Putaendo', lat: -32.6284, lng: -70.7213 }, { name: 'Santa Maria', lat: -32.7445, lng: -70.6636 }, { name: 'Panquehue', lat: -32.7751, lng: -70.8384 }, { name: 'Catemu', lat: -32.7779, lng: -70.9608 }, { name: 'Quilpue', lat: -33.0505, lng: -71.4427 }, { name: 'Villa Alemana', lat: -33.0446, lng: -71.3745 }, { name: 'Limache', lat: -32.9900, lng: -71.2646 }, { name: 'Olmué', lat: -32.9966, lng: -71.1866 }, { name: 'La Ligua', lat: -32.4494, lng: -71.2310 }, { name: 'Petorca', lat: -32.2524, lng: -70.9297 }, { name: 'Cabildo', lat: -32.4265, lng: -71.0650 }
  ]},
  { id: 'RM', name: 'Region Metropolitana', lat: -33.4489, lng: -70.6693, communes: [
    { name: 'Santiago', lat: -33.4489, lng: -70.6693 }, { name: 'Providencia', lat: -33.4313, lng: -70.6122 }, { name: 'Las Condes', lat: -33.4086, lng: -70.5750 }, { name: 'Vitacura', lat: -33.3848, lng: -70.5895 }, { name: 'Lo Barnechea', lat: -33.3464, lng: -70.5180 }, { name: 'La Reina', lat: -33.4500, lng: -70.5493 }, { name: 'Nunoa', lat: -33.4555, lng: -70.6002 }, { name: 'Macul', lat: -33.4844, lng: -70.5976 }, { name: 'Penalolen', lat: -33.4846, lng: -70.5435 }, { name: 'La Florida', lat: -33.5333, lng: -70.5833 }, { name: 'Puente Alto', lat: -33.6132, lng: -70.5752 }, { name: 'Maipu', lat: -33.5111, lng: -70.7565 }, { name: 'Pudahuel', lat: -33.4401, lng: -70.7575 }, { name: 'Quilicura', lat: -33.3667, lng: -70.7333 }, { name: 'Huechuraba', lat: -33.3686, lng: -70.6715 }, { name: 'Recoleta', lat: -33.4139, lng: -70.6325 }, { name: 'Independencia', lat: -33.4167, lng: -70.6510 }, { name: 'Conchali', lat: -33.3833, lng: -70.6667 }, { name: 'Renca', lat: -33.4035, lng: -70.7168 }, { name: 'Cerro Navia', lat: -33.4233, lng: -70.7414 }, { name: 'Lo Prado', lat: -33.4448, lng: -70.7255 }, { name: 'Quinta Normal', lat: -33.4431, lng: -70.6966 }, { name: 'Estacion Central', lat: -33.4527, lng: -70.6852 }, { name: 'Pedro Aguirre Cerda', lat: -33.4828, lng: -70.6693 }, { name: 'San Miguel', lat: -33.4904, lng: -70.6517 }, { name: 'San Joaquin', lat: -33.4811, lng: -70.6284 }, { name: 'La Cisterna', lat: -33.5359, lng: -70.6650 }, { name: 'San Ramon', lat: -33.5428, lng: -70.6426 }, { name: 'La Granja', lat: -33.5431, lng: -70.6111 }, { name: 'El Bosque', lat: -33.5658, lng: -70.6726 }, { name: 'San Bernardo', lat: -33.5925, lng: -70.6993 }, { name: 'Colina', lat: -33.2024, lng: -70.6745 }, { name: 'Lampa', lat: -33.2865, lng: -70.8775 }, { name: 'Til Til', lat: -33.0908, lng: -70.9328 }, { name: 'Pirque', lat: -33.6355, lng: -70.5701 }, { name: 'San Jose de Maipo', lat: -33.6420, lng: -70.3547 }, { name: 'Buin', lat: -33.7316, lng: -70.7450 }, { name: 'Paine', lat: -33.8085, lng: -70.7413 }, { name: 'Talagante', lat: -33.6658, lng: -70.9321 }, { name: 'Penaflor', lat: -33.6053, lng: -70.9160 }, { name: 'El Monte', lat: -33.6779, lng: -70.9816 }, { name: 'Isla de Maipo', lat: -33.7527, lng: -70.9002 }, { name: 'Melipilla', lat: -33.6886, lng: -71.2126 }, { name: 'Alhue', lat: -33.9650, lng: -71.0983 }, { name: 'Maria Pinto', lat: -33.5196, lng: -71.1176 }, { name: 'Curacavi', lat: -33.4053, lng: -71.1530 }, { name: 'Padre Hurtado', lat: -33.5682, lng: -70.8155 }
  ]},
  { id: 'VI', name: "Libertador B. O'Higgins", lat: -34.3848, lng: -70.8600, communes: [
    { name: 'Rancagua', lat: -34.1701, lng: -70.7406 }, { name: 'Machi', lat: -34.1829, lng: -70.6548 }, { name: 'Graneros', lat: -34.0652, lng: -70.7272 }, { name: 'San Fernando', lat: -34.5836, lng: -70.9900 }, { name: 'Santa Cruz', lat: -34.6364, lng: -71.3715 }, { name: 'Pichilemu', lat: -34.3866, lng: -72.0054 }, { name: 'Rengo', lat: -34.4081, lng: -70.8662 }
  ]},
  { id: 'VII', name: 'Maule', lat: -35.4274, lng: -71.6685, communes: [
    { name: 'Talca', lat: -35.4274, lng: -71.6685 }, { name: 'Curico', lat: -34.9829, lng: -71.2406 }, { name: 'Linares', lat: -35.8467, lng: -71.5932 }, { name: 'Constitucion', lat: -35.3333, lng: -72.4167 }, { name: 'Cauquenes', lat: -35.9667, lng: -72.3167 }, { name: 'Parral', lat: -36.1431, lng: -71.8298 }
  ]},
  { id: 'VIII', name: 'Biobio', lat: -36.8269, lng: -73.0503, communes: [
    { name: 'Concepcion', lat: -36.8269, lng: -73.0503 }, { name: 'Talcahuano', lat: -36.7249, lng: -73.1168 }, { name: 'Chillan', lat: -36.6067, lng: -72.1034 }, { name: 'Los Angeles', lat: -37.4708, lng: -72.3535 }, { name: 'Coronel', lat: -37.0170, lng: -73.1402 }, { name: 'Lota', lat: -37.0898, lng: -73.1577 }, { name: 'Lebu', lat: -37.6083, lng: -73.6556 }, { name: 'Canete', lat: -37.8008, lng: -73.4002 }
  ]},
  { id: 'IX', name: 'La Araucania', lat: -38.7330, lng: -72.5901, communes: [
    { name: 'Temuco', lat: -38.7330, lng: -72.5901 }, { name: 'Padre las Casas', lat: -38.7667, lng: -72.6000 }, { name: 'Villarrica', lat: -39.2856, lng: -72.2237 }, { name: 'Pucon', lat: -39.2751, lng: -71.9662 }, { name: 'Angol', lat: -37.7957, lng: -72.7089 }, { name: 'Victoria', lat: -38.2340, lng: -72.3347 }
  ]},
  { id: 'XIV', name: 'Los Rios', lat: -39.8196, lng: -73.2425, communes: [
    { name: 'Valdivia', lat: -39.8196, lng: -73.2425 }, { name: 'La Union', lat: -40.2935, lng: -73.0826 }, { name: 'Panguipulli', lat: -39.6446, lng: -72.3327 }
  ]},
  { id: 'X', name: 'Los Lagos', lat: -41.4724, lng: -72.9311, communes: [
    { name: 'Puerto Montt', lat: -41.4724, lng: -72.9311 }, { name: 'Puerto Varas', lat: -41.3178, lng: -72.9821 }, { name: 'Osorno', lat: -40.5747, lng: -73.1318 }, { name: 'Ancud', lat: -41.8712, lng: -73.8289 }, { name: 'Castro', lat: -42.4806, lng: -73.7760 }, { name: 'Chaiten', lat: -42.9196, lng: -72.7087 }
  ]},
  { id: 'XI', name: 'Aysen', lat: -45.5542, lng: -72.0476, communes: [
    { name: 'Coyhaique', lat: -45.5542, lng: -72.0476 }, { name: 'Aysen', lat: -45.4032, lng: -72.7007 }, { name: 'Chile Chico', lat: -46.5411, lng: -71.7262 }, { name: 'Cochrane', lat: -47.2552, lng: -72.5732 }
  ]},
  { id: 'XII', name: 'Magallanes', lat: -53.1587, lng: -70.9088, communes: [
    { name: 'Punta Arenas', lat: -53.1587, lng: -70.9088 }, { name: 'Puerto Natales', lat: -51.7274, lng: -72.5066 }, { name: 'Porvenir', lat: -53.2969, lng: -70.3722 }
  ]},
  { id: 'XVI', name: 'Nuble', lat: -36.6147, lng: -71.9638, communes: [
    { name: 'Chillan', lat: -36.6067, lng: -72.1034 }, { name: 'San Carlos', lat: -36.4247, lng: -71.9549 }, { name: 'Quirihue', lat: -36.2873, lng: -72.5363 }, { name: 'Bulnes', lat: -36.7428, lng: -72.3017 }, { name: 'Yungay', lat: -37.1196, lng: -72.0192 }
  ]},
]

export function getRegions() { return REGIONS.map(r => ({ id: r.id, name: r.name, lat: r.lat, lng: r.lng })) }
export function getRegionById(id: string) { return REGIONS.find(r => r.id === id) }
export function getCommunes(regionId: string) { return REGIONS.find(r => r.id === regionId)?.communes || [] }
export function getCommuneCoords(regionId: string, communeName: string) {
  const r = REGIONS.find(r => r.id === regionId)
  return r?.communes.find(c => c.name === communeName)
}
