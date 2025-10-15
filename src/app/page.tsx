'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ListChecks, BookOpen, Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, increment } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const [isStudying, setIsStudying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRewardTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isUserLoading && user && !userProfile) {
      // Create user profile if it doesn't exist
      const createUserProfile = async () => {
        if (user && !userProfile) {
          const newUserProfile = {
            username: 'Usuario Anónimo',
            email: user.email || 'anonimo@desafiohv.com',
            level: 1,
            experiencePoints: 0,
            goldLingots: 0,
            casinoChips: 0,
            createdAt: serverTimestamp(),
            imageUrl: '',
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
  }, [isStudying, userProfileRef]);

  const toggleStudySession = () => {
    setIsStudying(!isStudying);
    if(isStudying){
      // Optional: save study session duration when stopped
    } else {
      lastRewardTimeRef.current = Math.floor(elapsedTime / 1800);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const recentActivities = [
    { type: 'Estudio', detail: 'Psicología', duration: '45 min' },
    { type: 'Ejercicio', detail: 'Flexiones', duration: '10 min' },
    { type: 'Estudio', detail: 'Programación', duration: '1.2 horas' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
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
          <Button size="lg" className="w-full" onClick={toggleStudySession} disabled={isUserLoading}>
            {isStudying ? <Square className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
            {isStudying ? 'Detener Sesión' : 'Iniciar Sesión de Estudio'}
          </Button>
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
          {recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {recentActivities.map((activity, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                       <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.type}: {activity.detail}</p>
                      <p className="text-sm text-muted-foreground">{activity.duration}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">+15 XP</div>
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
