'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, updateDoc, increment, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit, Plus, Save, Trash2, X, Zap } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const weeklyRoutineRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'weeklyRoutine');
  }, [firestore, user]);

  const { data: weeklyRoutine, isLoading: isRoutineLoading } = useCollection<RoutineDay>(weeklyRoutineRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  // Ensure routine documents exist for all days
  useEffect(() => {
    if (weeklyRoutineRef && !isRoutineLoading) {
      daysOfWeek.forEach(day => {
        const dayExists = weeklyRoutine?.some(d => d.id === day.id);
        if (!dayExists) {
          const dayDocRef = doc(weeklyRoutineRef, day.id);
          setDoc(dayDocRef, { exercises: [] });
        }
      });
    }
  }, [weeklyRoutineRef, weeklyRoutine, isRoutineLoading]);


  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !editingDay || !weeklyRoutineRef) return;
    
    const dayRoutine = weeklyRoutine?.find(d => d.id === editingDay);
    const dayDocRef = doc(weeklyRoutineRef, editingDay);

    const newExercise: Exercise = {
      id: new Date().toISOString(), // Unique ID
      name: newExerciseName,
      completed: false,
    };
    
    const updatedExercises = dayRoutine ? [...dayRoutine.exercises, newExercise] : [newExercise];

    setDocumentNonBlocking(dayDocRef, { exercises: updatedExercises }, { merge: true });
    setNewExerciseName('');
    setIsDialogOpen(false);
  };

  const handleRemoveExercise = (dayId: string, exerciseId: string) => {
    if (!weeklyRoutineRef) return;

    const dayRoutine = weeklyRoutine?.find(d => d.id === dayId);
    if (!dayRoutine) return;

    const dayDocRef = doc(weeklyRoutineRef, dayId);
    const updatedExercises = dayRoutine.exercises.filter(ex => ex.id !== exerciseId);

    setDocumentNonBlocking(dayDocRef, { exercises: updatedExercises }, { merge: true });
  };
  
  const toggleCompleteExercise = (dayId: string, exerciseId: string) => {
    if (!weeklyRoutineRef || !userProfileRef) return;

    const dayRoutine = weeklyRoutine?.find(d => d.id === dayId);
    if (!dayRoutine) return;
    
    const dayDocRef = doc(weeklyRoutineRef, dayId);
    const targetExercise = dayRoutine.exercises.find(ex => ex.id === exerciseId);
    
    if(!targetExercise) return;
    
    const xpReward = 25; // XP per exercise
    
    // Only give points if marking as complete
    if (!targetExercise.completed) {
      updateDocumentNonBlocking(userProfileRef, {
        experiencePoints: increment(xpReward)
      });
      toast({
        title: "¡Ejercicio completado!",
        description: `¡Has ganado ${xpReward} XP!`,
      });
    }

    const updatedExercises = dayRoutine.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
    );
    setDocumentNonBlocking(dayDocRef, { exercises: updatedExercises }, { merge: true });
  }
  
  const isLoading = isUserLoading || isRoutineLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">Rutina Semanal</h1>
            <p className="text-muted-foreground mt-2">Planifica y registra tu entrenamiento.</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'default' : 'outline'}>
          {isEditing ? <Save className="mr-2"/> : <Edit className="mr-2"/>}
          {isEditing ? 'Guardar' : 'Editar'}
        </Button>
      </section>

       {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : (
            <div className="space-y-4">
                {daysOfWeek.map(day => {
                const routineForDay = weeklyRoutine?.find(r => r.id === day.id);
                const isToday = getToday() === day.id;
                
                return (
                    <Card key={day.id} className={cn("transition-all", isToday && 'border-primary border-2')}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                        <span>{day.name}</span>
                        {isEditing && (
                            <Dialog open={isDialogOpen && editingDay === day.id} onOpenChange={(open) => {
                                if (!open) setEditingDay(null);
                                setIsDialogOpen(open);
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => {
                                        setEditingDay(day.id);
                                        setIsDialogOpen(true);
                                    }}>
                                        <Plus/>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Añadir Ejercicio a {day.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input 
                                            placeholder="Nombre del ejercicio (ej. Flexiones)"
                                            value={newExerciseName}
                                            onChange={(e) => setNewExerciseName(e.target.value)}
                                        />
                                        <Button className="w-full" onClick={handleAddExercise}>Añadir</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {routineForDay && routineForDay.exercises.length > 0 ? (
                        <ul className="space-y-3">
                            {routineForDay.exercises.map(exercise => (
                            <li key={exercise.id} className="flex items-center justify-between group">
                                <span className={cn("font-medium", exercise.completed && 'line-through text-muted-foreground')}>
                                {exercise.name}
                                </span>
                                {isEditing ? (
                                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleRemoveExercise(day.id, exercise.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                ) : (
                                isToday && (
                                    <Button 
                                        variant={exercise.completed ? "secondary" : "default"} 
                                        size="sm"
                                        onClick={() => toggleCompleteExercise(day.id, exercise.id)}
                                        >
                                        {exercise.completed ? <X className="mr-2"/> : <Check className="mr-2"/>}
                                        {exercise.completed ? 'Deshacer' : 'Hecho'}
                                    </Button>
                                )
                                )}
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <p className="text-muted-foreground text-sm text-center">Día de descanso.</p>
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
