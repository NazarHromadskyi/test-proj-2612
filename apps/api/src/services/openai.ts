import OpenAI from "openai";
import type { AnalyzeInput } from "@test-task-261225/shared";

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }
  return new OpenAI({ apiKey });
};

const getModel = () => process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const generateAnalysis = async (input: AnalyzeInput) => {
  const client = getClient();
  const model = getModel();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You summarize a brief personality insight based on name, age, and description.", // TODO: change prompt
      },
      {
        role: "user",
        content: `Name: ${input.name}\nAge: ${input.age}\nDescription: ${input.description}`,
      },
    ],
    temperature: 0.7,
  });

  const message = completion.choices[0]?.message?.content?.trim();
  if (!message) {
    throw new Error("Empty response from OpenAI");
  }

  return message;
};
