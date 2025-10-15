'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, BookOpen, Dumbbell, Edit, Shield, Star, Trophy, GraduationCap, ChevronDown, Save, Camera } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
    let nextRank = ranks[1];
    for (let i = 0; i < ranks.length; i++) {
        if (xp >= ranks[i].xpThreshold) {
            currentRank = ranks[i];
            if (i < ranks.length - 1) {
                nextRank = ranks[i + 1];
            } else {
                nextRank = currentRank; // No next rank
            }
        } else {
            break;
        }
    }
    return { currentRank, nextRank };
};

export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRanksOpen, setIsRanksOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const xp = userProfile?.experiencePoints ?? 0;
  const { currentRank, nextRank } = getRank(xp);
  const progressToNextRank = nextRank.xpThreshold > currentRank.xpThreshold 
    ? ((xp - currentRank.xpThreshold) / (nextRank.xpThreshold - currentRank.xpThreshold)) * 100
    : 100;

  const stats = [
    { icon: BookOpen, label: "Horas de Estudio", value: userProfile?.studyHours || "0" },
    { icon: Dumbbell, label: "Ejercicios", value: userProfile?.exercisesCompleted || "0" },
    { icon: Star, label: "Puntos HV", value: userProfile?.experiencePoints?.toLocaleString('es-ES') || "0" },
  ];

  const achievements = [
    { icon: Shield, name: "Mente de Acero", description: "Completa 7 días de meditación" },
    { icon: Shield, name: "Madrugador", description: "Estudia antes de las 6 AM" },
    { icon: Shield, name: "Maratón de Estudio", description: "Estudia por más de 5 horas seguidas" },
  ];
  
  const isLoading = isUserLoading || isProfileLoading;

  const handleEdit = () => {
    setUsername(userProfile?.username || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (userProfileRef && username.trim() !== '') {
      updateDocumentNonBlocking(userProfileRef, { username: username.trim() });
      toast({ title: "Perfil actualizado", description: "Tu nombre de usuario ha sido cambiado." });
    }
    setIsEditing(false);
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        updateDocumentNonBlocking(userProfileRef, { imageUrl: dataUrl });
        toast({ title: "Avatar actualizado", description: "Tu foto de perfil ha sido cambiada." });
      };
      reader.readAsDataURL(file);
    }
  };

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
                <Avatar className="w-24 h-24 mb-4 border-4 border-card shadow-lg cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={userProfile?.imageUrl} alt="Avatar de usuario" />
                  <AvatarFallback>{userProfile?.username?.charAt(0) || 'HV'}</AvatarFallback>
                </Avatar>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                 <Button variant="outline" size="icon" className="absolute bottom-2 -right-1 w-8 h-8 rounded-full" onClick={handleAvatarClick}>
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {isEditing ? (
                 <div className="flex items-center gap-2 mt-2">
                   <Input value={username} onChange={(e) => setUsername(e.target.value)} className="text-center text-2xl font-bold font-headline h-10" />
                   <Button size="icon" onClick={handleSave}><Save className="w-4 h-4"/></Button>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold font-headline">{userProfile?.username || 'Usuario'}</h1>
                    <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                </div>
              )}

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
             <>
              {stats.map((stat) => (
                <div key={stat.label} className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              ))}
               <Collapsible open={isRanksOpen} onOpenChange={setIsRanksOpen} className="col-span-2 bg-muted/50 p-4 rounded-lg">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <div>
                        <p className="text-sm text-muted-foreground">Rango Actual</p>
                        <p className="text-lg font-bold">{currentRank.name}</p>
                        </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isRanksOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                    <div className="text-center">
                         <p className="text-sm text-muted-foreground">
                           {currentRank.name === nextRank.name 
                           ? "¡Has alcanzado el rango máximo!" 
                           : `Siguiente Rango: ${nextRank.name} (${nextRank.xpThreshold.toLocaleString('es-ES')} Puntos)`
                           }
                        </p>
                        <Progress value={progressToNextRank} className="my-2 h-2" />
                         <p className="text-xs text-muted-foreground">
                           {currentRank.name !== nextRank.name && 
                           `Te faltan ${(nextRank.xpThreshold - xp).toLocaleString('es-ES')} puntos`
                           }
                        </p>
                    </div>
                    <ul className="space-y-1">
                        {ranks.map(rank => (
                            <li key={rank.name} className={`flex justify-between items-center text-sm p-1 rounded ${xp >= rank.xpThreshold ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                <span>{rank.name}</span>
                                <span>{rank.xpThreshold.toLocaleString('es-ES')} Puntos</span>
                            </li>
                        ))}
                    </ul>
                </CollapsibleContent>
              </Collapsible>
             </>
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
