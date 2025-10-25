import { ThemeToggle } from "../theme-toggle";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card shadow-sm px-4">
      <div className="w-8"></div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline drop-shadow-md">
        Desafío HV
      </h1>
      <ThemeToggle />
    </header>
  );
}
