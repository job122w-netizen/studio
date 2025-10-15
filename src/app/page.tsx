'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ListChecks, BookOpen, Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, serverTimestamp, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


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
    if (!isUserLoading && !user) {
        router.push('/auth');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (!isUserLoading && user && userProfile === null && userProfileRef) {
      const createUserProfile = () => {
        const newUserProfile = {
          username: user.displayName || (user.isAnonymous ? 'Usuario Anónimo' : user.email?.split('@')[0]) || 'Usuario',
          email: user.email || 'anonimo@desafiohv.com',
          level: 1,
          experiencePoints: 0,
          goldLingots: 0,
          casinoChips: 0,
          createdAt: serverTimestamp(),
          imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        };
        setDocumentNonBlocking(userProfileRef, newUserProfile, {});
      };
      createUserProfile();
    }
  }, [user, isUserLoading, userProfile, userProfileRef]);

  useEffect(() => {
    if (isStudying) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = prevTime + 1;
          const thirtyMinuteMark = Math.floor(newTime / 1800);

          if (thirtyMinuteMark > lastRewardTimeRef.current) {
            lastRewardTimeRef.current = thirtyMinuteMark;
            if (userProfileRef) {
              updateDocumentNonBlocking(userProfileRef, {
                experiencePoints: 1250,
                goldLingots: 1,
                casinoChips: 1,
              });
               toast({
                title: "¡Recompensa de estudio!",
                description: "¡Has ganado 1250 Puntos, 1 Lingote y 1 Ficha!",
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
  
  const handleStopStudy = () => {
    setIsStudying(false);
    if(user && studySessionsRef && sessionStartTime && elapsedTime > 10) {
        const endTime = new Date();
        const durationMinutes = Math.floor(elapsedTime / 60);

        addDocumentNonBlocking(studySessionsRef, {
            userId: user.uid,
            subject: studySubject,
            startTime: sessionStartTime,
            endTime: endTime,
            durationMinutes: durationMinutes
        }).then(() => {
            if (durationMinutes > 0) {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado "${studySubject}" por ${durationMinutes} minutos.`,
               });
           } else {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado "${studySubject}" por menos de un minuto.`,
               });
           }
        });
       
    } else if (elapsedTime > 0 && elapsedTime <= 10) {
        toast({
            variant: "destructive",
            title: "Sesión no guardada",
            description: "La sesión de estudio debe durar más de 10 segundos.",
        });
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

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <div className="text-center">
                <p>Cargando tu espacio...</p>
            </div>
        </div>
    );
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
                disabled={isStudying || isLoading}
              />
              <Button size="lg" className="w-full" onClick={handleStartStudy} disabled={isLoading || !studySubject}>
                <Play className="mr-2 h-5 w-5"/>
                Iniciar Sesión de Estudio
              </Button>
            </div>
          ) : (
             <div className="w-full space-y-4 text-center">
                <p className="text-muted-foreground">Estudiando: <span className="font-semibold text-foreground">{studySubject}</span></p>
                <Button size="lg" className="w-full" onClick={handleStopStudy} disabled={isLoading}>
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
          {!recentActivities || recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay actividad reciente. ¡Empieza a estudiar!</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    