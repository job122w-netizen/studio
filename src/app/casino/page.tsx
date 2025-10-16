
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins, Ticket, Gem, Star, CupSoda, Bomb, HelpCircle, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateCasinoChips } from "@/lib/transactions";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// --- Slot Machine Config ---
const slotSymbols = [
    { icon: Coins, id: 'coins', label: 'Lingotes' },
    { icon: Ticket, id: 'ticket', label: 'Fichas' },
    { icon: Gem, id: 'gem', label: 'Gemas' },
    { icon: Star, id: 'star', label: 'Pase Premium' },
];

const prizeTable = [
    { icon: Star, label: 'Pase HV Premium', combo: [Star, Star, Star] },
    { icon: Gem, label: '20 Gemas', combo: [Gem, Gem, Gem] },
    { icon: Coins, label: '80 Lingotes de Oro', combo: [Coins, Coins, Coins] },
    { icon: Ticket, label: '100 Fichas de Casino', combo: [Ticket, Ticket, Ticket] },
];

const ReelIcon = ({ symbol, isSpinning }: { symbol: { icon: React.ElementType, id: string }, isSpinning: boolean }) => {
    const Icon = symbol.icon;
    return <Icon className={cn("h-16 w-16 sm:h-20 sm:w-20 transition-transform duration-100", isSpinning && "animate-spin", {
        'text-yellow-500': symbol.id === 'coins',
        'text-red-400': symbol.id === 'ticket',
        'text-purple-400': symbol.id === 'gem',
        'text-yellow-400': symbol.id === 'star',
    })} />;
}
// -------------------------

// --- Shell Game Config ---
type CupState = { id: number; hasPrize: boolean; isRevealed: boolean };
type ShellGamePhase = 'betting' | 'shuffling' | 'picking' | 'result';

const Cup = ({ isRevealed, hasPrize, isShuffling, onClick, phase }: { isRevealed: boolean, hasPrize: boolean, isShuffling: boolean, onClick: () => void, phase: ShellGamePhase }) => (
    <div
        className={cn(
            "relative transition-transform duration-300",
            phase === 'picking' && "cursor-pointer hover:scale-110",
            isShuffling && "animate-pulse"
        )}
        onClick={onClick}
    >
        <CupSoda className="h-24 w-24 text-primary" />
        {isRevealed && hasPrize && (
            <Ticket className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-red-500 animate-fade-in" />
        )}
    </div>
);
// -------------------------


// --- Minesweeper Game Config ---
const GRID_SIZE = 25;
const BOMB_COUNT = 20;
const PRIZE_COUNT = 5;

type MineCellContent = 'bomb' | 'gem' | 'goldLingot' | 'casinoChip' | 'premiumPass' | 'empty';
type MineCell = {
    id: number;
    state: 'hidden' | 'revealed';
    content: MineCellContent;
};
type MineSweeperPhase = 'betting' | 'playing' | 'gameOver';

const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
};

