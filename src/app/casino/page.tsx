'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins, Ticket } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Skeleton } from "@/components/ui/skeleton";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function CasinoPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const [dice1, setDice1] = useState(5);
    const [dice2, setDice2] = useState(1);
    const [rolling, setRolling] = useState(false);
    const [resultMessage, setResultMessage] = useState('');

    const rollDice = () => {
        if (!userProfileRef || (userProfile?.casinoChips ?? 0) < 1) {
            setResultMessage('¡No tienes suficientes fichas!');
            return;
        }

        setRolling(true);
        setResultMessage('');
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
                    setResultMessage('¡Ganaste 2 fichas!');
                    updateDocumentNonBlocking(userProfileRef, { casinoChips: increment(2) });
                } else {
                    setResultMessage('¡No hubo suerte! Inténtalo de nuevo.');
                }
            }
        }, 100);
    };

    const Dice1Icon = diceIcons[dice1];
    const Dice2Icon = diceIcons[dice2];
    
    const isLoading = isUserLoading || isProfileLoading;

    return (
        <div className="space-y-8 animate-fade-in">
            <section className="text-center">
                <h1 className="text-3xl font-bold font-headline text-foreground">Casino HV</h1>
                <p className="text-muted-foreground mt-2">¡Prueba tu suerte y gana grandes premios!</p>
            </section>

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
                     {isLoading ? (
                        <Skeleton className="h-6 w-36" />
                     ) : (
                        <p className="text-muted-foreground">Tu saldo: {userProfile?.casinoChips ?? 0} Fichas</p>
                     )}
                     {resultMessage && <p className="text-foreground font-semibold">{resultMessage}</p>}
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={rollDice} disabled={rolling || isLoading || (userProfile?.casinoChips ?? 0) < 1}>
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
                    <Button variant="outline" className="w-full">
                        <Ticket className="mr-2 h-4 w-4"/>
                        Comprar Boleto (50 Puntos)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
