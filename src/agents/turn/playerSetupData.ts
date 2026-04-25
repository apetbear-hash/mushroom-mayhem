export interface Portrait {
  id: string;
  emoji: string;
  name: string;
}

export interface ColorOption {
  id: string;
  hex: string;
  name: string;
}

export const PORTRAITS: Portrait[] = [
  { id: 'fox',      emoji: '🦊', name: 'Fox'      },
  { id: 'badger',   emoji: '🦡', name: 'Badger'   },
  { id: 'deer',     emoji: '🦌', name: 'Deer'     },
  { id: 'wolf',     emoji: '🐺', name: 'Wolf'     },
  { id: 'raccoon',  emoji: '🦝', name: 'Raccoon'  },
  { id: 'bear',     emoji: '🐻', name: 'Bear'     },
  { id: 'hedgehog', emoji: '🦔', name: 'Hedgehog' },
  { id: 'boar',     emoji: '🐗', name: 'Boar'     },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'blue',   hex: '#5c9ee0', name: 'Blue'   },
  { id: 'red',    hex: '#e05c5c', name: 'Red'    },
  { id: 'green',  hex: '#5ce07a', name: 'Green'  },
  { id: 'yellow', hex: '#e0c05c', name: 'Yellow' },
  { id: 'purple', hex: '#9b5ce0', name: 'Purple' },
];

export function portraitEmoji(id: string): string {
  return PORTRAITS.find(p => p.id === id)?.emoji ?? '🍄';
}
