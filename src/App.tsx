import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Info, 
  ChevronRight,
  Heart,
  Diamond,
  Club,
  Spade,
  AlertCircle
} from 'lucide-react';
import { Card, GameState, Suit, GameStatus, Turn } from './types';
import { 
  createDeck, 
  shuffle, 
  isValidMove, 
  SUIT_SYMBOLS, 
  SUIT_COLORS, 
  SUITS 
} from './constants';

// --- Components ---

const SuitIcon = ({ suit, className = "" }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={`fill-current ${className}`} />;
    case 'diamonds': return <Diamond className={`fill-current ${className}`} />;
    case 'clubs': return <Club className={`fill-current ${className}`} />;
    case 'spades': return <Spade className={`fill-current ${className}`} />;
  }
};

const CardComponent = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  isSmall = false,
  className = ""
}: { 
  card: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void;
  isPlayable?: boolean;
  isSmall?: boolean;
  className?: string;
  key?: React.Key; // Added key to props type to satisfy linter
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative ${isSmall ? 'w-16 h-24' : 'w-24 h-36 md:w-28 md:h-40'} 
        rounded-xl border-2 transition-all duration-200
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-700 border-indigo-400'}
        ${isPlayable ? 'cursor-pointer ring-4 ring-yellow-400 ring-opacity-50 shadow-xl' : 'shadow-md'}
        flex flex-col items-center justify-center select-none
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className={`absolute top-2 left-2 flex flex-col items-center leading-none ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-4 h-4" />
          </div>
          <div className={`text-4xl ${SUIT_COLORS[card.suit]}`}>
            <SuitIcon suit={card.suit} className="w-10 h-10" />
          </div>
          <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-4 h-4" />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
          <div className="w-full h-full bg-indigo-800 opacity-20 grid grid-cols-4 gap-1 p-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-white rounded-sm" />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center">
                <span className="text-white font-serif italic text-xl">T</span>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentTurn: 'player',
    status: 'dealing',
    winner: null,
    pendingSuitChange: false,
    currentSuit: null,
  });

  const [message, setMessage] = useState("Welcome to Tina's Crazy Eights!");

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.slice(0, 8);
    const aiHand = fullDeck.slice(8, 16);
    const remainingDeck = fullDeck.slice(16);
    
    // Find first non-8 card for discard pile
    let firstDiscardIndex = 0;
    while (remainingDeck[firstDiscardIndex].rank === '8') {
      firstDiscardIndex++;
    }
    
    const initialDiscard = remainingDeck.splice(firstDiscardIndex, 1);

    setGameState({
      deck: remainingDeck,
      playerHand,
      aiHand,
      discardPile: initialDiscard,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      pendingSuitChange: false,
      currentSuit: null,
    });
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  // Handle Player Move
  const handlePlayCard = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    if (isValidMove(card, topCard, gameState.currentSuit)) {
      const newPlayerHand = gameState.playerHand.filter(c => c.id !== card.id);
      const newDiscardPile = [...gameState.discardPile, card];

      if (newPlayerHand.length === 0) {
        setGameState(prev => ({
          ...prev,
          playerHand: newPlayerHand,
          discardPile: newDiscardPile,
          status: 'game_over',
          winner: 'player'
        }));
        return;
      }

      if (card.rank === '8') {
        setGameState(prev => ({
          ...prev,
          playerHand: newPlayerHand,
          discardPile: newDiscardPile,
          status: 'suit_selection',
          pendingSuitChange: true
        }));
        setMessage("Crazy 8! Choose a new suit.");
      } else {
        setGameState(prev => ({
          ...prev,
          playerHand: newPlayerHand,
          discardPile: newDiscardPile,
          currentTurn: 'ai',
          currentSuit: null
        }));
        setMessage("AI is thinking...");
      }
    }
  };

  const handleDrawCard = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    if (gameState.deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setTimeout(() => {
        setGameState(prev => ({ ...prev, currentTurn: 'ai' }));
      }, 1000);
      return;
    }

    const [drawnCard, ...remainingDeck] = gameState.deck;
    const newHand = [...gameState.playerHand, drawnCard];
    
    setGameState(prev => ({
      ...prev,
      deck: remainingDeck,
      playerHand: newHand,
      currentTurn: 'ai'
    }));
    setMessage(`You drew ${drawnCard.rank} of ${drawnCard.suit}. AI's turn.`);
  };

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      currentSuit: suit,
      status: 'playing',
      pendingSuitChange: false,
      currentTurn: 'ai'
    }));
    setMessage(`Suit changed to ${suit}. AI's turn.`);
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing') {
      const aiTimer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(c => isValidMove(c, topCard, gameState.currentSuit));
        
        if (playableCards.length > 0) {
          // AI Strategy: Prefer non-8s first, then 8s
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];
          
          const newAiHand = gameState.aiHand.filter(c => c.id !== cardToPlay.id);
          const newDiscardPile = [...gameState.discardPile, cardToPlay];

          if (newAiHand.length === 0) {
            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              status: 'game_over',
              winner: 'ai'
            }));
            return;
          }

          if (cardToPlay.rank === '8') {
            // AI picks its most frequent suit
            const suitCounts = newAiHand.reduce((acc, c) => {
              acc[c.suit] = (acc[c.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            
            const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || 'hearts';
            
            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentSuit: bestSuit,
              currentTurn: 'player'
            }));
            setMessage(`AI played an 8 and changed suit to ${bestSuit}! Your turn.`);
          } else {
            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentTurn: 'player',
              currentSuit: null
            }));
            setMessage(`AI played ${cardToPlay.rank} of ${cardToPlay.suit}. Your turn.`);
          }
        } else {
          // AI must draw
          if (gameState.deck.length > 0) {
            const [drawnCard, ...remainingDeck] = gameState.deck;
            setGameState(prev => ({
              ...prev,
              deck: remainingDeck,
              aiHand: [...prev.aiHand, drawnCard],
              currentTurn: 'player'
            }));
            setMessage("AI had no moves and drew a card. Your turn.");
          } else {
            setGameState(prev => ({ ...prev, currentTurn: 'player' }));
            setMessage("AI had no moves and deck is empty. Your turn.");
          }
        }
      }, 1500);

      return () => clearTimeout(aiTimer);
    }
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.deck, gameState.discardPile, gameState.currentSuit, topCard]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-4 felt-texture relative">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold italic tracking-tight text-white">帅气无敌的黄</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/10">
            <Info className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/80">8 is Wild • Match Suit or Rank</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-1 w-full max-w-6xl grid grid-rows-[auto_1fr_auto] gap-4 py-4">
        
        {/* AI Hand */}
        <section className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">AI Opponent ({gameState.aiHand.length})</span>
          </div>
          <div className="flex -space-x-12 md:-space-x-16 overflow-visible h-32 md:h-40 items-center justify-center">
            <AnimatePresence>
              {gameState.aiHand.map((card, idx) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isFaceUp={false} 
                  className="z-0"
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Center: Deck & Discard */}
        <section className="flex items-center justify-center gap-8 md:gap-16">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {gameState.deck.length > 0 ? (
                <>
                  <div className="absolute top-1 left-1 w-24 h-36 md:w-28 md:h-40 bg-indigo-900 rounded-xl border-2 border-indigo-400/30 -z-10" />
                  <CardComponent 
                    card={gameState.deck[0]} 
                    isFaceUp={false} 
                    isPlayable={gameState.currentTurn === 'player' && gameState.status === 'playing'}
                    onClick={handleDrawCard}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    {gameState.deck.length}
                  </div>
                </>
              ) : (
                <div className="w-24 h-36 md:w-28 md:h-40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-white/20 text-xs font-mono">EMPTY</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Draw Pile</span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {gameState.discardPile.length > 1 && (
                <CardComponent 
                  card={gameState.discardPile[gameState.discardPile.length - 2]} 
                  className="absolute top-1 left-1 -z-10 rotate-3 opacity-50"
                />
              )}
              <CardComponent card={topCard} />
              
              {/* Current Suit Indicator (for 8s) */}
              {gameState.currentSuit && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-xl border-2 border-yellow-400 flex items-center justify-center"
                >
                  <SuitIcon suit={gameState.currentSuit} className={`w-6 h-6 ${SUIT_COLORS[gameState.currentSuit]}`} />
                </motion.div>
              )}
            </div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Discard Pile</span>
          </div>
        </section>

        {/* Player Hand */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white/60">
            <User className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Your Hand ({gameState.playerHand.length})</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-4xl px-4">
            <AnimatePresence>
              {gameState.playerHand.map((card) => (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isPlayable={gameState.currentTurn === 'player' && gameState.status === 'playing' && isValidMove(card, topCard, gameState.currentSuit)}
                  onClick={() => handlePlayCard(card)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Footer / Status Bar */}
      <footer className="w-full max-w-5xl mt-4 z-10">
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${gameState.currentTurn === 'player' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            <p className="text-sm md:text-base font-medium text-white/90">{message}</p>
          </div>
          
          {gameState.currentTurn === 'player' && gameState.status === 'playing' && (
             <div className="flex items-center gap-2">
                <button 
                  onClick={handleDrawCard}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10"
                >
                  Draw Card <ChevronRight className="w-3 h-3" />
                </button>
             </div>
          )}
        </div>
      </footer>

      {/* Modals & Overlays */}

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {gameState.status === 'suit_selection' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-emerald-950 border border-white/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <h2 className="text-3xl font-serif font-bold italic text-white mb-2">Crazy 8!</h2>
              <p className="text-white/60 mb-8">Choose the new suit to play</p>
              
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  >
                    <SuitIcon suit={suit} className={`w-12 h-12 ${SUIT_COLORS[suit]} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  {gameState.winner === 'player' ? (
                    <Trophy className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  )}
                </div>
              </div>

              <h2 className="text-4xl font-serif font-bold italic text-slate-900 mb-2">
                {gameState.winner === 'player' ? 'You Won!' : 'AI Won!'}
              </h2>
              <p className="text-slate-500 mb-8">
                {gameState.winner === 'player' 
                  ? 'Incredible strategy! You cleared all your cards.' 
                  : 'Better luck next time! The AI was too fast.'}
              </p>

              <button
                onClick={initGame}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
