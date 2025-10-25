'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, setDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit, Plus, Save, Trash2, X, CheckCircle } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { updateUserStreak } from '@/lib/streaks';
import { updateCasinoChips } from '@/lib/transactions';
import { StreakToast } from '@/components/ui/streak-toast';

type Exercise = {
  id: string;
  name: string;
  completed: boolean;
};

type RoutineDay = {
  id: string; // 'lunes', 'martes', etc.
  exercises: Exercise[];
};

const daysOfWeek = [
  { id: 'lunes', name: 'Lunes' },
  { id: 'martes', name: 'Martes' },
  { id: 'miercoles', name: 'Miércoles' },
  { id: 'jueves', name: 'Jueves' },
  { id: 'viernes', name: 'Viernes' },
  { id: 'sabado', name: 'Sábado' },
  { id: 'domingo', name: 'Domingo' },
];

const getToday = () => {
    const dayIndex = new Date().getDay();
    // JS Sunday is 0, we want it to be 6 to match our array
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return daysOfWeek[adjustedIndex].id;
}

export default function EjerciciosPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  
  const [localRoutine, setLocalRoutine] = useState<RoutineDay[]>([]);

  const weeklyRoutineRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'weeklyRoutine');
  }, [firestore, user]);

  const { data: weeklyRoutine, isLoading: isRoutineLoading } = useCollection<RoutineDay>(weeklyRoutineRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  useEffect(() => {
    if (weeklyRoutine) {
      const fullRoutine = daysOfWeek.map(day => {
        const firestoreDay = weeklyRoutine.find(d => d.id === day.id);
        return firestoreDay || { id: day.id, exercises: [] };
      });
      setLocalRoutine(fullRoutine);
    } else if (!isRoutineLoading) {
      setLocalRoutine(daysOfWeek.map(day => ({ id: day.id, exercises: [] })));
    }
  }, [weeklyRoutine, isRoutineLoading]);

  const handleSaveChanges = () => {
    if (!weeklyRoutineRef) return;
    localRoutine.forEach(day => {
      const dayDocRef = doc(weeklyRoutineRef, day.id);
      const dataToSave = { exercises: day.exercises.map(({id, name, completed}) => ({id, name, completed: !!completed})) };
      setDocumentNonBlocking(dayDocRef, dataToSave, { merge: true });
    });
    setIsEditing(false);
    toast({
      title: "Rutina guardada",
      description: "Tus cambios se han guardado correctamente.",
    });
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !editingDay) return;
    
    const newExercise: Exercise = {
      id: new Date().toISOString(),
      name: newExerciseName,
      completed: false,
    };
    
    setLocalRoutine(currentRoutine => {
        return currentRoutine.map(day => {
            if (day.id === editingDay) {
                return { ...day, exercises: [...day.exercises, newExercise] };
            }
            return day;
        });
    });

    setNewExerciseName('');
    setEditingDay(null);
  };

  const handleRemoveExercise = (dayId: string, exerciseId: string) => {
    setLocalRoutine(currentRoutine => {
        return currentRoutine.map(day => {
            if (day.id === dayId) {
                return { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) };
            }
            return day;
        });
    });
  };
  
  const toggleCompleteExercise = async (dayId: string, exerciseId: string) => {
    if (!userProfileRef || !weeklyRoutineRef) return;

    let isCompleting = false;
    let wasDayAlreadyCompleted = false;

    const dayBeforeUpdate = localRoutine.find(d => d.id === dayId);
    if(dayBeforeUpdate && dayBeforeUpdate.exercises.length > 0){
        wasDayAlreadyCompleted = dayBeforeUpdate.exercises.every(ex => ex.completed);
    }

    const newLocalRoutine = localRoutine.map(day => {
      if (day.id === dayId) {
        const updatedExercises = day.exercises.map(ex => {
          if (ex.id === exerciseId) {
            isCompleting = !ex.completed;
            return { ...ex, completed: !ex.completed };
          }
          return ex;
        });
        return { ...day, exercises: updatedExercises };
      }
      return day;
    });

    setLocalRoutine(newLocalRoutine);

    const dayRoutine = newLocalRoutine.find(d => d.id === dayId);
    if (!dayRoutine) return;
    
    const xpReward = 100;
    
    if (isCompleting) {
      updateDocumentNonBlocking(userProfileRef, {
        experiencePoints: increment(xpReward)
      });
      toast({
        title: "¡Ejercicio completado!",
        description: `¡Has ganado ${xpReward} XP!`,
      });
      const { updated, newStreak } = await updateUserStreak(userProfileRef);
      if (updated && newStreak > 0) {
        toast({
            duration: 5000,
            component: <StreakToast streak={newStreak} />,
        });
      }

      const isDayNowCompleted = dayRoutine.exercises.length > 0 && dayRoutine.exercises.every(ex => ex.completed);

      if (isDayNowCompleted && !wasDayAlreadyCompleted) {
        updateDocumentNonBlocking(userProfileRef, {
            goldLingots: increment(3)
        });
        updateCasinoChips(userProfileRef, 3);
        toast({
            title: "¡Rutina del día completada!",
            description: "¡Has ganado 3 lingotes de oro y 3 fichas de casino por tu disciplina!",
        });
      }

    } else {
         updateDocumentNonBlocking(userProfileRef, {
            experiencePoints: increment(-xpReward)
         });
         toast({
            title: "Ejercicio deshecho",
            description: `Se han restado ${xpReward} XP.`,
            variant: 'destructive'
        });
    }

    const dayDocRef = doc(weeklyRoutineRef, dayId);
    setDocumentNonBlocking(dayDocRef, { exercises: dayRoutine.exercises }, { merge: true });
  }
  
  const isLoading = isUserLoading || isRoutineLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">Rutina Semanal</h1>
            <p className="text-muted-foreground mt-2">Planifica y registra tu entrenamiento.</p>
        </div>
        <Button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} variant={isEditing ? 'default' : 'outline'}>
          {isEditing ? <Save className="mr-2 h-4 w-4"/> : <Edit className="mr-2 h-4 w-4"/>}
          {isEditing ? 'Guardar' : 'Editar'}
        </Button>
      </section>

       {isLoading && localRoutine.length === 0 ? (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        ) : (
            <div className="space-y-4">
                {localRoutine.map(day => {
                const isToday = getToday() === day.id;
                
                return (
                    <Card key={day.id} className={cn("transition-all duration-300 hover:shadow-md", isToday && 'border-primary/50 border-2 shadow-primary/10')}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-xl font-semibold">
                        <span>{daysOfWeek.find(d => d.id === day.id)?.name}</span>
                        {isEditing && (
                            <Dialog onOpenChange={(open) => !open && setEditingDay(null)}>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full" onClick={() => setEditingDay(day.id)}>
                                        <Plus className="h-5 w-5"/>
                                    </Button>
                                </DialogTrigger>
                                {editingDay === day.id && (
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Añadir Ejercicio a {daysOfWeek.find(d => d.id === day.id)?.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Input 
                                            placeholder="Nombre del ejercicio (ej. Flexiones)"
                                            value={newExerciseName}
                                            onChange={(e) => setNewExerciseName(e.target.value)}
                                        />
                                        <DialogClose asChild>
                                            <Button className="w-full" onClick={handleAddExercise}>Añadir</Button>
                                        </DialogClose>
                                    </div>
                                </DialogContent>
                                )}
                            </Dialog>
                        )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {day.exercises && day.exercises.length > 0 ? (
                        <ul className="space-y-3">
                            {day.exercises.map(exercise => (
                            <li key={exercise.id} className="flex items-center justify-between group p-2 rounded-lg transition-colors duration-200 hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  {exercise.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    isToday && <div className="h-5 w-5 border-2 border-muted-foreground rounded-full flex-shrink-0 group-hover:border-primary" />
                                  )}
                                  <span className={cn("font-medium", exercise.completed && 'line-through text-muted-foreground')}>
                                  {exercise.name}
                                  </span>
                                </div>
                                {isEditing ? (
                                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full" onClick={() => handleRemoveExercise(day.id, exercise.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                ) : (
                                isToday && (
                                    <Button 
                                        variant={exercise.completed ? "outline" : "default"} 
                                        size="sm"
                                        className="rounded-full px-4"
                                        onClick={() => toggleCompleteExercise(day.id, exercise.id)}
                                        >
                                        {exercise.completed ? <X className="mr-2 h-4 w-4"/> : <Check className="mr-2 h-4 w-4"/>}
                                        {exercise.completed ? 'Deshacer' : 'Hecho'}
                                    </Button>
                                )
                                )}
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Día de descanso.</p>
                        )}
                    </CardContent>
                    </Card>
                );
                })}
            </div>
       )}
    </div>
  );
}
