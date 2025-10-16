'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Check, Copy } from "lucide-react";

export function ShareButton() {
  const [url, setUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This code runs only on the client, so `window` is available.
    setUrl(window.location.origin);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Ya puedes pegar el enlace para compartir tu juego.",
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Compartir Juego
        </CardTitle>
        <CardDescription>
          Usa este enlace para que tus amigos puedan jugar tu aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
          <Input
            value={url}
            readOnly
            className="flex-1"
            aria-label="Enlace para compartir el juego"
          />
          <Button type="button" size="icon" onClick={handleCopy}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copiar enlace</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
