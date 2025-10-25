'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tiendaItems } from "@/lib/placeholder-data";
import { Coins, Gem, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, increment, arrayUnion, Timestamp, updateDoc } from "firebase/firestore";
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

  const handlePurchase = async (item: typeof tiendaItems[0]) => {
    if (!userProfileRef || !userProfile) return;

    const hasEnoughCurrency = item.currency === 'gems'
        ? (userProfile.gems ?? 0) >= item.price
        : (userProfile.goldLingots ?? 0) >= item.price;
        
    const isAlreadyOwnedAndNotConsumable = !item.consumable && userProfile.userItems?.some((ownedItem: any) => ownedItem.itemId === item.id);
    
    if (isAlreadyOwnedAndNotConsumable) {
        toast({
            variant: "default",
            title: "Ya tienes este objeto",
            description: "No puedes comprar este objeto más de una vez.",
        });
        return;
    }

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
    
    let purchaseDescription = `Has comprado ${item.name}.`;
    let purchaseTitle = "¡Compra realizada!";

    // Handle item effects or adding to inventory
    // Consumable items that are not chests will be added to the inventory
    if (item.consumable) {
        switch (item.id) {
            case 5: // 1 gema
                updates.gems = increment((updates.gems?.value || 0) + 1);
                break;
            case 6: // 10 fichas
                updates.casinoChips = increment(10);
                break;
            case 1: // Gema de Enfoque - Added to inventory to be used later
            case 2: // Poción de Energía
            case 4: // Escudo Protector
            case 7: // Cofre Épico
            case 8: // Cofre Legendario
                 updates.userItems = arrayUnion({ itemId: item.id, purchaseDate: new Date().toISOString() });
                 purchaseDescription = `${item.name} ha sido añadido a tu mochila.`;
                break;
            default:
                 updates.userItems = arrayUnion({ itemId: item.id, purchaseDate: new Date().toISOString() });
                break;
        }
    } else {
        // Non-consumable items are also added to inventory
        updates.userItems = arrayUnion({ itemId: item.id, purchaseDate: new Date().toISOString() });
    }

    try {
        await updateDoc(userProfileRef, updates);
        toast({
            title: purchaseTitle,
            description: purchaseDescription,
        });
    } catch (error) {
        console.error("Error purchasing item: ", error);
        toast({
            title: "Error de compra",
            description: "No se pudo completar la compra. Intenta de nuevo.",
            variant: "destructive",
        });
    }
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
        {tiendaItems.map((item) => (
          <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
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
