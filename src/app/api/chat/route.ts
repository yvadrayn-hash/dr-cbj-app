import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { detectCrisis, crisisResponse, generateResponse } from "@/lib/chat";

const systemPrompt = `You are Dr. CBJ's AI wellness assistant for Manor Group Health+ in Jamaica.

Provide warm, concise, culturally respectful emotional-wellness support. Respond directly to the user's current message while using the conversation history for continuity. Ask no more than one gentle follow-up question at a time.

You are not Dr. Coretta Brown-Johnson and must never claim to be human, a psychologist, a therapist, or a crisis service. Do not diagnose conditions, prescribe treatment or medication, or present your response as medical advice. Encourage professional support when appropriate without repeatedly pushing appointments.

If the user may be in immediate danger or may harm themselves or someone else, tell them to contact local emergency services or a crisis resource immediately. Do not provide instructions that facilitate harm.

When relevant, Dr. CBJ's office number is (876) 370-0095. Keep replies easy to read and use Markdown sparingly.`;

type ChatHistoryItem = {
  role: string;
  content: string;
};

async function generateOpenRouterResponse(
  input: string,
  history: ChatHistoryItem[]
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "X-OpenRouter-Title": "Dr. CBJ Mental Wellness",
    },
  });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((item) => ({
          role:
            item.role === "ASSISTANT"
              ? ("assistant" as const)
              : ("user" as const),
          content: item.content,
        })),
        { role: "user", content: input },
      ],
      temperature: 0.6,
      max_tokens: 500,
    });

    return completion.choices[0]?.message.content?.trim() || null;
  } catch (error) {
    console.error("OpenRouter error:", error);
    return null;
  }
}

const messageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { message, sessionId, isAnonymous } = parsed.data;

    const isCrisis = detectCrisis(message);

    let response: string;
    if (isCrisis) {
      response = crisisResponse;
    } else {
      const recentMessages = sessionId
        ? await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              role: true,
              content: true,
            },
          })
        : [];

      const history = recentMessages.reverse();
      response =
        (await generateOpenRouterResponse(message, history)) ||
        generateResponse(message, history);
    }

    let session;
    if (sessionId) {
      session = await prisma.chatSession.upsert({
        where: { id: sessionId },
        update: { updatedAt: new Date() },
        create: {
          id: sessionId,
          isAnonymous: isAnonymous ?? true,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "USER",
          content: message,
          isCrisis,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "ASSISTANT",
          content: response,
          isCrisis,
        },
      });
    }

    return NextResponse.json({
      response,
      isCrisis,
      sessionId: session?.id || sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your message." },
      { status: 500 }
    );
  }
}
