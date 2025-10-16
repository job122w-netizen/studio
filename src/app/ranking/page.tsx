
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
  id: string;
  username: string;
  experiencePoints: number;
  imageUrl?: string;
  isBot?: boolean;
};

type Ranking = {
    id: string;
    userId: string;
    username: string;
    score: number;
    imageUrl?: string;
    isBot?: boolean;
}

const botNames = [
  "Sombra", "Relámpago", "Titán", "Espectro", "Nova", "Fénix", 
  "Oráculo", "Vortex", "Lince", "Cometa", "Zenith", "Abismo"
];

// Function to generate bots based on the user's score
const generateBots = (userScore: number): Ranking[] => {
    const bots: Ranking[] = [];
    const botCount = 12;

    for (let i = 0; i < botCount; i++) {
        const scoreFluctuation = (Math.random() - 0.5) * userScore * 0.8; // Bots are +/- 40% of user score
        const botScore = Math.max(0, Math.floor(userScore + scoreFluctuation + (i * 150)));
        const botId = `bot-${i}`;
        bots.push({
            id: botId,
            userId: botId,
            username: botNames[i % botNames.length],
            score: botScore,
            imageUrl: `https://i.pravatar.cc/40?u=bot${i}`,
            isBot: true,
        });
    }
    return bots;
};


export default function RankingPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const rankingsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'rankings');
  }, [firestore]);

  const rankingsQuery = useMemoFirebase(() => {
    if (!rankingsCollectionRef) return null;
    return query(rankingsCollectionRef, orderBy("score", "desc"), limit(100));
  }, [rankingsCollectionRef]);

  const { data: rankings, isLoading } = useCollection<Ranking>(rankingsQuery);
  
  const currentUserData = useMemo(() => {
      return rankings?.find(r => r.userId === currentUser?.uid);
  }, [rankings, currentUser]);
  
  const rankedList = useMemo(() => {
    if (!rankings) return [];

    const currentUserScore = currentUserData?.score ?? 0;
    const bots = generateBots(currentUserScore);
    
    // Filter out the current user if they exist to avoid duplication
    const otherPlayers = rankings.filter(r => r.userId !== currentUser?.uid);
    const combinedList = [...otherPlayers, ...bots];

    // Add the current user back if they exist, to ensure they are in the list
    if (currentUserData) {
        combinedList.push(currentUserData);
    }

    return combinedList
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({ ...player, rank: index + 1 }));

  }, [rankings, currentUserData, currentUser?.uid]);


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
           {isLoading ? (
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
           ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-16">Rango</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rankedList.map((player) => (
                    <TableRow key={player.id} className={player.userId === currentUser?.uid ? 'bg-primary/10' : ''}>
                    <TableCell className="font-bold text-lg text-center">
                        {player.rank && player.rank <= 3 ? (
                        <span className={
                            player.rank === 1 ? "text-yellow-500" :
                            player.rank === 2 ? "text-gray-400" :
                            "text-orange-400"
                        }>{player.rank}</span>
                        ) : (
                        player.rank
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={player.imageUrl} />
                            <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.username}</span>
                        {player.userId === currentUser?.uid && <Badge variant="default">Tú</Badge>}
                        {player.isBot && <Badge variant="outline">Bot</Badge>}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{player.score.toLocaleString('es-ES')}</TableCell>
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
