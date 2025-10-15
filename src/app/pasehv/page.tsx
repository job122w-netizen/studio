import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, Star, Zap } from "lucide-react";

export default function PaseHVPage() {
  const benefits = [
    "Doble de puntos XP en todas las actividades",
    "Acceso a ejercicios y cursos exclusivos",
    "Icono de perfil y nombre de usuario premium",
    "Descuentos especiales en la tienda",
    "Acceso prioritario a nuevas funciones",
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="text-3xl font-bold font-headline text-foreground mt-2">Pase HV Premium</h1>
        <p className="text-muted-foreground mt-2">Desbloquea todo el potencial de tu desarrollo.</p>
      </section>

      <Card className="shadow-lg bg-gradient-to-br from-primary via-purple-600 to-indigo-700 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Conviértete en Premium</CardTitle>
          <CardDescription className="text-purple-200">Acceso ilimitado a todas las herramientas para crecer.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 text-accent flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <div className="text-center">
                <p className="text-4xl font-bold">$9.99<span className="text-lg font-normal text-purple-200">/mes</span></p>
            </div>
          <Button size="lg" variant="secondary" className="w-full text-primary font-bold hover:bg-white/90">
            <Zap className="mr-2 h-4 w-4" />
            Obtener Pase HV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
