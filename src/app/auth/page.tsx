'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Auth, AuthErrorCodes, User, UserCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isClient && !isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router, isClient]);

  const createUserProfile = async (user: User) => {
    if (!firestore) return;
    const userProfileRef = doc(firestore, 'users', user.uid);
    
    try {
        const userProfileSnap = await getDoc(userProfileRef);

        if (!userProfileSnap.exists()) {
            // Profile doesn't exist, create it.
            const newUserProfile = {
                username: user.displayName || (user.isAnonymous ? 'Usuario Anónimo' : user.email?.split('@')[0]) || 'Usuario',
                email: user.email || 'anonimo@desafiohv.com',
                level: 1,
                experiencePoints: 0,
                studyHours: 0,
                goldLingots: 0,
                casinoChips: 15,
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
            await setDoc(userProfileRef, newUserProfile);
        } else {
            // Profile exists, update with provider data if necessary.
            const profileData = userProfileSnap.data();
            const updateData: { [key: string]: any } = {};

            if (user.displayName && user.displayName !== profileData.username) {
                updateData.username = user.displayName;
            }
            if (user.photoURL && user.photoURL !== profileData.imageUrl) {
                updateData.imageUrl = user.photoURL;
            }
            if (user.email && user.email !== profileData.email) {
                updateData.email = user.email;
            }

            if (Object.keys(updateData).length > 0) {
                await updateDoc(userProfileRef, updateData);
            }
        }
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
        // Re-throw the error to be caught by the calling function's catch block
        throw new Error("No se pudo crear o actualizar el perfil de usuario.");
    }
  };


  const handleAuthError = (errorCode: string) => {
    let description = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
    switch (errorCode) {
        case 'auth/user-not-found':
            description = "El usuario no existe. Por favor, regístrate.";
            break;
        case AuthErrorCodes.INVALID_EMAIL:
            description = "El formato del correo electrónico no es válido.";
            break;
        case "auth/invalid-credential":
             description = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales e inténtalo de nuevo.";
            break;
        case AuthErrorCodes.EMAIL_EXISTS:
             description = "El correo electrónico ya está en uso por otra cuenta. Intenta iniciar sesión.";
            break;
        case AuthErrorCodes.WEAK_PASSWORD:
            description = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
            break;
        case 'auth/network-request-failed':
            description = "Error de red. Por favor, comprueba tu conexión a internet.";
            break;
        case 'auth/popup-closed-by-user':
            description = "El proceso de inicio de sesión fue cancelado.";
            break;
        default:
            console.error("Unhandled Auth Error:", errorCode);
            break;
    }
    toast({
      variant: 'destructive',
      title: 'Error de Autenticación',
      description: description,
    });
  }

  const handleAuthSuccess = async (userCredential: UserCredential) => {
      try {
        await createUserProfile(userCredential.user);
        // The useEffect will handle the redirect once the user state is updated.
      } catch (profileError: any) {
        toast({
            variant: 'destructive',
            title: 'Error de Perfil',
            description: profileError.message || "No se pudo guardar el perfil después del registro.",
        });
      }
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
      await handleAuthSuccess(userCredential);
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
        await handleAuthSuccess(userCredential);
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
        await handleAuthSuccess(userCredential);
    } catch(error: any) {
        handleAuthError(error.code);
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!isClient || isUserLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <div className="text-center">
                <div role="status">
                    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">Cargando...</span>
                </div>
                <p className="mt-2">Verificando...</p>
            </div>
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
