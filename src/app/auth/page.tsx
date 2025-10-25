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
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Auth, AuthErrorCodes, User, UserCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        ... (path data continues) ...
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


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

  const createUserProfile = async (user: User) => {
    if (!firestore) return;
    const userProfileRef = doc(firestore, 'users', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
        // Profile exists, update it with the latest info from the auth provider
        const updateData: { username?: string, imageUrl?: string } = {};
        if (user.displayName) {
            updateData.username = user.displayName;
        }
        if (user.photoURL) {
            updateData.imageUrl = user.photoURL;
        }
        if (Object.keys(updateData).length > 0) {
            await updateDoc(userProfileRef, updateData);
        }
    } else {
        // Profile doesn't exist, create a new one
        const newUserProfile = {
            username: user.displayName || (user.isAnonymous ? 'Usuario Anónimo' : user.email?.split('@')[0]) || 'Usuario',
            email: user.email || 'anonimo@desafiohv.com',
            level: 1,
            experiencePoints: 0,
            goldLingots: 0,
            casinoChips: 0,
            gems: 0,
            createdAt: serverTimestamp(),
            imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            currentStreak: 0,
            lastActivityDate: null,
            hvPassLevel: 1,
            hvPassXp: 0,
            hasPremiumPass: false,
            unlockedBackgrounds: [],
            selectedBackgroundId: null,
            unlockedThemes: ['default-theme'],
            selectedThemeId: 'default-theme',
            mineSweeperMultiplier: 1,
            bombStreak: 0,
            userItems: [],
            claimedStudyAchievements: [],
            claimedStreakAchievements: []
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
             description = "Correo o contraseña incorrectos.";
            break;
        case AuthErrorCodes.EMAIL_EXISTS:
             description = "El correo electrónico ya está en uso por otra cuenta.";
            break;
        case AuthErrorCodes.WEAK_PASSWORD:
            description = "La contraseña es demasiado débil (mínimo 6 caracteres).";
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
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      }
      await createUserProfile(userCredential.user);
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

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
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
                onClick={handleGoogleSignIn} 
                variant="outline" 
                className="w-full"
                disabled={isSubmitting}
                >
                <GoogleIcon className="mr-2 h-4 w-4"/>
                Entrar con Google
            </Button>
          <Button 
            onClick={handleAnonymousSignIn} 
            variant="link" 
            className="w-full text-muted-foreground"
            disabled={isSubmitting}
            >
            Entrar como Anónimo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    