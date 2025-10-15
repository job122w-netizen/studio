'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Gem, Ticket } from "lucide-react";
import { useState } from "react";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function CasinoPage() {
    const [dice1, setDice1] = useState(5);
    const [dice2, setDice2] = useState(1);
    const [rolling, setRolling] = useState(false);

    const rollDice = () => {
        setRolling(true);
        let rollCount = 0;
        const interval = setInterval(() => {
            setDice1(Math.floor(Math.random() * 6));
            setDice2(Math.floor(Math.random() * 6));
            rollCount++;
            if (rollCount > 10) {
                clearInterval(interval);
                setRolling(false);
            }
        }, 100);
    };

    const Dice1Icon = diceIcons[dice1];
    const Dice2Icon = diceIcons[dice2];

    return (
        <div className="space-y-8 animate-fade-in">
            <section className="text-center">
                <h1 className="text-3xl font-bold font-headline text-foreground">Casino HV</h1>
                <p className="text-muted-foreground mt-2">¡Prueba tu suerte y gana grandes premios!</p>
            </section>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Lanzamiento de Dados</CardTitle>
                    <CardDescription>Apuesta 100 HV Puntos y gana el doble si sacas pares.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                        <Dice1Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                        <Dice2Icon className={`h-24 w-24 text-primary ${rolling ? 'animate-spin' : ''}`} />
                    </div>
                     <p className="text-muted-foreground">Tu saldo: 10,900 Puntos</p>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={rollDice} disabled={rolling}>
                        {rolling ? 'Lanzando...' : 'Lanzar Dados (100 Puntos)'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lotería Semanal</CardTitle>
                    <CardDescription>Compra un boleto y participa por un premio mayor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-3xl font-bold text-primary">Premio Mayor: 50,000 <span className="inline-block align-middle"><Gem className="h-6 w-6"/></span></p>
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
