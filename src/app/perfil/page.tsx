'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BarChart, BookOpen, Dumbbell, Edit, Shield, Star, Trophy, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const ranks = [
    { name: "Novato", xpThreshold: 0 },
    { name: "Aprendiz", xpThreshold: 10000 },
    { name: "Erudito", xpThreshold: 25000 },
    { name: "Maestro", xpThreshold: 50000 },
    { name: "Gran Maestro", xpThreshold: 100000 },
    { name: "Sabio", xpThreshold: 200000 },
];

const getRank = (xp: number) => {
    let currentRank = ranks[0];
    for (const rank of ranks) {
        if (xp >= rank.xpThreshold) {
            currentRank = rank;
        } else {
            break;
        }
    }
    return currentRank;
};


export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
  
  const currentRank = userProfile ? getRank(userProfile.experiencePoints) : ranks[0];

  const stats = [
    { icon: BookOpen, label: "Horas de Estudio", value: userProfile?.studyHours || "0" },
    { icon: Dumbbell, label: "Ejercicios", value: userProfile?.exercisesCompleted || "0" },
    { icon: GraduationCap, label: "Rango Actual", value: currentRank.name },
    { icon: Star, label: "Puntos HV", value: userProfile?.experiencePoints?.toLocaleString('es-ES') || "0" },
  ];

  const achievements = [
    { icon: Shield, name: "Mente de Acero", description: "Completa 7 días de meditación" },
    { icon: Shield, name: "Madrugador", description: "Estudia antes de las 6 AM" },
    { icon: Shield, name: "Maratón de Estudio", description: "Estudia por más de 5 horas seguidas" },
  ];
  
  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center text-center">
          {isLoading ? (
            <>
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </>
          ) : (
            <>
              <div className="relative">
                <Avatar className="w-24 h-24 mb-4 border-4 border-card shadow-lg">
                  {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="Avatar de usuario" />}
                  <AvatarFallback>{userProfile?.username?.charAt(0) || 'HV'}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" className="absolute bottom-2 right-0 w-8 h-8 rounded-full">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <h1 className="text-2xl font-bold font-headline">{userProfile?.username || 'Usuario'}</h1>
              <p className="text-muted-foreground">Miembro desde hace 3 meses</p>
              <Badge variant="secondary" className="mt-2">Pase HV Activo</Badge>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/> Estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                <stat.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/> Logros</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {achievements.map((ach, index) => (
              <li key={index} className="flex items-center gap-4">
                <ach.icon className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="font-semibold">{ach.name}</p>
                  <p className="text-sm text-muted-foreground">{ach.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
