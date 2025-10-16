
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins, Ticket, Gem, Star, CupSoda } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

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


type CupState = { id: number; hasPrize: boolean; isRevealed: boolean };
type ShellGamePhase = 'betting' | 'shuffling' | 'picking' | 'result';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array]; // Create a copy
  
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }
  
    return newArray;
};
// -------------------------


export default function CasinoPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    // Dice Game State
    const [dice1, setDice1] = useState(5);
    const [dice2, setDice2] = useState(1);
    const [rolling, setRolling] = useState(false);
    const [diceResultMessage, setDiceResultMessage] = useState('');

    // Slot Machine State
    const [reels, setReels] = useState([slotSymbols[0], slotSymbols[1], slotSymbols[2]]);
    const [spinning, setSpinning] = useState(false);
    const [slotResultMessage, setSlotResultMessage] = useState('');
    const [reelsSpinning, setReelsSpinning] = useState([false, false, false]);

    // Shell Game State
    const [shellGamePhase, setShellGamePhase] = useState<ShellGamePhase>('betting');
    const [cups, setCups] = useState<CupState[]>([
        { id: 0, hasPrize: false, isRevealed: false },
        { id: 1, hasPrize: false, isRevealed: false },
        { id: 2, hasPrize: false, isRevealed: false },
    ]);
    const [betAmount, setBetAmount] = useState([1]);
    const [shellResultMessage, setShellResultMessage] = useState('');


    const rollDice = () => {
        if (!userProfileRef || (userProfile?.casinoChips ?? 0) < 1) {
            setDiceResultMessage('¡No tienes suficientes fichas!');
            return;
        }

        setRolling(true);
        setDiceResultMessage('');
        updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(-1) });

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
                    updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(2) });
                } else {
                    setDiceResultMessage('¡No hubo suerte! Inténtalo de nuevo.');
                }
            }
        }, 100);
    };

     const spinSlots = () => {
        const cost = 2;
        if (!userProfileRef || (userProfile?.casinoChips ?? 0) < cost) {
            setSlotResultMessage('¡No tienes suficientes fichas!');
            return;
        }

        setSpinning(true);
        setSlotResultMessage('');
        updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(-cost) });
        
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

    const checkWin = (finalReels: typeof slotSymbols) => {
        if (!userProfileRef) return;
    
        const [reel1, reel2, reel3] = finalReels;
    
        // Check for three of a kind (Jackpot)
        if (reel1.id === reel2.id && reel2.id === reel3.id) {
            const winningSymbol = reel1.id;
            let updates = {};
            let toastTitle = "¡Has Ganado!";
            let toastDescription = "";
    
            switch (winningSymbol) {
                case 'star':
                    if (userProfile?.hasPremiumPass) {
                        updates = { gems: increment(20) };
                        toastTitle = "¡PREMIO MAYOR, OTRA VEZ!";
                        toastDescription = "Ya tienes el Pase Premium, ¡así que recibes 20 gemas!";
                    } else {
                        updates = { hasPremiumPass: true };
                        toastTitle = "¡¡¡PREMIO MAYOR!!!";
                        toastDescription = "¡Has ganado el Pase HV Premium!";
                    }
                    break;
                case 'gem':
                    updates = { gems: increment(20) };
                    toastDescription = "¡Has ganado 20 Gemas!";
                    break;
                case 'coins':
                    updates = { goldLingots: increment(80) };
                    toastDescription = "¡Has ganado 80 Lingotes de Oro!";
                    break;
                case 'ticket':
                    updates = { casinoChips: increment(100) };
                    toastDescription = "¡Has ganado 100 Fichas de Casino!";
                    break;
                default:
                    setSlotResultMessage('¡Mala suerte! Sigue intentando.');
                    return;
            }
    
            updateDocumentNonBlocking(userProfileRef, updates);
            setSlotResultMessage(toastDescription);
            toast({ title: toastTitle, description: toastDescription });
            return;
        }
    
        // Check for a pair (two of a kind)
        if (reel1.id === reel2.id || reel1.id === reel3.id || reel2.id === reel3.id) {
            updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(2) });
            setSlotResultMessage("¡Casi! Recuperas tus 2 fichas.");
            return;
        }
    
        // No win
        setSlotResultMessage('¡Mala suerte! Sigue intentando.');
    };

    const startShellGame = () => {
        const currentBet = betAmount[0];
        if (!userProfileRef || (userProfile?.casinoChips ?? 0) < currentBet) {
            setShellResultMessage('¡No tienes suficientes fichas!');
            return;
        }
        if (currentBet < 1) {
            setShellResultMessage('La apuesta mínima es 1 ficha.');
            return;
        }

        updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(-currentBet) });
        setShellGamePhase('shuffling');
        setShellResultMessage('Observa con atención...');

        const winningCupIndex = Math.floor(Math.random() * 3);
        const initialCups = cups.map((cup, index) => ({
            ...cup,
            hasPrize: index === winningCupIndex,
            isRevealed: true, // Briefly show the prize
        }));
        setCups(initialCups);

        setTimeout(() => {
             // Hide prize and start shuffling
            const hiddenPrizeCups = initialCups.map(c => ({...c, isRevealed: false}));
            setCups(hiddenPrizeCups);
            
            setTimeout(() => {
                 // Actually shuffle the array internally now
                 const shuffledCups = shuffleArray(hiddenPrizeCups);
                 setCups(shuffledCups);

                 // Stop shuffling and wait for pick
                setShellGamePhase('picking');
                setShellResultMessage('¿Dónde está la ficha?');
            }, 2500); // Shuffle duration
        }, 1500); // Time to see the prize
    };

    const handleCupPick = (pickedCup: CupState) => {
        if (shellGamePhase !== 'picking' || !userProfileRef) return;

        setShellGamePhase('result');
        setCups(cups.map(cup => ({ ...cup, isRevealed: true })));

        if (pickedCup.hasPrize) {
            const winnings = betAmount[0] * 2;
            setShellResultMessage(`¡Correcto! ¡Has ganado ${winnings} fichas!`);
            updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(winnings) });
        } else {
            setShellResultMessage('¡Incorrecto! Mejor suerte la próxima vez.');
        }
    };
    
    const resetShellGame = () => {
        setShellGamePhase('betting');
        setShellResultMessage('');
        setCups(cups.map(cup => ({...cup, hasPrize: false, isRevealed: false})));
        setBetAmount([1]);
    };

    const Dice1Icon = diceIcons[dice1];
    const Dice2Icon = diceIcons[dice2];
    
    const isLoading = isUserLoading || isProfileLoading;
    const casinoChips = userProfile?.casinoChips ?? 0;

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
                    <CardTitle>Juego de los Vasos</CardTitle>
                    <CardDescription>Apuesta tus fichas y adivina dónde está la ficha ganadora. ¡Gana el doble de tu apuesta!</CardDescription>
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
                     {shellGamePhase === 'betting' && (
                        <div className="w-full px-4 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Tu apuesta:</span>
                                <span className="font-bold text-lg text-primary">{betAmount[0]} Ficha(s)</span>
                            </div>
                             <Slider 
                                value={betAmount}
                                onValueChange={setBetAmount}
                                min={1}
                                max={Math.max(1, casinoChips)}
                                step={1}
                                disabled={isLoading || casinoChips < 1}
                             />
                        </div>
                     )}
                </CardContent>
                <CardFooter>
                    {shellGamePhase === 'betting' && (
                        <Button size="lg" className="w-full" onClick={startShellGame} disabled={isLoading || casinoChips < betAmount[0]}>
                            Jugar ({betAmount[0]} Ficha{betAmount[0] > 1 ? 's' : ''})
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
                    <Button size="lg" className="w-full" onClick={spinSlots} disabled={spinning || isLoading || casinoChips < 2}>
                        {spinning ? 'Girando...' : 'Girar (2 Fichas)'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Lanzamiento de Dados</CardTitle>
                    <CardDescription>Apuesta 1 ficha de casino y gana el doble si sacas pares.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                        <Dice1Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                        <Dice2Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                    </div>
                     {diceResultMessage && <p className="text-foreground font-semibold">{diceResultMessage}</p>}
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={rollDice} disabled={rolling || isLoading || casinoChips < 1}>
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

    