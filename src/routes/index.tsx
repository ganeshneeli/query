import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PromptIQ" },
      { name: "description", content: "Better Prompts. Smarter Queries. Measurable Results." },
      { property: "og:title", content: "PromptIQ" },
      {
        property: "og:description",
        content: "Better Prompts. Smarter Queries. Measurable Results.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
