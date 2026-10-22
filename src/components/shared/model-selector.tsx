import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PROVIDERS: { provider: string; models: { id: string; temperature: boolean }[] }[] = [
  {
    provider: "OpenAI",
    models: [
      { id: "gpt-4o-mini", temperature: true },
      { id: "gpt-4o", temperature: true },
      { id: "o3-mini", temperature: false },
    ],
  },
  { provider: "Anthropic", models: [{ id: "claude-3.5-sonnet", temperature: true }] },
  { provider: "Google", models: [{ id: "gemini-1.5-pro", temperature: true }] },
  { provider: "Meta (self-hosted)", models: [{ id: "llama-3.1-70b", temperature: true }] },
];
export const supportsTemperature = (id: string) =>
  PROVIDERS.flatMap((p) => p.models).find((m) => m.id === id)?.temperature ?? true;

export function ModelSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Model" className={className}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {PROVIDERS.map((p) => (
          <SelectGroup key={p.provider}>
            <SelectLabel>{p.provider}</SelectLabel>
            {p.models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
