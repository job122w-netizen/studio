'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tiendaItems as placeholderItems } from "@/lib/placeholder-data";
import { Gem, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";

export default function TiendaPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);


  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Tienda HV</h1>
          <p className="text-muted-foreground mt-2">Potencia tu progreso.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
           <Gem className="h-5 w-5 text-primary"/>
           <span className="font-bold text-lg">{userProfile?.goldLingots ?? 0}</span>
        </div>
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
              <Button size="sm" className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="mr-1">{item.price}</span>
                <Gem className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
