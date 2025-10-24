'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Square, Plus } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, increment } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserStreak } from "@/lib/streaks";
import { updateCasinoChips } from "@/lib/transactions";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const studySessionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/studySessions`);
  }, [firestore, user]);

  const [isStudying, setIsStudying] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [studyDurationMinutes, setStudyDurationMinutes] = useState(25);
  const [remainingTime, setRemainingTime] = useState(25 * 60);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalSessionDuration, setTotalSessionDuration] = useState(25 * 60);
  const [showCustomSlider, setShowCustomSlider] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isStudying && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (remainingTime <= 0 && isStudying) {
      handleStopStudy(true);
      
      const xpReward = Math.floor(totalSessionDuration / 60) * 50;
      toast({
        title: "¡Sesión de estudio completada!",
        description: `¡Has ganado ${xpReward} Puntos, 1 Lingote y 1 Ficha!`,
      });
      if (userProfileRef) {
          updateDocumentNonBlocking(userProfileRef, {
            experiencePoints: increment(xpReward),
            goldLingots: increment(1),
          });
          updateCasinoChips(userProfileRef, 1);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStudying, remainingTime, userProfileRef, toast, totalSessionDuration]);

  const handleStartStudy = () => {
    if (studyDurationMinutes <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La duración debe ser mayor a 0 minutos.",
      });
      return;
    }
    const durationInSeconds = studyDurationMinutes * 60;
    setTotalSessionDuration(durationInSeconds);
    setRemainingTime(durationInSeconds);
    setIsStudying(true);
    setSessionCompleted(false);
    setSessionStartTime(new Date());
  };
  
  const handleStopStudy = (isCompleted = false) => {
    setIsStudying(false);
    if(isCompleted) {
        setSessionCompleted(true);
    }
    
    const elapsedTime = totalSessionDuration - remainingTime;
    
    if (user && studySessionsRef && sessionStartTime && (elapsedTime > 10 || isCompleted)) {
      const endTime = new Date();
      const durationMinutes = Math.floor(elapsedTime / 60);

      addDocumentNonBlocking(studySessionsRef, {
          userId: user.uid,
          subject: 'Estudio General',
          startTime: sessionStartTime,
          endTime: endTime,
          durationMinutes: durationMinutes
      }).then(() => {
          if (!isCompleted) { 
            if (durationMinutes > 0) {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado por ${durationMinutes} minutos.`,
               });
           } else {
                toast({
                   title: "Sesión no guardada",
                   description: "La sesión debe durar al menos 10 segundos.",
                   variant: 'destructive'
               });
           }
          }
          if(userProfileRef) updateUserStreak(userProfileRef);
      });
       
    } else if (elapsedTime > 0 && elapsedTime <= 10 && !isCompleted) {
        toast({
            variant: "destructive",
            title: "Sesión no guardada",
            description: "La sesión de estudio debe durar más de 10 segundos.",
        });
    }
    
    setSessionStartTime(null);
    if(timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatSliderTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  }

  const isLoading = isUserLoading || isProfileLoading;
  
  const progress = totalSessionDuration > 0 ? (totalSessionDuration - remainingTime) / totalSessionDuration : 0;
  const minSize = 64; // 4rem
  const maxSize = 192; // 12rem
  const sphereSize = isStudying || sessionCompleted ? minSize + (maxSize - minSize) * progress : maxSize;


  if (isLoading && !userProfile) {
    return (
        <div className="flex justify-center items-center h-full">
            <div className="text-center">
                <p>Cargando tu espacio...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Tu Espacio de Crecimiento</h1>
        <p className="text-muted-foreground mt-2">"La disciplina es el puente entre las metas y los logros."</p>
      </section>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center justify-center gap-10 min-h-[400px] bg-background/40">
          
           <div 
                className={cn(
                    "relative flex items-center justify-center rounded-full bg-primary/80 transition-all duration-1000 ease-linear",
                    (isStudying || sessionCompleted) && "animate-pulse-glow",
                    !isStudying && !sessionCompleted && "shadow-subtle-glow"
                )}
                style={{
                  height: `${sphereSize}px`,
                  width: `${sphereSize}px`,
                }}
              />

          {isStudying || sessionCompleted ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-foreground">
              <p className="text-5xl sm:text-6xl font-bold font-mono text-foreground drop-shadow-lg z-10">{formatTime(remainingTime)}</p>
              
              {isStudying && (
                <Button size="lg" variant="ghost" className="w-full" onClick={() => handleStopStudy(false)} disabled={isLoading}>
                    <Square className="mr-2 h-5 w-5"/>
                    Detener
                </Button>
              )}

              {sessionCompleted && (
                 <Button size="lg" className="w-full" onClick={() => {
                    setSessionCompleted(false);
                    setRemainingTime(studyDurationMinutes * 60);
                }}>
                    <Play className="mr-2 h-5 w-5"/>
                    Estudiar de Nuevo
                </Button>
              )}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center gap-8 text-center text-foreground">
                  <p className="font-semibold text-lg">Minutos de Estudio</p>
                  <div className="flex gap-2">
                      <Button variant={studyDurationMinutes === 25 && !showCustomSlider ? 'default' : 'secondary'} onClick={() => { setStudyDurationMinutes(25); setShowCustomSlider(false); }}>25 min</Button>
                      <Button variant={studyDurationMinutes === 50 && !showCustomSlider ? 'default' : 'secondary'} onClick={() => { setStudyDurationMinutes(50); setShowCustomSlider(false); }}>50 min</Button>
                      <Button variant={showCustomSlider ? 'default' : 'secondary'} size="icon" onClick={() => setShowCustomSlider(s => !s)}><Plus /></Button>
                  </div>
                  
                  {showCustomSlider && (
                    <div className="w-full max-w-xs pt-2 space-y-2">
                        <p className="font-bold text-xl">{formatSliderTime(studyDurationMinutes)}</p>
                        <Slider
                            defaultValue={[studyDurationMinutes]}
                            min={1}
                            max={14 * 60}
                            step={1}
                            onValueChange={(value) => setStudyDurationMinutes(value[0])}
                        />
                    </div>
                  )}
                   <Button size="lg" className="w-full mt-2" onClick={handleStartStudy} disabled={isLoading || studyDurationMinutes <= 0}>
                      <Play className="mr-2 h-5 w-5"/>
                      Iniciar Sesión
                  </Button>
              </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
