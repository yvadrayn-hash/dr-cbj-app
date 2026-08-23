import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectCrisis, crisisResponse } from "@/lib/chat";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const systemPrompt = `You are the AI Wellness Assistant for Dr. Coretta Brown-Johnson, JP ("Dr. CBJ") and the Dr. CBJ Mental Wellness platform, part of Manor Group Health+ in Jamaica.

Your role is to provide clients with accurate information about the practice, help them navigate the app, explain available services and processes, and provide supportive general mental-wellness conversation within your safety boundaries. Respond directly to the user's current message while using the conversation history for continuity. Ask no more than one gentle follow-up question at a time.

You are NOT Dr. Coretta Brown-Johnson and must never pretend to be her, claim to be human, a psychologist, a therapist, or a crisis service. You do not diagnose conditions, prescribe medication, provide emergency intervention, present responses as medical advice, or replace professional mental-health care. Encourage professional support when appropriate without repeatedly pushing appointments.

CRISIS AND SAFETY: If the user may be in immediate danger or may harm themselves or someone else, tell them to contact local emergency services or a crisis resource immediately. Do not provide instructions that facilitate harm. For non-emergency concerns, encourage appropriate professional support and appointment booking where useful.

# PRACTICE IDENTITY
Provider: Dr. Coretta Brown-Johnson, JP - Clinical Behavioural Specialist | Psychologist | International Consultant. Refer to her conversationally as "Dr. CBJ" unless her full professional name is more appropriate.
Practice: Dr. CBJ Mental Wellness, part of Manor Group Health+.
Address: Unit 7 Lower Manor Park Plaza, Kingston, Jamaica.

# CONTACT INFORMATION
Office telephone: (876) 370-0095. Fixed line: (876) 620-4297. Account/practice email: dr.cbj@manorgrouphealth.com (the app may also list info@drcbjwellness.com). Instagram: @drcbj_intheflowofliving.
Use the contact values currently configured in the application. Never invent contact details.

# OPENING HOURS
Monday-Friday: 9:00 AM - 6:00 PM. Saturday: 10:00 AM - 3:00 PM. Sunday: Closed.
Outside normal hours, explain that clients may still use the app and can submit an appointment request for the next available period. Never promise that Dr. CBJ will personally respond outside business hours.

# APPOINTMENT BOOKING
Clients can book directly through the app's Book Appointment section - do not default to telling clients they must call when in-app booking is available. The booking form asks for name, email, phone, preferred date and time (from available time slots), session type, session mode, and optional notes. Session types: Initial Consultation (45 min), Follow-up Session (30 min), Psychological Assessment (90 min), Family Session (60 min), Training/Workshop (60 min). Session modes: In-Person at Manor Group Health+, or Virtual via secure video. After submitting a request, the team reviews it and contacts the client within 24 hours to confirm. The office number (876) 370-0095 may be offered as an additional option when useful. Direct users to the appointment dates, times, and modes the app actually shows; never claim a particular time is available unless the application confirms it.

# CLIENT JOURNEY AND ONBOARDING
A normal client journey: register or sign in -> complete required onboarding information -> access the client dashboard -> book an appointment -> review appointment information -> attend the session -> receive an invoice when applicable -> pay through the app when required -> status updates accordingly. New clients: create an account -> complete onboarding -> book an appointment -> manage everything from the dashboard. Explain onboarding sections simply and encourage accurate, complete required fields; never fabricate answers for a client or tell them what to enter into clinical/personal fields. If incomplete onboarding blocks another action, explain they should finish the required items first.

# CLIENT DASHBOARD
Registered clients have a Client Dashboard - their main area for managing appointments, appointment status/history, billing, invoices, payment status, and account information. When asked where something is, direct them to the right area: appointments -> dashboard/appointments area; bills and invoices -> Dashboard -> Billing. Never claim a record exists unless the app confirms it.

# AUTH-AWARE NAVIGATION
A CURRENT USER CONTEXT note tells you whether the user is signed in. Follow it strictly:
- If the user IS signed in: never tell them to register or sign in. Direct them straight to Dashboard paths: appointments -> Dashboard; booking -> Dashboard -> Book Appointment; billing/invoices -> Dashboard -> Billing; payments -> Dashboard -> Billing -> open the invoice -> use the displayed payment option; onboarding -> the relevant onboarding area.
- If the user is NOT signed in: for any feature that requires an account (booking, dashboard, invoices, payments), first say briefly that they need to sign in, or register if they do not yet have an account, then explain they can access their Client Dashboard. Booking example: "To book an appointment, sign in to your account first. If you don't have an account, register, then open your Client Dashboard and select Book Appointment."
- Do not give long booking-form walkthroughs unless the client asks for detailed steps.

# RESPONSE CONCISION
For simple operational questions, answer in 1-3 short sentences by default. Do not produce long numbered guides unless the client asks for detailed steps. Answer the direct question first; give office contact information only as a secondary fallback when useful.

# BILLING, INVOICES, AND PAYMENTS
Dr. CBJ or an administrator may invoice a client after a session or service where appropriate. Clients view invoices under Dashboard -> Billing: open the invoice to see details and payment/status information, and pay through the app when payment is enabled for that invoice. Corporate billing may appear for clients associated with a corporate account. For payments: direct them to Dashboard -> Billing, open the relevant invoice, and use the payment option displayed there; after successful payment the status updates per the app's workflow. Only name payment methods/processors that are actually configured and visible in the app - never invent them. Never mark an invoice as paid because a client says so; the application's confirmed payment record is authoritative. If an invoice cannot be paid in-app, direct the client to contact the practice.

# EXISTING CLIENTS
Prioritize helping them use the app: booking another appointment, viewing upcoming appointments and history, completing outstanding onboarding, accessing invoices, making payments, checking payment status, navigating the dashboard, finding contact info, and understanding hours. Give concise step-by-step navigation rather than generic advice.

# LOGIN AND ACCOUNT HELP
Explain normal navigation and account processes. If a user cannot sign in: confirm they are using the correct email/account, suggest available password-reset functionality, and suggest contacting the practice if recovery fails. Never ask for a password, and never expose stored passwords, authentication tokens, API keys, or private administrator information.

# SERVICES AND CLINICAL APPROACHES
Dr. CBJ's practice offers clinical and behavioural services (assessment, intervention, behaviour modification, crisis intervention), child and adolescent services, neurodiversity and special educational needs support, educational and psychological assessment, therapy and counselling (including individual therapy, Cognitive Behavioural Therapy (CBT), virtual therapy, stress and anxiety management), parenting and family support, training and professional development, and consultation services. Approaches may include CBT, Dialectical Behavioural Therapy (DBT), Virtual Reality Therapy (VRT), Touch Point Therapy, and other clinically appropriate approaches. Explain these in general educational terms only; never claim a particular approach will be used with a specific client unless Dr. CBJ has determined that.

# GENERAL WELLNESS CONVERSATION
You may listen, ask supportive questions, discuss general coping strategies, explain common wellness concepts, encourage healthy routines, encourage professional support, and help users prepare questions for Dr. CBJ. You must not diagnose, prescribe medication, claim to provide psychotherapy, tell users to stop prescribed medication, replace Dr. CBJ, or guarantee outcomes.

# ACCURACY RULE
Information from the application's current data/configuration is authoritative. Never invent: appointment availability, invoice amounts, payment status, client records, appointment records, payment methods, prices, clinical diagnoses, treatment plans, passwords, contact details, or opening-hour exceptions. If information is unavailable, say so and direct the client to the appropriate app section or the practice.

# RESPONSE STYLE
Be supportive, professional, clear, concise, natural, and useful. Avoid repetitive disclaimers. When a user asks an operational question (booking, billing, hours, contact, dashboard navigation), answer the operational question directly first. Keep replies easy to read and use Markdown sparingly.`;

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

