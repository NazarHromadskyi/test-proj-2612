import { Client } from "@upstash/qstash";
import { logger } from "../lib/logger";

const getClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error("QSTASH_TOKEN is required");
  }
  return new Client({ token });
};

const getWebhookUrl = () => {
  const url = process.env.QSTASH_WEBHOOK_URL;
  if (!url) {
    throw new Error("QSTASH_WEBHOOK_URL is required");
  }
  return url;
};

const getDelay = ():
  | number
  | `${bigint}s`
  | `${bigint}m`
  | `${bigint}h`
  | `${bigint}d` => {
  const delay = process.env.QSTASH_DELAY ?? "60s";
  return delay as `${bigint}s` | `${bigint}m` | `${bigint}h` | `${bigint}d`;
};

export const enqueueAnalysis = async (requestId: string) => {
  const client = getClient();
  const url = getWebhookUrl();
  const delay = getDelay();

  logger.debug("Enqueuing analysis to QStash", {
    requestId,
    url,
    delay,
  });

  try {
    const result = await client.publishJSON({
      url,
      body: { requestId },
      delay,
    });

    logger.debug("Analysis enqueued to QStash successfully", {
      requestId,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error("Failed to enqueue analysis to QStash", error, {
      requestId,
      url,
    });
    throw error;
  }
};
