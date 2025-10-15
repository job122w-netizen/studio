'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ejerciciosData } from "@/lib/placeholder-data";
import { Zap } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function EjerciciosPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const completeExercise = (xp: number) => {
    if (!userProfileRef) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para completar un ejercicio.",
      });
      return;
    }
    updateDocumentNonBlocking(userProfileRef, {
      experiencePoints: increment(xp)
    });
    toast({
      title: "¡Ejercicio completado!",
      description: `¡Has ganado ${xp} XP!`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Centro de Ejercicios</h1>
        <p className="text-muted-foreground mt-2">Fortalece tu cuerpo y mente con estas actividades.</p>
      </section>

      <div className="space-y-6">
        {ejerciciosData.map((ejercicio) => (
          <Card key={ejercicio.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {ejercicio.image && (
              <div className="relative h-32 w-full">
                <Image
                  src={ejercicio.image.imageUrl}
                  alt={ejercicio.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={ejercicio.image.imageHint}
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}
            <CardHeader className="relative -mt-16 z-10">
              <CardTitle className="text-primary-foreground text-xl">{ejercicio.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{ejercicio.description}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => completeExercise(ejercicio.xpReward)}>
                <Zap className="mr-2 h-4 w-4" />
                Completar y ganar {ejercicio.xpReward} XP
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
