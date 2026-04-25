export const HABITATS = ['tree', 'decay', 'shade', 'wet', 'open'] as const;
export const TYPES = ['mycorrhizal', 'saprophytic', 'parasitic', 'symbiotic', 'opportunistic'] as const;
export const RESOURCES = ['spore', 'moisture', 'sunlight'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const SEASON_TURNS: Record<typeof SEASONS[number], [number, number]> = {
  spring: [1, 5],
  summer: [6, 10],
  autumn: [11, 15],
  winter: [16, 20],
};

export const BOARD_SIZES: Record<number, number> = {
  2: 24,
  3: 30,
  4: 35,
};

export const HABITAT_COLORS: Record<string, string> = {
  tree:  '#4A6741',
  decay: '#9E5A40',
  shade: '#6B4E8B',
  wet:   '#2D7D7B',
  open:  '#D4A843',
};

export const TYPE_COLORS: Record<string, string> = {
  mycorrhizal:   '#4A6741',
  saprophytic:   '#9E5A40',
  parasitic:     '#B8423C',
  symbiotic:     '#6B4E8B',
  opportunistic: '#D4A843',
};

export const RESOURCE_COLORS: Record<string, string> = {
  spore:    '#8B6F47',
  moisture: '#3A6EA8',
  sunlight: '#D4A843',
};

export const TOTAL_TURNS = 20;
export const TURNS_PER_SEASON = 5;
export const STARTING_NETWORK_SIZE = 3;
export const STARTING_SPORE = 1;
export const STARTING_MOISTURE = 1;
export const STARTING_SUNLIGHT = 1;
export const STARTING_HAND_SIZE = 5;
export const MIN_HAND_AFTER_DRAFT = 1;
export const SPORES_PER_DRAFT_DISCARD = 1;
export const DRAW_COST = 1; // base cost: 1st card=1☀️, 2nd=2☀️, 3rd=3☀️ (escalates each draw within a turn)
export const REST_GAIN = 1; // each resource
export const TOTAL_CARDS = 50;
