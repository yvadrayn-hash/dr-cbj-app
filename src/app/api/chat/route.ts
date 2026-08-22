import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectCrisis, crisisResponse, generateResponse } from "@/lib/chat";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const systemPrompt = `You are Dr. CBJ's AI wellness assistant for Manor Group Health+ in Jamaica.

Provide warm, concise, culturally respectful emotional-wellness support. Respond directly to the user's current message while using the conversation history for continuity. Ask no more than one gentle follow-up question at a time.

You are not Dr. Coretta Brown-Johnson and must never claim to be human, a psychologist, a therapist, or a crisis service. Do not diagnose conditions, prescribe treatment or medication, or present your response as medical advice. Encourage professional support when appropriate without repeatedly pushing appointments.

If the user may be in immediate danger or may harm themselves or someone else, tell them to contact local emergency services or a crisis resource immediately. Do not provide instructions that facilitate harm.

When relevant, Dr. CBJ's office number is (876) 370-0095. Keep replies easy to read and use Markdown sparingly.`;

type ChatHistoryItem = {
  role: string;
  content: string;
};

// Normalize messages to plain text only, removing any toolUse/toolResult blocks
// that may be present in stored chat history
function normalizeMessageContent(content: string): string {
  // Remove toolUse blocks - match content between {"type":"toolUse" and }
  let normalized = content.replace(
    /{"type":"toolUse"[^}]*}/g,
    "[Tool use blocked]"
  );
  // Remove toolResult blocks - match content between {"type":"toolResult" and }
  normalized = normalized.replace(
    /{"type":"toolResult"[^}]*}/g,
    "[Tool result blocked]"
  );
  // Remove JSON-like toolUse blocks (for nested JSON content)
  normalized = normalized.replace(
    /"toolUse"\s*:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
    ""
  );
  // Remove JSON-like toolResult blocks
  normalized = normalized.replace(
    /"toolResult"\s*:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
    ""
  );
  // Trim any resulting whitespace
  return normalized.trim();
}

async function generateQwenResponse(
  input: string,
  history: ChatHistoryItem[]
): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  
  // Safe logging - only log that Qwen was attempted
  console.log("Qwen attempted");
  
  if (!apiKey) {
    console.log("Qwen failed: missing DASHSCOPE_API_KEY");
    return null;
  }
  
  // Log that API key is present for Qwen (no value, just presence)
  console.log("Qwen API key present");

  const client = new OpenAI({
    baseURL: "https://dashscope-us.aliyuncs.com/compatible-mode/v1",
    apiKey,
    defaultHeaders: {
      "X-DashScope-User-Agent": "Dr. CBJ Mental Wellness",
    },
  });

  // Normalize history to plain text only
  const normalizedHistory = history.map((item) => ({
    ...item,
    content: normalizeMessageContent(item.content),
  }));
  
  console.log("Qwen history normalized");

  try {
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedHistory.map((item) => ({
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
    
    const responseText = completion.choices[0]?.message.content?.trim() || null;
    
    if (responseText) {
      console.log("Qwen succeeded");
      // Tag response for debugging (not exposed to user, just in logs)
      console.log(`Qwen response (debug-tag: [QWEN_SUCCESS]): ${responseText.substring(0, 100)}...`);
    }
    
    return responseText;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Qwen failed:", errorMsg);
    // Don't log the full error if it contains sensitive data
    return null;
  }
}

async function generateOpenRouterResponse(
  input: string,
  history: ChatHistoryItem[]
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Safe logging
  console.log("OpenRouter attempted");
  
  if (!apiKey) {
    console.log("OpenRouter failed: missing OPENROUTER_API_KEY");
    return null;
  }
  
  console.log("OpenRouter API key present");

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "X-OpenRouter-Title": "Dr. CBJ Mental Wellness",
    },
  });

  // Normalize history to plain text only
  const normalizedHistory = history.map((item) => ({
    ...item,
    content: normalizeMessageContent(item.content),
  }));
  
  console.log("OpenRouter history normalized");

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedHistory.map((item) => ({
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
    
    const responseText = completion.choices[0]?.message.content?.trim() || null;
    
    if (responseText) {
      console.log("OpenRouter succeeded");
      console.log(`OpenRouter response (debug-tag: [OR_SUCCESS]): ${responseText.substring(0, 100)}...`);
    }
    
    return responseText;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("OpenRouter failed:", errorMsg);
    return null;
  }
}

const messageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  sessionId: z
    .string()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid session identifier")
    .optional(),
  isAnonymous: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    // Safe server logging - only log incoming request, no sensitive data
    console.log("POST /api/chat request received");
    
    // Abuse protection for the AI endpoint
    const limit = rateLimit(`chat:${getClientIp(request)}`, 30, 60 * 1000);
    if (!limit.allowed) {
      console.log("POST /api/chat ratelimited");
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const session = await auth();
    const authenticatedUserId = session?.user?.id ?? null;

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      console.log("POST /api/chat invalid input:", parsed.error?.toString());
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
      let recentMessages: ChatHistoryItem[] = [];

      if (sessionId) {
        const existingSession = await prisma.chatSession.findUnique({
          where: { id: sessionId },
          select: { id: true, userId: true },
        });

        if (existingSession) {
          // Ownership check: a session bound to a user may only be read by
          // that user. Unowned (anonymous legacy) sessions can be claimed by
          // the first authenticated user who continues them.
          if (
            existingSession.userId &&
            existingSession.userId !== authenticatedUserId
          ) {
            return NextResponse.json(
              { error: "Chat session not found." },
              { status: 404 }
            );
          }

          recentMessages = await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              role: true,
              content: true,
            },
          });
        }
      }

      const history = recentMessages.reverse();
      
      console.log(`Message received, crisis: ${isCrisis}, session: ${sessionId || 'anonymous'}`);
      
      // Trace response selection
      const qwenResponse = await generateQwenResponse(message, history);
      if (qwenResponse) {
        console.log("Qwen selected for response");
        response = qwenResponse;
      } else {
        console.log("Qwen returned null, trying OpenRouter...");
        const openRouterResponse = await generateOpenRouterResponse(message, history);
        if (openRouterResponse) {
          console.log("OpenRouter selected for response");
          response = openRouterResponse;
        } else {
          console.log("OpenRouter returned null, using fallback");
          response = generateResponse(message, history);
        }
      }
    }

    let activeSessionId: string | undefined;

    if (sessionId) {
      const existingSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true },
      });

      if (existingSession) {
        if (
          existingSession.userId &&
          existingSession.userId !== authenticatedUserId
        ) {
          return NextResponse.json(
            { error: "Chat session not found." },
            { status: 404 }
          );
        }

        // Claim unowned sessions for authenticated users so future access
        // is restricted to them
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            updatedAt: new Date(),
            ...(authenticatedUserId && !existingSession.userId
              ? { userId: authenticatedUserId }
              : {}),
          },
        });

        activeSessionId = sessionId;
      } else {
        await prisma.chatSession.create({
          data: {
            id: sessionId,
            userId: authenticatedUserId,
            isAnonymous: authenticatedUserId ? false : (isAnonymous ?? true),
          },
        });

        activeSessionId = sessionId;
      }

      await prisma.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: "USER",
          content: message,
          isCrisis,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: "ASSISTANT",
          content: response,
          isCrisis,
        },
      });
    }

    return NextResponse.json({
      response,
      isCrisis,
      sessionId: activeSessionId || sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your message." },
      { status: 500 }
    );
  }
}