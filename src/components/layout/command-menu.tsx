import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileDown, Moon, Plus, Sparkles, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTheme } from "@/lib/theme";
import { ALL_PAGES } from "./nav";

export const openCommandMenu = () => window.dispatchEvent(new Event("promptiq:command"));

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { resolved, setTheme } = useTheme();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("promptiq:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("promptiq:command", onOpen);
    };
  }, []);
  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          {ALL_PAGES.map((p) => (
            <CommandItem key={p.url} onSelect={() => go(() => navigate({ to: p.url }))}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => go(() => navigate({ to: "/experiments", search: { new: true } }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            New experiment
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/prompt-lab" }))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Optimize a prompt
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/analytics" }))}>
            <FileDown className="mr-2 h-4 w-4" />
            Export analytics CSV
          </CommandItem>
          <CommandItem onSelect={() => go(() => setTheme(resolved === "dark" ? "light" : "dark"))}>
            {resolved === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
