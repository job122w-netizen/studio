import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rankingData } from "@/lib/placeholder-data";
import { Trophy } from "lucide-react";

export default function RankingPage() {
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
            Top 100 - General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rango</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((user) => (
                <TableRow key={user.rank} className={user.user === 'Tú' ? 'bg-primary/10' : ''}>
                  <TableCell className="font-bold text-lg text-center">
                    {user.rank <= 3 ? (
                      <span className={
                        user.rank === 1 ? "text-yellow-500" :
                        user.rank === 2 ? "text-gray-400" :
                        "text-orange-400"
                      }>{user.rank}</span>
                    ) : (
                      user.rank
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.user}</span>
                      {user.user === 'Tú' && <Badge variant="default">Tú</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{user.points.toLocaleString('es-ES')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