const MineCellDisplay = ({ cell, onClick }: { cell: MineCell, onClick: () => void }) => {
    const renderContent = () => {
        if (cell.state === 'hidden') {
            return <HelpCircle className="h-6 w-6 text-muted-foreground" />;
        }
        switch (cell.content) {
            case 'bomb': return <Bomb className="h-6 w-6 text-destructive animate-fade-in" />;
            case 'gem': return <Gem className="h-6 w-6 text-purple-400 animate-fade-in" />;
            case 'goldLingot': return <Coins className="h-6 w-6 text-yellow-500 animate-fade-in" />;
            case 'casinoChip': return <Ticket className="h-6 w-6 text-red-400 animate-fade-in" />;
            case 'premiumPass': return <Star className="h-6 w-6 text-yellow-400 animate-fade-in" />;
            default: return null;
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={cell.state === 'revealed'}
            className={cn(
                "w-full aspect-square flex items-center justify-center rounded-md transition-all duration-200",
                cell.state === 'hidden' ? "bg-muted hover:bg-muted/80" : "bg-card",
                cell.content === 'bomb' && cell.state === 'revealed' && "bg-destructive/20",
                cell.content !== 'bomb' && cell.state === 'revealed' && "bg-primary/20",
            )}
        >
            {renderContent()}
        </button>
    );
};
// -------------------------


export default function CasinoPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Game States
    const [dice1, setDice1] = useState(5);
    const [dice2, setDice2] = useState(1);
    const [rolling, setRolling] = useState(false);
    const [diceResultMessage, setDiceResultMessage] = useState('');

    const [reels, setReels] = useState([slotSymbols[0], slotSymbols[1], slotSymbols[2]]);
    const [spinning, setSpinning] = useState(false);
    const [slotResultMessage, setSlotResultMessage] = useState('');
    const [reelsSpinning, setReelsSpinning] = useState([false, false, false]);

    const [shellGamePhase, setShellGamePhase] = useState<ShellGamePhase>('betting');
    const [cups, setCups] = useState<CupState[]>([
        { id: 0, hasPrize: false, isRevealed: false },
        { id: 1, hasPrize: false, isRevealed: false },
        { id: 2, hasPrize: false, isRevealed: false },
    ]);
    const [shellResultMessage, setShellResultMessage] = useState('');
    const shellBetAmount = 1;

    const [minePhase, setMinePhase] = useState<MineSweeperPhase>('betting');
    const [mineGrid, setMineGrid] = useState<MineCell[]>([]);
    const [foundPrizes, setFoundPrizes] = useState<MineCellContent[]>([]);
    
    // User Profile Data
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
    
    // Derived State
    const isLoading = isUserLoading || isProfileLoading;
    const casinoChips = userProfile?.casinoChips ?? 0;
    const isChipCountInvalid = typeof casinoChips !== 'number' || isNaN(casinoChips);
    const multiplier = userProfile?.mineSweeperMultiplier ?? 1;

    // Game Logic Functions
    const rollDice = async () => {
        if (!userProfileRef || casinoChips < 1) {
            toast({ variant: 'destructive', title: '¡No tienes suficientes fichas!'});
            return;
        }

        setRolling(true);
        setDiceResultMessage('');
        await updateCasinoChips(userProfileRef, -1);

        let rollCount = 0;
        const interval = setInterval(() => {
            const newDice1 = Math.floor(Math.random() * 6);
            const newDice2 = Math.floor(Math.random() * 6);
            setDice1(newDice1);
            setDice2(newDice2);
            rollCount++;
            if (rollCount > 10) {
                clearInterval(interval);
                setRolling(false);
                if (newDice1 === newDice2) {
                    setDiceResultMessage('¡Ganaste 2 fichas!');
                     updateCasinoChips(userProfileRef, 2);
                } else {
                    setDiceResultMessage('¡No hubo suerte! Inténtalo de nuevo.');
                }
            }
        }, 100);
    };

     const spinSlots = async () => {
        const cost = 2;
        if (!userProfileRef || casinoChips < cost) {
            toast({ variant: 'destructive', title: '¡No tienes suficientes fichas!'});
            return;
        }

        setSpinning(true);
        setSlotResultMessage('');
        await updateCasinoChips(userProfileRef, -cost);
        
        let finalReelsResult: typeof slotSymbols = [...reels];
        setReelsSpinning([true, true, true]);

        const spinIntervals = finalReelsResult.map((_, index) => {
            return setInterval(() => {
                setReels(currentReels => {
                    const newReels = [...currentReels];
                    newReels[index] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
                    return newReels;
                });
            }, 100);
        });

        const stopReel = (index: number) => {
            clearInterval(spinIntervals[index]);
            const finalSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            finalReelsResult[index] = finalSymbol;
            setReels(current => {
                const newReels = [...current];
                newReels[index] = finalSymbol;
                return newReels;
            });
            setReelsSpinning(s => {
                const newSpinning = [...s];
                newSpinning[index] = false;
                return newSpinning;
            });

            if (index === finalReelsResult.length - 1) {
                setSpinning(false);
                checkWin(finalReelsResult);
            }
        };

        setTimeout(() => stopReel(0), 1000);
        setTimeout(() => stopReel(1), 2000);
        setTimeout(() => stopReel(2), 3000);
    };

    const checkWin = async (finalReels: typeof slotSymbols) => {
        if (!userProfileRef) return;
    
        const [reel1, reel2, reel3] = finalReels;
    
        if (reel1.id === reel2.id && reel2.id === reel3.id) {
            const winningSymbol = reel1.id;
            let toastTitle = "¡Has Ganado!";
            let toastDescription = "";
    
            switch (winningSymbol) {
                case 'star':
                    toastTitle = "¡¡¡PREMIO MAYOR!!!";
                    toastDescription = "¡Has ganado el Pase HV Premium!";
                    break;
                case 'gem':
                    toastDescription = "¡Has ganado 20 Gemas!";
                    break;
                case 'coins':
                    toastDescription = "¡Has ganado 80 Lingotes de Oro!";
                    break;
                case 'ticket':
                    await updateCasinoChips(userProfileRef, 100);
                    toastDescription = "¡Has ganado 100 Fichas de Casino!";
                    break;
                default:
                    setSlotResultMessage('¡Mala suerte! Sigue intentando.');
                    return;
            }
    
            setSlotResultMessage(toastDescription);
            toast({ title: toastTitle, description: toastDescription });
            return;
        }
    
        if (reel1.id === reel2.id || reel1.id === reel3.id || reel2.id === reel3.id) {
            await updateCasinoChips(userProfileRef, 2);
            setSlotResultMessage("¡Casi! Recuperas tus 2 fichas.");
            return;
        }
    
        setSlotResultMessage('¡Mala suerte! Sigue intentando.');
    };

    const startShellGame = async () => {
        if (!userProfileRef || casinoChips < shellBetAmount) {
            toast({ variant: 'destructive', title: '¡No tienes suficientes fichas!'});
            return;
        }
        if (shellBetAmount < 1) {
            setShellResultMessage('La apuesta mínima es 1 ficha.');
            return;
        }

        await updateCasinoChips(userProfileRef, -shellBetAmount);
        setShellGamePhase('shuffling');
        setShellResultMessage('Observa con atención...');

        const winningCupIndex = Math.floor(Math.random() * 3);
        const initialCups = cups.map((cup, index) => ({
            ...cup,
            hasPrize: index === winningCupIndex,
            isRevealed: true,
        }));
        setCups(initialCups);

        setTimeout(() => {
            const hiddenPrizeCups = initialCups.map(c => ({...c, isRevealed: false}));
            
            setTimeout(() => {
                 const shuffledCups = shuffleArray(hiddenPrizeCups);
                 setCups(shuffledCups);
                setShellGamePhase('picking');
                setShellResultMessage('¿Dónde está la ficha?');
            }, 2500); 
        }, 1500);
    };

    const handleCupPick = async (pickedCup: CupState) => {
        if (shellGamePhase !== 'picking' || !userProfileRef) return;

        setShellGamePhase('result');
        setCups(cups.map(cup => ({ ...cup, isRevealed: true })));

        if (pickedCup.hasPrize) {
            const winnings = shellBetAmount * 2;
            setShellResultMessage(`¡Correcto! ¡Has ganado ${winnings} fichas!`);
            await updateCasinoChips(userProfileRef, winnings);
        } else {
            setShellResultMessage('¡Incorrecto! Mejor suerte la próxima vez.');
        }
    };
    
    const resetShellGame = () => {
        setShellGamePhase('betting');
        setShellResultMessage('');
        setCups(cups.map(cup => ({...cup, hasPrize: false, isRevealed: false})));
    };

    const startMineSweeper = async () => {
        const cost = 5;
        if (!userProfileRef || casinoChips < cost) {
            toast({ variant: 'destructive', title: 'Fichas insuficientes' });
            return;
        }

        await updateCasinoChips(userProfileRef, -cost);
        setMinePhase('playing');
        setFoundPrizes([]);

        const content: MineCellContent[] = Array(BOMB_COUNT).fill('bomb');
        let prizes: MineCellContent[] = ['gem', 'goldLingot', 'casinoChip', 'empty', 'empty'];
        if ((userProfile?.mineSweeperMultiplier ?? 1) >= 20 && Math.random() < 0.1) { // 10% chance for premium pass at max multiplier
            prizes[Math.floor(Math.random() * prizes.length)] = 'premiumPass';
        }
        content.push(...prizes);
        while (content.length < GRID_SIZE) {
            content.push('empty');
        }

        const shuffledContent = shuffleArray(content);

        setMineGrid(shuffledContent.map((c, i) => ({ id: i, state: 'hidden', content: c })));
    };

    const handleCellClick = (cell: MineCell) => {
        if (minePhase !== 'playing' || cell.state === 'revealed' || !userProfileRef) return;

        const newGrid = [...mineGrid];
        newGrid[cell.id] = { ...cell, state: 'revealed' };
        setMineGrid(newGrid);

        if (cell.content === 'bomb') {
            setMinePhase('gameOver');
            toast({ variant: 'destructive', title: '¡BOOM!', description: 'Has encontrado una bomba. El multiplicador se ha reiniciado.' });
            
            // Reveal all bombs
            setTimeout(() => {
                 setMineGrid(currentGrid => currentGrid.map(c => c.content === 'bomb' ? { ...c, state: 'revealed' } : c));
            }, 1000);
        } else if (cell.content !== 'empty') {
            setFoundPrizes(prev => [...prev, cell.content]);
        }
    };

    const cashOutMines = async () => {
        if (!userProfileRef || foundPrizes.length === 0) {
            setMinePhase('betting');
            return;
        };

        const currentMultiplier = userProfile?.mineSweeperMultiplier ?? 1;
        let chipWinnings = 0;
        let description = 'Has cobrado tus premios: ';

        foundPrizes.forEach(prize => {
            if (prize === 'casinoChip') {
                chipWinnings += currentMultiplier;
                description += `${currentMultiplier} fichas, `;
            }
        });

        if (chipWinnings > 0) {
            await updateCasinoChips(userProfileRef, chipWinnings);
        }

        toast({ title: `¡Premios cobrados! (x${currentMultiplier})`, description: description.slice(0, -2) });
        setMinePhase('betting');
    };
    
    return (
        <div className="space-y-8 animate-fade-in pb-16">
            <section className="text-center">
                <h1 className="text-3xl font-bold font-headline text-foreground">Casino HV</h1>
                <p className="text-muted-foreground mt-2">¡Prueba tu suerte y gana grandes premios!</p>
            </section>
            
             <div className="text-center">
                 {isLoading ? (
                    <Skeleton className="h-8 w-48 mx-auto" />
                 ) : (
                    <p className="text-lg font-semibold text-foreground">Tu saldo: <span className="text-primary">{casinoChips.toLocaleString('es-ES')}</span> Fichas</p>
                 )}
            </div>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Campo Minado de la Fortuna</CardTitle>
                    <CardDescription>Cuesta 5 fichas. Encuentra los 5 premios sin explotar las 20 bombas. ¡Cobra cuando quieras!</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {minePhase !== 'betting' && (
                        <>
                            <div className="grid grid-cols-5 gap-2 w-full">
                                {mineGrid.map(cell => (
                                    <MineCellDisplay key={cell.id} cell={cell} onClick={() => handleCellClick(cell)} />
                                ))}
                            </div>
                            <Alert>
                                <Gift className="h-4 w-4" />
                                <AlertTitle className="flex justify-between items-center">
                                    Premios Encontrados (x{multiplier})
                                    <span className="text-xs text-muted-foreground">Bombas: {BOMB_COUNT} | Premios: {PRIZE_COUNT}</span>
                                </AlertTitle>
                                <AlertDescription>
                                    {foundPrizes.length > 0 ? (
                                        <div className="flex gap-4 mt-2">
                                            {foundPrizes.map((prize, i) => {
                                                if (prize === 'gem') return <Gem key={i} className="h-5 w-5 text-purple-400" />;
                                                if (prize === 'goldLingot') return <Coins key={i} className="h-5 w-5 text-yellow-500" />;
                                                if (prize === 'casinoChip') return <Ticket key={i} className="h-5 w-5 text-red-400" />;
                                                if (prize === 'premiumPass') return <Star key={i} className="h-5 w-5 text-yellow-400" />;
                                                return null;
                                            })}
                                        </div>
                                    ) : (
                                        <p>Aún no has encontrado premios.</p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    {minePhase === 'betting' && (
                        <Button size="lg" className="w-full" onClick={startMineSweeper} disabled={isLoading || casinoChips < 5 || isChipCountInvalid}>
                            Jugar (5 Fichas)
                        </Button>
                    )}
                    {minePhase === 'playing' && (
                        <Button size="lg" className="w-full" onClick={cashOutMines} disabled={foundPrizes.length === 0}>
                            Cobrar Premios y Salir
                        </Button>
                    )}
                    {minePhase === 'gameOver' && (
                         <Button size="lg" className="w-full" onClick={() => setMinePhase('betting')}>
                            Jugar de Nuevo
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                 <CardHeader>
                    <CardTitle>Juego de los Vasos</CardTitle>
                    <CardDescription>Apuesta 1 ficha y adivina dónde está la ficha ganadora. ¡Gana el doble de tu apuesta!</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex justify-around w-full min-h-[120px] items-center">
                        {cups.map((cup) => (
                             <Cup
                                key={cup.id}
                                isRevealed={cup.isRevealed}
                                hasPrize={cup.hasPrize}
                                isShuffling={shellGamePhase === 'shuffling'}
                                onClick={() => handleCupPick(cup)}
                                phase={shellGamePhase}
                            />
                        ))}
                    </div>
                     {shellResultMessage && <p className="text-foreground font-semibold text-center h-5">{shellResultMessage}</p>}
                </CardContent>
                <CardFooter>
                    {shellGamePhase === 'betting' && (
                        <Button size="lg" className="w-full" onClick={startShellGame} disabled={isLoading || (casinoChips < shellBetAmount) || isChipCountInvalid}>
                            Jugar (1 Ficha)
                        </Button>
                    )}
                     {(shellGamePhase === 'result') && (
                        <Button size="lg" className="w-full" onClick={resetShellGame} >
                            Jugar de Nuevo
                        </Button>
                     )}
                     {(shellGamePhase === 'shuffling' || shellGamePhase === 'picking') && (
                        <Button size="lg" className="w-full" disabled>
                            {shellGamePhase === 'shuffling' ? 'Mezclando...' : 'Elige un vaso...'}
                        </Button>
                     )}
                </CardFooter>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Tragamonedas HV</CardTitle>
                    <CardDescription>¡Alinea 3 símbolos para ganar! Cuesta 2 fichas por tirada.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="w-full bg-muted/30 p-2 rounded-lg border">
                        <div className="text-center mb-2">
                             <p className="text-sm font-bold text-muted-foreground tracking-wider uppercase">Grandes Premios</p>
                             <div className="flex justify-center items-center gap-4 text-xs font-semibold">
                                 <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400"/> Pase Premium</div>
                                 <div className="flex items-center gap-1"><Gem className="h-4 w-4 text-purple-400"/> Gemas</div>
                             </div>
                        </div>
                        <div className="flex justify-center gap-4 sm:gap-8 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                           {reels.map((symbol, index) => (
                              <ReelIcon key={index} symbol={symbol} isSpinning={reelsSpinning[index]} />
                           ))}
                        </div>
                    </div>
                     {slotResultMessage && <p className="text-foreground font-semibold text-center h-5">{slotResultMessage}</p>}
                    <div className="w-full p-4 border rounded-lg bg-card">
                         <h4 className="text-center font-bold mb-3 text-muted-foreground">Tabla de Premios</h4>
                         <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {prizeTable.map((prize) => {
                                const PrizeIcon = prize.icon;
                                return (
                                <div key={prize.label} className="flex items-center gap-2">
                                     <div className="flex items-center gap-0.5">
                                        {prize.combo.map((Icon, i) => <Icon key={i} className="h-4 w-4 text-yellow-400"/>)}
                                     </div>
                                     <span className="font-semibold">{prize.label}</span>
                                </div>
                                )
                            })}
                         </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={spinSlots} disabled={spinning || isLoading || casinoChips < 2 || isChipCountInvalid}>
                        {spinning ? 'Girando...' : 'Girar (2 Fichas)'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg hover-shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Lanzamiento de Dados</CardTitle>
                    <CardDescription>Apuesta 1 ficha de casino y gana el doble si sacas pares.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                        {(() => {
                            const Dice1Icon = diceIcons[dice1];
                            const Dice2Icon = diceIcons[dice2];
                            return <>
                                <Dice1Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                                <Dice2Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                            </>
                        })()}
                    </div>
                     {diceResultMessage && <p className="text-foreground font-semibold">{diceResultMessage}</p>}
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={rollDice} disabled={rolling || isLoading || casinoChips < 1 || isChipCountInvalid}>
                        {rolling ? 'Lanzando...' : 'Lanzar Dados (1 Ficha)'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lotería Semanal</CardTitle>
                    <CardDescription>Compra un boleto y participa por un premio mayor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-3xl font-bold text-primary">Premio Mayor: 50,000 <span className="inline-block align-middle"><Coins className="h-6 w-6"/></span></p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" disabled>
                        <Ticket className="mr-2 h-4 w-4"/>
                        Próximamente
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

    