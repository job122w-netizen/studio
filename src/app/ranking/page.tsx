
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type RankingPlayer = {
  id: string;
  username: string;
  experiencePoints: number;
  imageUrl?: string;
};

export default function RankingPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!usersCollectionRef) return null;
    return query(usersCollectionRef, orderBy("experiencePoints", "desc"), limit(100));
  }, [usersCollectionRef]);

  const { data: rankedList, isLoading } = useCollection<RankingPlayer>(usersQuery);
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Ranking Global</h1>
        <p className="text-muted-foreground mt-2">Compite y mira tu progreso contra otros usuarios.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Clasificación General
          </CardTitle>
        </CardHeader>
        <CardContent>
           {isLoading && (!rankedList || rankedList.length === 0) ? (
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24 ml-auto" />
                </div>
              ))}
            </div>
           ) : !rankedList || rankedList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aún no hay nadie en el ranking. ¡Sigue ganando puntos para aparecer aquí!</p>
           ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-16">Rango</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Puntos HV</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rankedList.map((player, index) => (
                    <TableRow key={player.id} className={player.id === currentUser?.uid ? 'bg-primary/10' : ''}>
                    <TableCell className="font-bold text-lg text-center">
                        {index + 1 <= 3 ? (
                        <span className={
                            index + 1 === 1 ? "text-yellow-500" :
                            index + 1 === 2 ? "text-gray-400" :
                            "text-orange-400"
                        }>{index + 1}</span>
                        ) : (
                        index + 1
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={player.imageUrl} />
                            <AvatarFallback>{getInitials(player.username)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.username}</span>
                        {player.id === currentUser?.uid && <Badge variant="default">Tú</Badge>}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{player.experiencePoints.toLocaleString('es-ES')}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
