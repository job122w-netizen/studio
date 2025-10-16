'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tiendaItems as placeholderItems } from "@/lib/placeholder-data";
import { Coins, Gem, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment, arrayUnion } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TiendaPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const handlePurchase = (item: typeof placeholderItems[0]) => {
    if (!userProfileRef || !userProfile) return;

    const hasEnoughCurrency = item.currency === 'gems'
        ? (userProfile.gems ?? 0) >= item.price
        : (userProfile.goldLingots ?? 0) >= item.price;

    if (!hasEnoughCurrency) {
        toast({
            variant: "destructive",
            title: "Fondos insuficientes",
            description: `No tienes suficientes ${item.currency === 'gems' ? 'gemas' : 'lingotes'} para comprar esto.`,
        });
        return;
    }

    const updates: { [key: string]: any } = {};

    // Deduct currency
    if (item.currency === 'gems') {
        updates.gems = increment(-item.price);
    } else {
        updates.goldLingots = increment(-item.price);
    }

    // Add item effect
    switch (item.id) {
        case 5: // 1 gema
            updates.gems = increment(1 - (item.currency === 'gems' ? item.price : 0));
            break;
        case 6: // 10 fichas
            updates.casinoChips = increment(10);
            break;
        case 7: // Cofre épico
        case 8: // Cofre legendario
            updates.userItems = arrayUnion({ itemId: item.id, purchaseDate: new Date().toISOString() });
            break;
        default: // Items genéricos (no implementado en este ejemplo)
             updates.userItems = arrayUnion({ itemId: item.id, purchaseDate: new Date().toISOString() });
             break;
    }

    updateDocumentNonBlocking(userProfileRef, updates);

    toast({
        title: "¡Compra realizada!",
        description: `Has comprado ${item.name}.`,
    });
  };
  
  const isLoading = isUserLoading || isProfileLoading;


  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Tienda HV</h1>
          <p className="text-muted-foreground mt-2">Potencia tu progreso.</p>
        </div>
        {isLoading ? (
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
            </div>
        ) : (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                   <Coins className="h-5 w-5 text-yellow-500"/>
                   <span className="font-bold text-lg">{userProfile?.goldLingots ?? 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                   <Gem className="h-5 w-5 text-purple-400"/>
                   <span className="font-bold text-lg">{userProfile?.gems ?? 0}</span>
                </div>
            </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4">
        {placeholderItems.map((item) => (
          <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {item.image && (
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={item.image.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  data-ai-hint={item.image.imageHint}
                />
              </div>
            )}
            <CardHeader className="p-4 flex-grow">
              <CardTitle className="text-base">{item.name}</CardTitle>
              <CardDescription className="text-xs">{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0">
              <Button size="sm" className="w-full" onClick={() => handlePurchase(item)} disabled={isLoading}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="mr-1">{item.price}</span>
                {item.currency === 'gems' ? <Gem className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
