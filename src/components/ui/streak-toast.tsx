'use client';

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { cn } from "@/lib/utils";

export function StreakToast({ streak }: { streak: number }) {
    const { width, height } = useWindowSize();
    const [visible, setVisible] = useState(false);
    const [animationStep, setAnimationStep] = useState(0);

    useEffect(() => {
        // Start animations
        setVisible(true);

        // Sequence the animations
        const timer1 = setTimeout(() => setAnimationStep(1), 100); // Scale up number
        const timer2 = setTimeout(() => setAnimationStep(2), 500); // Show text

        // Set timeout to hide the component
        const hideTimer = setTimeout(() => {
            setVisible(false);
        }, 4000); // Total duration 4 seconds

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(hideTimer);
        };
    }, []);

    return (
        <div className={cn(
            "fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500",
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <Confetti width={width} height={height} recycle={false} numberOfPieces={visible ? 400 : 0} />
            
            <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex items-center justify-center">
                     <Flame className={cn(
                        "absolute h-64 w-64 text-orange-400/50 blur-2xl transition-all duration-1000",
                        animationStep > 0 ? "opacity-100 scale-100" : "opacity-0 scale-75",
                     )} />
                     <Flame className={cn(
                        "h-32 w-32 text-orange-500 transition-transform duration-500",
                        animationStep > 0 ? "scale-100" : "scale-0",
                     )} />
                </div>
                
                <span className={cn(
                    "text-8xl font-bold text-white drop-shadow-lg transition-transform duration-300 ease-out",
                    animationStep > 0 ? "scale-100" : "scale-50"
                )}>
                    {streak}
                </span>

                <h3 className={cn(
                    "text-2xl font-bold text-white drop-shadow-md transition-all duration-500",
                    animationStep > 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    Días de Racha
                </h3>
            </div>
        </div>
    );
}
