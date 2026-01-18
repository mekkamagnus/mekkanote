import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MobileNavigation from "@/components/navigation/mobile-navigation";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <header className="absolute top-4 right-4 md:right-auto md:left-4 flex items-center space-x-2">
        <MobileNavigation />
        <ThemeToggle />
      </header>
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start sm:text-left">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to MekkaNote
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your AI-powered note-taking application with smart tagging and linking capabilities.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link href="/notes">
            <Button variant="default">View My Notes</Button>
          </Link>
          <Link href="/notes/create">
            <Button variant="outline">Create New Note</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
