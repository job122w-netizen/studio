'use client';

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function StreakToast({ streak }: { streak: number }) {
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 4000); // Stop confetti after 4 seconds
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full flex flex-col items-center justify-center gap-2 text-center">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
            <h3 className="text-lg font-bold">¡Racha Aumentada!</h3>
            <div className="flex items-center gap-2">
                <Flame className="h-10 w-10 text-orange-500 animate-pulse" />
                <span className="text-4xl font-bold text-orange-500">{streak}</span>
            </div>
            <p className="text-sm text-muted-foreground">¡Sigue así!</p>
        </div>
    );
}
