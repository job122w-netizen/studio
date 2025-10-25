'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Square, Plus, Coins } from "lucide-react";
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
import { StreakToast } from "@/components/ui/streak-toast";

const studyQuotes = [
    "El estudio no es un acto de consumir ideas, sino de crearlas y recrearlas.",
    "La raíz de la educación es amarga, pero el fruto es dulce.",
    "Involúcrame y lo aprendo.",
    "El aprendizaje es un tesoro que seguirá a su dueño a todas partes.",
    "La inversión en conocimiento paga el mejor interés.",
    "Nunca consideres el estudio como una obligación, sino como una oportunidad.",
    "¿Sabías que tu cerebro crea nuevas conexiones neuronales cada vez que aprendes algo nuevo?",
    "¿Sabías que enseñar a otros es una de las formas más efectivas de consolidar tu conocimiento?",
    "¿Sabías que los errores aumentan la actividad cerebral y son una parte crucial del proceso de aprendizaje?",
    "¿Sabías que dormir bien después de estudiar ayuda a tu cerebro a consolidar los recuerdos y lo aprendido?",
    "Nuestra mayor debilidad radica en rendirnos. La forma más segura de tener éxito es siempre intentarlo una vez más. - Thomas A. Edison",
    "Dime y lo olvido, enséñame y lo recuerdo, involúcrame y lo aprendo. - Benjamin Franklin",
    "Vive como si fueses a morir mañana. Aprende como si fueses a vivir para siempre. - Mahatma Gandhi"
];

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
  const [currentQuote, setCurrentQuote] = useState(studyQuotes[0]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Set initial quote
    setCurrentQuote(studyQuotes[Math.floor(Math.random() * studyQuotes.length)]);

    // Set interval to change quote every 30 seconds
    const quoteInterval = setInterval(() => {
      setCurrentQuote(prevQuote => {
        let newQuote = prevQuote;
        // Ensure the new quote is different from the current one
        while (newQuote === prevQuote) {
          newQuote = studyQuotes[Math.floor(Math.random() * studyQuotes.length)];
        }
        return newQuote;
      });
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(quoteInterval);
  }, []);

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
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStudying, remainingTime]);

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
  
  const handleStopStudy = async (isCompleted = false) => {
    setIsStudying(false);
    if(isCompleted) {
        setSessionCompleted(true);
    }
    
    if(timerRef.current) clearInterval(timerRef.current);

    if (!sessionStartTime) return;

    const endTime = new Date();
    // Calculate duration in seconds based on actual timestamps
    const elapsedTime = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
    const finalDurationMinutes = isCompleted ? studyDurationMinutes : Math.floor(elapsedTime / 60);

    // --- Reward Logic ---
    if (isCompleted && studyDurationMinutes >= 25 && userProfileRef && userProfile) {
        const blocksOf25 = Math.floor(studyDurationMinutes / 25);
        let xpReward = blocksOf25 * 1000;
        let chipReward = blocksOf25 * 3;
        let lingotReward = blocksOf25 * 1;

        // Check for active Focus Gem
        const now = new Date();
        const focusGemExpiry = userProfile.focusGemActiveUntil?.toDate();
        let gemActive = false;
        if (focusGemExpiry && focusGemExpiry > now) {
            xpReward *= 2;
            chipReward *= 2;
            lingotReward *= 2;
            gemActive = true;
        }

        const toastTitle = gemActive ? "¡Estudio Potenciado!" : "¡Sesión de estudio completada!";
        const toastDescription = `¡Has ganado ${xpReward} XP, ${lingotReward} lingote(s) y ${chipReward} fichas!`;

        toast({
          title: toastTitle,
          description: toastDescription,
        });

        updateDocumentNonBlocking(userProfileRef, {
          experiencePoints: increment(xpReward),
          goldLingots: increment(lingotReward)
        });
        updateCasinoChips(userProfileRef, chipReward);
    } else if (isCompleted) {
        toast({
          title: "¡Sesión de estudio completada!",
          description: `Has estudiado por ${studyDurationMinutes} minutos.`,
        });
    }

    // --- Save Session Logic ---
    if (user && studySessionsRef && finalDurationMinutes > 0) {
        const studyHoursIncrement = finalDurationMinutes / 60;
        
        await addDocumentNonBlocking(studySessionsRef, {
            userId: user.uid,
            subject: 'Estudio General',
            startTime: sessionStartTime,
            endTime: endTime,
            durationMinutes: finalDurationMinutes
        });

        if (userProfileRef) {
            updateDocumentNonBlocking(userProfileRef, {
                studyHours: increment(studyHoursIncrement)
            });
        }

        if (!isCompleted) { 
            toast({
               title: "Sesión guardada",
               description: `Has estudiado por ${finalDurationMinutes} minutos.`,
            });
        }
        if(userProfileRef) {
            const { updated, newStreak } = await updateUserStreak(userProfileRef);
            if (updated && newStreak > 0) {
              toast({
                  duration: 5000,
                  component: <StreakToast streak={newStreak} />,
              });
            }
        }
    } else if (!isCompleted && elapsedTime < 60) { // Stopped before 1 min
        toast({
           title: "Sesión no guardada",
           description: "La sesión debe durar al menos 1 minuto para guardarse.",
           variant: 'destructive'
       });
    }
    
    setSessionStartTime(null);
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
        <section className="text-center p-4 border rounded-lg">
            <p className="text-muted-foreground text-sm italic">"{currentQuote}"</p>
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
              <div className="flex flex-col items-center justify-center gap-4 text-center text-foreground mt-4">
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
               <div className="flex flex-col items-center justify-center gap-8 text-center text-foreground mt-4">
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
