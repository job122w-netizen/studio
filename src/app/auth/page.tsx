'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useUser, setDocumentNonBlocking, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignUp, initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AuthErrorCodes, UserCredential } from 'firebase/auth';
import { doc, serverTimestamp, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function AuthPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const createUserProfile = async (user: UserCredential['user']) => {
    if (!firestore) return;
    const userProfileRef = doc(firestore, 'users', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (!userProfileSnap.exists()) {
        const newUserProfile = {
            username: user.displayName || (user.isAnonymous ? 'Usuario Anónimo' : user.email?.split('@')[0]) || 'Usuario',
            email: user.email || 'anonimo@desafiohv.com',
            level: 1,
            experiencePoints: 0,
            goldLingots: 0,
            casinoChips: 0,
            createdAt: serverTimestamp(),
            imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            currentStreak: 0,
            lastActivityDate: null,
            hvPassLevel: 1,
            hvPassXp: 0,
            hasPremiumPass: false,
            unlockedBackgrounds: [],
        };
        setDocumentNonBlocking(userProfileRef, newUserProfile, {});
    }
  };

  const handleAuthError = (errorCode: string) => {
    let description = "Ocurrió un error inesperado.";
    switch (errorCode) {
        case AuthErrorCodes.USER_DELETED:
            description = "El usuario no existe.";
            break;
        case AuthErrorCodes.INVALID_EMAIL:
            description = "El correo electrónico no es válido.";
            break;
        case "auth/invalid-credential":
        case AuthErrorCodes.INVALID_PASSWORD:
             description = "La contraseña es incorrecta.";
            break;
        case AuthErrorCodes.EMAIL_EXISTS:
             description = "El correo electrónico ya está en uso.";
            break;
        case AuthErrorCodes.WEAK_PASSWORD:
            description = "La contraseña es demasiado débil.";
            break;
        default:
            description = "Por favor, revisa tus credenciales e inténtalo de nuevo."
            break;
    }
    toast({
      variant: 'destructive',
      title: 'Error de Autenticación',
      description: description,
    });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>, isSignUp: boolean) => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      let userCredential: UserCredential;
      if (isSignUp) {
        userCredential = await initiateEmailSignUp(auth, values.email, values.password);
        await createUserProfile(userCredential.user);
      } else {
        await initiateEmailSignIn(auth, values.email, values.password);
      }
      // onAuthStateChanged will handle redirect
    } catch (error: any) {
        handleAuthError(error.code);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
        const userCredential = await initiateAnonymousSignIn(auth);
        await createUserProfile(userCredential.user);
    } catch(error: any) {
        handleAuthError(error.code);
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isUserLoading || user) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>Cargando...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bienvenido a Desafío HV</CardTitle>
          <CardDescription>Tu viaje de desarrollo personal comienza aquí.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <div className="flex gap-2 w-full">
            <Button 
                onClick={form.handleSubmit((values) => onSubmit(values, false))} 
                disabled={isSubmitting} 
                className="w-full"
            >
              {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>
            <Button 
                onClick={form.handleSubmit((values) => onSubmit(values, true))} 
                disabled={isSubmitting}
                variant="secondary"
                className="w-full"
            >
              {isSubmitting ? 'Registrando...' : 'Registrarse'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">O</p>
          <Button 
            onClick={handleAnonymousSignIn} 
            variant="outline" 
            className="w-full"
            disabled={isSubmitting}
            >
            Entrar como Anónimo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