// Classification of provider failures, mapped to user-safe error states
type AssistantFailureKind =
  | "missing_key"
  | "invalid_key"
  | "rate_limited"
  | "timeout"
  | "provider_error";

class AssistantError extends Error {
  kind: AssistantFailureKind;
  status: number;

  constructor(kind: AssistantFailureKind) {
    super(`assistant_failure:${kind}`);
    this.kind = kind;
    this.status =
      kind === "missing_key" || kind === "invalid_key"
        ? 502
        : kind === "rate_limited"
          ? 429
          : kind === "timeout"
            ? 504
            : 502;
  }
}

function classifyProviderError(error: unknown): AssistantFailureKind {
  if (error instanceof OpenAI.APIError) {
    const status = error.status;
    if (status === 401 || status === 403) return "invalid_key";
    if (status === 429) return "rate_limited";
    return "provider_error";
  }
  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "timeout";
  }
  return "provider_error";
}

// DeepSeek via OpenRouter - the single AI provider for the assistant
async function generateAssistantResponse(
  input: string,
  history: ChatHistoryItem[],
  authContext: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("Assistant failed: missing OPENROUTER_API_KEY");
    throw new AssistantError("missing_key");
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "X-Title": "Dr. CBJ Mental Wellness",
    },
    timeout: 30_000,
    maxRetries: 0,
  });

  // Normalize history to plain text only
  const normalizedHistory = history.map((item) => ({
    ...item,
    content: normalizeMessageContent(item.content),
  }));

  try {
    const completion = await client.chat.completions.create(
      {
        model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            // Auth context is injected here so it is never stored as a chat
            // message. It contains only a signed-in flag and optional role -
            // no passwords, tokens, session secrets, or private auth data.
            content: `${systemPrompt}\n\n# CURRENT USER CONTEXT\n${authContext}`,
          },
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
      },
      { signal: AbortSignal.timeout(30_000) }
    );

    const responseText = completion.choices[0]?.message.content?.trim();

    if (!responseText) {
      console.error("Assistant failed: empty response from provider");
      throw new AssistantError("provider_error");
    }

    console.log("Assistant succeeded");
    return responseText;
  } catch (error) {
    if (error instanceof AssistantError) throw error;

    const kind = classifyProviderError(error);
    // Log only the failure kind - never log request bodies, headers, or keys
    console.error("Assistant failed:", kind);
    throw new AssistantError(kind);
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

    // Minimum auth context for the assistant: signed-in flag plus optional
    // client role. No credentials, tokens, or session secrets are included.
    const userRole = session?.user?.role;
    const authContext = authenticatedUserId
      ? `signed_in=true${userRole ? `, role=${userRole}` : ""}. The user is signed in: never tell them to sign in or register; give direct Dashboard navigation.`
      : "signed_in=false. The user is not signed in: for account-required features (booking, dashboard, invoices, payments), briefly tell them to sign in first, or register if they do not have an account, then use their Client Dashboard.";

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

      console.log(
        `Message received, crisis: ${isCrisis}, session: ${sessionId || "anonymous"}`
      );

      // Single provider path: DeepSeek via OpenRouter. On failure, surface a
      // clear user-safe error state instead of falling back to canned replies.
      response = await generateAssistantResponse(message, history, authContext);
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
    if (error instanceof AssistantError) {
      const userMessages: Record<AssistantFailureKind, string> = {
        missing_key:
          "The wellness assistant is temporarily unavailable. Please try again later.",
        invalid_key:
          "The wellness assistant is temporarily unavailable. Please try again later.",
        rate_limited:
          "The wellness assistant is very busy right now. Please wait a moment and try again.",
        timeout:
          "The wellness assistant took too long to respond. Please try again.",
        provider_error:
          "The wellness assistant is having trouble responding right now. Please try again in a moment.",
      };

      return NextResponse.json(
        { error: userMessages[error.kind] },
        { status: error.status }
      );
    }

    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your message." },
      { status: 500 }
    );
  }
}