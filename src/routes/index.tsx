import { createFileRoute } from "@tanstack/react-router";
import { Wingbreaker } from "@/game/Wingbreaker";

export const Route = createFileRoute("/")({ component: Wingbreaker });
