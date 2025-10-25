'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, BookOpen, Dumbbell, Edit, Shield, Star, Trophy, GraduationCap, ChevronDown, Save, Camera, LogOut, Flame, Palette, Lock, Trash2, X, Coins, Backpack } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
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
import { colorThemes } from "@/lib/themes";
import { Inventory } from "@/components/profile/inventory";
import { tiendaItems, TiendaItem } from "@/lib/placeholder-data";
import { studyAchievements, StudyAchievement } from "@/lib/achievements";
import { AchievementsList } from "@/components/profile/achievements";


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

  const totalStudyHours = Math.floor(userProfile?.studyHours || 0);

  const stats = [
    { icon: Star, label: "Puntos HV", value: userProfile?.experiencePoints?.toLocaleString('es-ES') || "0" },
    { icon: Flame, label: "Racha de Días", value: userProfile?.currentStreak || "0" },
    { icon: BookOpen, label: "Horas de Estudio", value: totalStudyHours.toLocaleString('es-ES') },
    { icon: Dumbbell, label: "Ejercicios", value: userProfile?.exercisesCompleted || "0" },
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
  };

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

  const handleSelectTheme = (themeId: string) => {
    if (!userProfileRef) return;

    const isDefaultUnlocked = userProfile?.unlockedThemes?.includes('default-theme');
    if (!isDefaultUnlocked) {
        updateDocumentNonBlocking(userProfileRef, { 
            selectedThemeId: themeId,
            unlockedThemes: arrayUnion('default-theme', themeId)
        });
    } else {
        updateDocumentNonBlocking(userProfileRef, { 
            selectedThemeId: themeId,
            unlockedThemes: arrayUnion(themeId) 
        });
    }

    toast({
        title: "Tema actualizado",
        description: "Tu nuevo tema ha sido guardado y aplicado."
    });
  };

  const handleResetTheme = () => {
      if (!userProfileRef) return;
      updateDocumentNonBlocking(userProfileRef, { selectedThemeId: 'default-theme' });
      toast({
          title: "Tema restablecido",
          description: "Se ha restaurado el tema predeterminado."
      });
  };

  const handleUseItem = async (item: TiendaItem) => {
    if (!userProfileRef || !userProfile || !item.consumable) return;

    const userOwnedItem = userProfile.userItems?.find((ownedItem: any) => ownedItem.itemId === item.id);
    if (!userOwnedItem) {
        toast({ variant: 'destructive', title: "Objeto no encontrado", description: "No posees este objeto en tu mochila." });
        return;
    }

    const updates: { [key: string]: any } = {};
    let purchaseDescription = `Has usado ${item.name}.`;
    let purchaseTitle = "¡Objeto utilizado!";

    switch (item.id) {
        case 1: // Gema de Enfoque
            const now = new Date();
            const expiryDate = new Date(now.getTime() + 14 * 60 * 60 * 1000); // 14 hours
            updates.focusGemActiveUntil = Timestamp.fromDate(expiryDate);
            purchaseDescription = "¡Recompensas de estudio duplicadas por 14 horas!";
            break;
        case 7: // Cofre épico
        case 8: // Cofre legendario
            const isLegendary = item.id === 8;
            const lingotsWon = isLegendary ? Math.floor(Math.random() * 251) + 250 : Math.floor(Math.random() * 101) + 100;
            const chipsWon = isLegendary ? Math.floor(Math.random() * 11) + 10 : Math.floor(Math.random() * 6) + 5;
            
            updates.goldLingots = increment(lingotsWon);
            updates.casinoChips = increment(chipsWon);

            let rewardsDescription = `¡Ganaste ${lingotsWon} lingotes y ${chipsWon} fichas!`;
            
            const premiumChance = isLegendary ? 0.05 : 0.01;
            if (Math.random() < premiumChance) {
                 if (!userProfile.hasPremiumPass) {
                    updates.hasPremiumPass = true;
                    rewardsDescription += " ¡Y el Pase HV Premium!";
                 } else {
                    updates.gems = increment(5);
                    rewardsDescription += " ¡Y 5 gemas de consolación!";
                 }
            }
            
            purchaseDescription = rewardsDescription;
            purchaseTitle = isLegendary ? "Cofre Legendario Abierto" : "Cofre Épico Abierto";
            break;
        default:
            toast({ variant: 'destructive', title: "No se puede usar", description: "Este objeto no tiene un efecto al usarlo." });
            return;
    }
    
    // Remove the used item from inventory
    updates.userItems = arrayRemove(userOwnedItem);
    
    updateDocumentNonBlocking(userProfileRef, updates);

    toast({
        title: purchaseTitle,
        description: purchaseDescription,
    });
  };

  const handleClaimAchievement = (achievement: StudyAchievement) => {
    if (!userProfileRef) return;
    
    const { reward } = achievement;
    const updates: { [key: string]: any } = {
        claimedStudyAchievements: arrayUnion(achievement.id)
    };

    let description = 'Has recibido: ';
    const rewards: string[] = [];

    if (reward.xp) {
        updates.experiencePoints = increment(reward.xp);
        rewards.push(`${reward.xp.toLocaleString()} XP`);
    }
    if (reward.goldLingots) {
        updates.goldLingots = increment(reward.goldLingots);
        rewards.push(`${reward.goldLingots} lingotes`);
    }
    if (reward.gems) {
        updates.gems = increment(reward.gems);
        rewards.push(`${reward.gems} gemas`);
    }
    if (reward.casinoChips) {
        updates.casinoChips = increment(reward.casinoChips);
        rewards.push(`${reward.casinoChips} fichas`);
    }
    if (reward.chest) {
        const chestItem = tiendaItems.find(item => item.id === (reward.chest === 'epic' ? 7 : 8));
        if (chestItem) {
            updates.userItems = arrayUnion({ itemId: chestItem.id, purchaseDate: new Date().toISOString() });
            rewards.push(`1x Cofre ${reward.chest === 'epic' ? 'Épico' : 'Legendario'}`);
        }
    }

    updateDocumentNonBlocking(userProfileRef, updates);

    toast({
        title: `¡Logro Desbloqueado: ${achievement.name}!`,
        description: description + rewards.join(', ') + '.',
    });
  };
  
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
          <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/> Estadísticas</CardTitle>
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
         <CardFooter className="flex-col items-stretch gap-2">
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Backpack className="h-5 w-5 text-primary"/> Mochila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Inventory 
            userItems={userProfile.userItems || []} 
            allItems={tiendaItems}
            onUseItem={handleUseItem}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Logros de Estudio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementsList
            totalStudyHours={totalStudyHours}
            claimedAchievements={userProfile.claimedStudyAchievements || []}
            onClaim={handleClaimAchievement}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Temas de Color</div>
             <Button variant="ghost" size="sm" onClick={handleResetTheme}>Restablecer</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {colorThemes.map(theme => {
                    const unlockedForTesting = ['default-theme', 'theme-blue', 'theme-turquoise', 'theme-green', 'theme-lightblue', 'theme-lilac', 'theme-orange', 'theme-yellow', 'theme-red', 'theme-cyan', 'theme-magenta'];
                    const isUnlocked = unlockedForTesting.includes(theme.id) || userProfile.unlockedThemes?.includes(theme.id);
                    
                    if (!isUnlocked) return null;

                    const isSelected = (userProfile.selectedThemeId ?? 'default-theme') === theme.id;
                    return (
                        <div 
                            key={theme.id} 
                            className={cn(
                                "relative aspect-square rounded-lg flex items-center justify-center border-4 transition-all",
                                isSelected ? "border-primary shadow-lg" : "border-transparent",
                                "cursor-pointer hover:border-primary/50"
                            )}
                            style={{ backgroundColor: `hsl(${theme.primary})`}}
                            onClick={() => handleSelectTheme(theme.id)}
                        >
                            <span className="font-bold text-xs text-primary-foreground mix-blend-difference">{theme.name}</span>
                        </div>
                    )
                })}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Fondos de Perfil</div>
             <Button variant="ghost" size="sm" onClick={handleResetBackground}>Restablecer</Button>
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
    </div>
  );
}
