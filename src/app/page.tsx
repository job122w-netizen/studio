'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ListChecks, BookOpen, Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, serverTimestamp, setDoc, increment, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const studySessionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/studySessions`);
  }, [firestore, user]);

  const recentStudySessionsQuery = useMemoFirebase(() => {
    if (!studySessionsRef) return null;
    return query(studySessionsRef, orderBy("endTime", "desc"), limit(5));
  }, [studySessionsRef]);

  const { data: recentActivities } = useCollection(recentStudySessionsQuery);


  const [isStudying, setIsStudying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [studySubject, setStudySubject] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRewardTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isUserLoading && user && !userProfile) {
      // Create user profile if it doesn't exist
      const createUserProfile = async () => {
        if (user && !userProfile) {
          const newUserProfile = {
            username: user.displayName || 'Usuario Anónimo',
            email: user.email || 'anonimo@desafiohv.com',
            level: 1,
            experiencePoints: 0,
            goldLingots: 0,
            casinoChips: 0,
            createdAt: serverTimestamp(),
            imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
          };
          if (userProfileRef) {
            await setDoc(userProfileRef, newUserProfile);
          }
        }
      };
      createUserProfile();
    }
  }, [user, isUserLoading, userProfile, firestore, userProfileRef]);

  useEffect(() => {
    if (isStudying) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = prevTime + 1;
          // Reward every 30 minutes (1800 seconds)
          if (Math.floor(newTime / 1800) > lastRewardTimeRef.current) {
            lastRewardTimeRef.current = Math.floor(newTime / 1800);
            if (userProfileRef) {
              updateDocumentNonBlocking(userProfileRef, {
                experiencePoints: increment(1250),
                goldLingots: increment(1),
                casinoChips: increment(1),
              });
               toast({
                title: "¡Recompensa de estudio!",
                description: "¡Has ganado 1250 XP, 1 Lingote y 1 Ficha de Casino!",
              });
            }
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStudying, userProfileRef, toast]);

  const handleStartStudy = () => {
    if (!studySubject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, introduce un tema de estudio.",
      });
      return;
    }
    setIsStudying(true);
    setSessionStartTime(new Date());
    setElapsedTime(0);
    lastRewardTimeRef.current = 0;
  };
  
  const handleStopStudy = async () => {
    setIsStudying(false);
    if(studySessionsRef && sessionStartTime && elapsedTime > 0) {
        const endTime = new Date();
        const durationMinutes = Math.floor(elapsedTime / 60);

        if (durationMinutes === 0) {
            setElapsedTime(0);
            setStudySubject("");
            setSessionStartTime(null);
            return;
        }

        try {
            await addDoc(studySessionsRef, {
                userId: user?.uid,
                subject: studySubject,
                startTime: sessionStartTime,
                endTime: endTime,
                durationMinutes: durationMinutes
            });
            toast({
                title: "Sesión guardada",
                description: `Has estudiado "${studySubject}" por ${durationMinutes} minutos.`,
            });
        } catch (error) {
            console.error("Error saving study session: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar la sesión de estudio.",
            });
        }
    }
    setElapsedTime(0);
    setStudySubject("");
    setSessionStartTime(null);
  };


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return "Menos de 1 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  }
  
  const xpFromDuration = (minutes: number) => {
    return Math.floor(minutes / 30) * 1250;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Tu Espacio de Crecimiento</h1>
        <p className="text-muted-foreground mt-2">"La disciplina es el puente entre las metas y los logros."</p>
      </section>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Registrar Estudio</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-6xl font-bold font-mono text-primary">{formatTime(elapsedTime)}</p>
          {!isStudying ? (
            <div className="w-full space-y-4">
              <Input 
                placeholder="¿Qué vas a estudiar?" 
                value={studySubject}
                onChange={(e) => setStudySubject(e.target.value)}
                disabled={isStudying || isUserLoading}
              />
              <Button size="lg" className="w-full" onClick={handleStartStudy} disabled={isUserLoading || !studySubject}>
                <Play className="mr-2 h-5 w-5"/>
                Iniciar Sesión de Estudio
              </Button>
            </div>
          ) : (
             <div className="w-full space-y-4 text-center">
                <p className="text-muted-foreground">Estudiando: <span className="font-semibold text-foreground">{studySubject}</span></p>
                <Button size="lg" className="w-full" onClick={handleStopStudy} disabled={isUserLoading}>
                    <Square className="mr-2 h-5 w-5"/>
                    Detener Sesión
                </Button>
             </div>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities && recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                       <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.subject}</p>
                      <p className="text-sm text-muted-foreground">{formatDuration(activity.durationMinutes)}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">+{xpFromDuration(activity.durationMinutes).toLocaleString('es-ES')} Puntos</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground">No hay actividad reciente. ¡Empieza a estudiar!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
