import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchDiseases } from "@/lib/diseases";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Find or create session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    }
    if (!session) {
      const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
      session = await prisma.chatSession.create({ data: { title } });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    // Run local symptom matching
    const rawSymptoms = message
      .toLowerCase()
      .split(/[,;.\n]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const localMatches = matchDiseases(rawSymptoms);

    // Get full conversation history for context
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    // Build local match context for GPT
    let localContext = "";
    if (localMatches.length > 0) {
      localContext = `\n\nLocal database preliminary matches:\n` +
        localMatches.map(({ disease, matchScore }) =>
          `- ${disease.name} (${Math.round(matchScore * 100)}% symptom overlap): ${disease.description} [Severity: ${disease.severity}]`
        ).join("\n");
    }

    const systemInstruction = `You are a senior clinical diagnostic AI. You produce precise, evidence-based, structured medical analysis — not generic advice.

━━━ RESPONSE FORMAT (follow exactly) ━━━

## Clinical Assessment
2–3 sentences summarising the overall symptom picture and most likely aetiology.

## Differential Diagnosis
List 3–5 conditions ranked by likelihood. For EACH use exactly this template:

### [N]. [Condition Name] — [XX]% likelihood
**Why it fits:** [which specific symptoms match and the physiological mechanism]
**Severity:** mild / moderate / severe
**Urgency:** [brief urgency statement]
**Next step:** [single most important action]

## ⚠️ Red Flags
Bullet the symptoms present that could indicate a medical emergency. If none, write "None identified."

## Urgency Level
**[1–5]** — where 1 = self-care at home, 2 = see GP this week, 3 = see doctor within 24 h, 4 = urgent care today, 5 = call emergency services now.
One sentence explaining the rating.

## Action Plan
Numbered step-by-step recommendations the patient should follow right now.

## Disclaimer
> Always consult a licensed healthcare professional for diagnosis and treatment. This AI analysis is informational only.

━━━ MACHINE DATA BLOCK (append verbatim at end) ━━━
---ANALYSIS_DATA---
{"urgency":<1-5>,"summary":"<3-5 word clinical summary>","seekCare":<true|false>,"redFlags":[<list of red-flag symptom strings, or empty>],"conditions":[{"name":"<condition name>","score":<0.05–0.95>,"severity":"<mild|moderate|severe>","reason":"<≤12 words why>"}]}
---END_DATA---

━━━ RULES ━━━
• Only reference symptoms the user actually mentioned — never fabricate.
• If urgency ≥ 4, lead the entire response with a bold emergency warning.
• The conditions array must have 3–5 entries with realistic, differentiated scores.
• Do NOT add any text after ---END_DATA---.
${localContext}`;

    // Build Gemini chat history (all messages except the last user message)
    const geminiHistory = history.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use a more advanced model for better responses
      systemInstruction,
    });

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text() ?? "I couldn't generate a response. Please try again.";

    // Save assistant message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "assistant", content: aiResponse },
    });

    // Generate a coherent title from the first user message
    const msgCount = await prisma.chatMessage.count({ where: { sessionId: session.id } });
    if (msgCount <= 2) {
      // Extract symptom keywords if message follows "symptoms: x, y, z" pattern
      const symptomsMatch = message.match(/symptoms?[:\s]+(.+)/i);
      let title: string;
      if (symptomsMatch) {
        const parts = symptomsMatch[1]
          .split(/[,;]+/)
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 4);
        title = parts.length > 0
          ? parts.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")
          : message.slice(0, 50);
      } else {
        title = message.slice(0, 60);
      }
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { title },
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      localMatches: localMatches.map(({ disease, matchScore }) => ({
        name: disease.name,
        score: matchScore,
        severity: disease.severity,
      })),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
