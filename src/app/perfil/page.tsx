'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, BookOpen, Dumbbell, Edit, Shield, Star, Trophy, GraduationCap, ChevronDown, Save, Camera, LogOut, Flame, Palette, Lock, Trash2, X } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

const pixelArtBackgrounds = PlaceHolderImages.filter(img => img.id.startsWith('pixel-art-'));

export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isRanksOpen, setIsRanksOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  const xp = userProfile?.experiencePoints ?? 0;
  const { currentRank, nextRank } = getRank(xp);
  const progressToNextRank = nextRank.xpThreshold > currentRank.xpThreshold 
    ? ((xp - currentRank.xpThreshold) / (nextRank.xpThreshold - currentRank.xpThreshold)) * 100
    : 100;

  const stats = [
    { icon: Star, label: "Puntos HV", value: userProfile?.experiencePoints?.toLocaleString('es-ES') || "0" },
    { icon: Flame, label: "Racha de Días", value: userProfile?.currentStreak || "0" },
    { icon: BookOpen, label: "Horas de Estudio", value: userProfile?.studyHours || "0" },
    { icon: Dumbbell, label: "Ejercicios", value: userProfile?.exercisesCompleted || "0" },
  ];

  const achievements = [
    { icon: Shield, name: "Mente de Acero", description: "Completa 7 días de meditación" },
    { icon: Shield, name: "Madrugador", description: "Estudia antes de las 6 AM" },
    { icon: Shield, name: "Maratón de Estudio", description: "Estudia por más de 5 horas seguidas" },
  ];
  
  const isLoading = isUserLoading || isProfileLoading;
  
  const selectedBg = pixelArtBackgrounds.find(bg => bg.id === userProfile?.selectedBackgroundId);

  const handleEdit = () => {
    setEditingUsername(userProfile?.username || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (userProfileRef && editingUsername.trim() !== '') {
        updateDocumentNonBlocking(userProfileRef, { username: editingUsername.trim() });
        toast({ title: "Perfil actualizado", description: "Tu nombre de usuario ha sido cambiado." });
    }
    setIsEditing(false);
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetAvatar = () => {
      if (userProfileRef) {
          updateDocumentNonBlocking(userProfileRef, { imageUrl: null });
          toast({ title: "Avatar restablecido", description: "Tu foto de perfil ha sido eliminada." });
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && userProfileRef) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        updateDocumentNonBlocking(userProfileRef, { imageUrl: dataUrl });
        toast({ title: "Avatar actualizado", description: "Tu foto de perfil ha sido cambiada." });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'HV';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/auth');
    }
  }

  const handleSelectBackground = (backgroundId: string) => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { selectedBackgroundId: backgroundId });
    toast({
        title: "Fondo actualizado",
        description: "Tu nuevo fondo de perfil ha sido guardado."
    });
  };

  const handleResetBackground = () => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, { selectedBackgroundId: null });
    toast({
        title: "Fondo restablecido",
        description: "Se ha restaurado el fondo predeterminado."
    });
  };

  const unlockAllBackgroundsForTesting = () => {
    if (!userProfileRef) return;
    const allBackgroundIds = pixelArtBackgrounds.map(bg => bg.id);
    updateDocumentNonBlocking(userProfileRef, { unlockedBackgrounds: allBackgroundIds });
    toast({
        title: "¡Modo desarrollador!",
        description: "Todos los fondos de perfil han sido desbloqueados para pruebas."
    });
  }

  if (isLoading || !userProfile) {
    return (
      <div className="space-y-8 animate-fade-in pb-16">
        <Card className="overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <Card className="overflow-hidden relative text-primary-foreground">
        {selectedBg && (
            <>
                <Image src={selectedBg.imageUrl} alt={selectedBg.description} fill className="object-cover z-0" />
                <div className="absolute inset-0 bg-black/50 z-10"></div>
            </>
        )}
        <CardContent className="p-6 flex flex-col items-center text-center relative z-20">
              <div className="relative">
                <Avatar className="w-24 h-24 mb-4 border-4 border-card/50 shadow-lg cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={userProfile?.imageUrl} alt="Avatar de usuario" />
                  <AvatarFallback>{getInitials(userProfile?.username)}</AvatarFallback>
                </Avatar>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                 <Button variant="outline" size="icon" className="absolute bottom-2 right-8 w-8 h-8 rounded-full text-foreground" onClick={handleAvatarClick}>
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" className="absolute bottom-2 -right-1 w-8 h-8 rounded-full" onClick={handleResetAvatar}>
                  <Trash2 className="w-4 h-4"/>
                </Button>
              </div>

              {isEditing ? (
                 <div className="flex items-center gap-2 mt-2">
                   <Input value={editingUsername} onChange={(e) => setEditingUsername(e.target.value)} className="text-center text-2xl font-bold font-headline h-10 text-foreground" />
                   <Button size="icon" onClick={handleSave}><Save className="w-4 h-4"/></Button>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold font-headline text-primary-foreground drop-shadow-md">{userProfile?.username}</h1>
                    <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8 hover:bg-white/20">
                      <Edit className="w-4 h-4" />
                    </Button>
                </div>
              )}

              <p className="text-muted-foreground drop-shadow-sm text-white/80">{user?.email}</p>
              {userProfile.hasPremiumPass && <Badge variant="secondary" className="mt-2 bg-yellow-400 text-yellow-900">Pase HV Premium</Badge>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/> Estadísticas</div>
             <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
                <LogOut className="w-4 h-4 text-destructive"/>
             </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
                           {currentRank.name !== nextRank.name && xp < nextRank.xpThreshold
                           ? `Te faltan ${(nextRank.xpThreshold - xp).toLocaleString('es-ES')} puntos`
                           : xp >= nextRank.xpThreshold && currentRank.name !== nextRank.name ? '¡Listo para ascender!' : ''
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
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Fondos de Perfil</div>
             <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={unlockAllBackgroundsForTesting}>Desbloquear (Test)</Button>
                 <Button variant="ghost" size="sm" onClick={handleResetBackground}>Restablecer</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(userProfile.unlockedBackgrounds && userProfile.unlockedBackgrounds.length > 0) ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {pixelArtBackgrounds.map(bg => {
                    const isUnlocked = userProfile.unlockedBackgrounds.includes(bg.id);
                    const isSelected = userProfile.selectedBackgroundId === bg.id;
                    return (
                        <div 
                            key={bg.id} 
                            className={cn(
                                "relative aspect-video rounded-md overflow-hidden border-4 transition-all cursor-pointer",
                                isSelected ? "border-primary shadow-lg" : "border-transparent",
                                isUnlocked ? "hover:border-primary/50" : "cursor-not-allowed"
                            )}
                            onClick={() => isUnlocked && handleSelectBackground(bg.id)}
                        >
                            <Image src={bg.imageUrl} alt={bg.description} fill className="object-cover"/>
                             {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-white"/>
                                </div>
                             )}
                        </div>
                    )
                })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Desbloquea fondos en el Pase HV para personalizar tu perfil.</p>
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
