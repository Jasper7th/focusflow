import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { PlannerTaskInput } from "../../lib/aiTypes";
import { validateSuggestedBlocks } from "../../lib/validateSuggestedBlocks";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  tasks: PlannerTaskInput[];
  weekStart: string;
  dayStartHour: number;
  dayEndHour: number;
};

function buildPrompt({
  tasks,
  weekStart,
  dayStartHour,
  dayEndHour,
}: RequestBody) {
  return `
You are a productivity assistant that creates a weekly study schedule.

Schedule the provided tasks into the current week.

Rules:
- Only schedule tasks within this week
- Prefer scheduling tasks before their due date
- Higher priority tasks should generally be scheduled earlier
- Tasks with closer due dates should generally be scheduled earlier
- Spread work across the week instead of stacking everything on one day
- Tasks may be split into multiple sessions
- Each session must be at least 30 minutes
- Use only 30-minute increments
- Allowed hours are from ${dayStartHour}:00 to ${dayEndHour}:00
- Do not overlap sessions
- Return only a JSON array
- Each item must follow this exact format:
  {
    "taskId": "string",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "durationMinutes": number
  }

Current week starts on: ${weekStart}

Tasks:
${JSON.stringify(tasks, null, 2)}
`.trim();
}

export async function POST(request: Request) {
  try {
    console.log("API KEY EXISTS:", !!process.env.OPENAI_API_KEY);

    const body = (await request.json()) as Partial<RequestBody>;

    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";
    const dayStartHour =
      typeof body.dayStartHour === "number" ? body.dayStartHour : 8;
    const dayEndHour =
      typeof body.dayEndHour === "number" ? body.dayEndHour : 22;

    if (!weekStart) {
      return NextResponse.json(
        { error: "Missing weekStart" },
        { status: 400 }
      );
    }

    const cleanedTasks = tasks
      .filter((task) => task && typeof task === "object")
      .filter((task) => task.title.trim() !== "")
      .filter((task) => task.estimatedMinutes > 0);

    if (cleanedTasks.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: buildPrompt({
        tasks: cleanedTasks,
        weekStart,
        dayStartHour,
        dayEndHour,
      }),
    });

    const text = response.output_text?.trim() ?? "[]";

    let parsed: unknown = [];

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = [];
    }

    const suggestions = validateSuggestedBlocks(
      parsed,
      cleanedTasks,
      weekStart,
      dayStartHour,
      dayEndHour
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Failed to generate weekly plan:", error);

    return NextResponse.json(
      { error: "Failed to generate weekly plan" },
      { status: 500 }
    );
  }
}