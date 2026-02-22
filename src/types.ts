export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'dealing' | 'playing' | 'suit_selection' | 'game_over';
export type Turn = 'player' | 'ai';

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  aiHand: Card[];
  discardPile: Card[];
  currentTurn: Turn;
  status: GameStatus;
  winner: Turn | null;
  pendingSuitChange: boolean;
  currentSuit: Suit | null; // The suit to match (can be changed by 8)
}
