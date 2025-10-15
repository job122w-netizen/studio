import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ListChecks, BookOpen } from "lucide-react";

export default function Home() {
  const recentActivities = [
    { type: 'Estudio', detail: 'Psicología', duration: '45 min' },
    { type: 'Ejercicio', detail: 'Meditación', duration: '10 min' },
    { type: 'Estudio', detail: 'Programación', duration: '1.2 horas' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Tu Espacio de Crecimiento</h1>
        <p className="text-muted-foreground mt-2">"La disciplina es el puente entre las metas y los logros."</p>
      </section>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Registrar Estudio</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-6xl font-bold font-mono text-primary">00:00:00</p>
          <Button size="lg" className="w-full">Iniciar Sesión de Estudio</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {recentActivities.map((activity, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                       <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.type}: {activity.detail}</p>
                      <p className="text-sm text-muted-foreground">{activity.duration}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">+15 XP</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground">No hay actividad reciente. ¡Empieza a estudiar!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
