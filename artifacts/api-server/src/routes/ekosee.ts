import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

export const ekoseeRouter = Router();

const BATCH_SIZE = 40;

// Allow Chrome/Safari extension origins
function corsHeaders(res: import("express").Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

ekoseeRouter.options("/ekosee/translate", (_req, res) => {
  corsHeaders(res);
  res.sendStatus(204);
});
ekoseeRouter.options("/ekosee/detect", (_req, res) => {
  corsHeaders(res);
  res.sendStatus(204);
});

// POST /api/ekosee/translate
ekoseeRouter.post("/ekosee/translate", async (req, res) => {
  const { texts, targetLanguage } = req.body as {
    texts?: string[];
    targetLanguage?: string;
  };

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "texts must be a non-empty array" });
  }
  if (!targetLanguage || typeof targetLanguage !== "string") {
    return res.status(400).json({ error: "targetLanguage is required" });
  }

  corsHeaders(res);

  try {
    const all: string[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const prompt = `You are a translation engine. Translate each string in the JSON array below into ${targetLanguage}. Return ONLY a valid JSON array of translated strings in the same order. Preserve whitespace, punctuation, and any HTML entities exactly. Do not explain or add any text outside the JSON array.\n\nInput: ${JSON.stringify(chunk)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Unexpected translation response format.");

      const parsed: unknown = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) throw new Error("Translation response is not an array.");
      if (parsed.length !== chunk.length) throw new Error("Translation count mismatch.");

      all.push(...parsed.map((t) => (typeof t === "string" ? t : String(t))));
    }

    res.json({ translations: all });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation failed";
    res.status(500).json({ error: message });
  }
});

// POST /api/ekosee/detect
ekoseeRouter.post("/ekosee/detect", async (req, res) => {
  const { sample } = req.body as { sample?: string };
  if (!sample || typeof sample !== "string") {
    return res.status(400).json({ error: "sample is required" });
  }

  corsHeaders(res);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `What language is this text written in? Reply with only the language name in English, nothing else.\n\n"${sample.slice(0, 300)}"`,
        },
      ],
      temperature: 0,
      max_tokens: 20,
    });

    const language = response.choices[0]?.message?.content?.trim() ?? "Unknown";
    res.json({ language });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Detection failed";
    res.status(500).json({ error: message });
  }
});
