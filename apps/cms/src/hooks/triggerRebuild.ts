import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

type RebuildLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
};

type DispatchBody = {
  event_type: string;
  client_payload: {
    collection: string;
    id?: string | number;
    filename?: string;
    slug?: string;
    status?: string;
  };
};

async function dispatchRebuild(body: DispatchBody, logger: RebuildLogger = console) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const eventType = process.env.GITHUB_EVENT_TYPE || body.event_type;

  if (!token || !owner || !repo || !eventType) {
    logger.warn(
      `[rebuild] skipped repository_dispatch: missing env ${[
        !token && "GITHUB_TOKEN",
        !owner && "GITHUB_OWNER",
        !repo && "GITHUB_REPO",
        !eventType && "GITHUB_EVENT_TYPE",
      ]
        .filter(Boolean)
        .join(", ")}`,
    );
    return;
  }

  body.event_type = eventType;
  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  logger.info(
    `[rebuild] sending repository_dispatch event="${eventType}" repo="${owner}/${repo}" collection="${body.client_payload.collection}"`,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      logger.warn(`GitHub repository_dispatch failed: ${response.status} ${response.statusText} ${responseBody}`);
      return;
    }

    logger.info(`[rebuild] repository_dispatch accepted: ${response.status}`);
  } catch (error) {
    logger.warn(
      `[rebuild] repository_dispatch error: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const triggerRebuild: CollectionAfterChangeHook = async ({ doc, collection, operation, req }) => {
  const logger = req.payload.logger;
  const status = typeof doc.status === "string" ? doc.status : "n/a";

  logger.info(
    `[rebuild] afterChange operation="${operation}" collection="${collection.slug}" id="${doc.id}" status="${status}"`,
  );

  if (collection.slug === "posts" && doc.status !== "published") {
    logger.info(`[rebuild] skipped draft post id="${doc.id}" status="${status}"`);
    return doc;
  }

  await dispatchRebuild(
    {
      event_type: process.env.GITHUB_EVENT_TYPE || "payload_publish",
      client_payload: {
        collection: collection.slug,
        id: typeof doc.id === "string" || typeof doc.id === "number" ? doc.id : undefined,
        filename: typeof doc.filename === "string" ? doc.filename : undefined,
        slug: typeof doc.slug === "string" ? doc.slug : undefined,
        status: typeof doc.status === "string" ? doc.status : undefined,
      },
    },
    logger,
  );

  logger.info(
    `[rebuild] successfully modified collection="${collection.slug}" id="${doc.id}" operation="${operation}"`,
  );

  return doc;
};

export const triggerRebuildAfterDelete: CollectionAfterDeleteHook = async ({ doc, collection, req }) => {
  const logger = req.payload.logger;

  logger.info(`[rebuild] afterDelete collection="${collection.slug}" id="${doc.id}"`);

  await dispatchRebuild(
    {
      event_type: process.env.GITHUB_EVENT_TYPE || "payload_publish",
      client_payload: {
        collection: collection.slug,
        id: typeof doc.id === "string" || typeof doc.id === "number" ? doc.id : undefined,
        filename: typeof doc.filename === "string" ? doc.filename : undefined,
        slug: typeof doc.slug === "string" ? doc.slug : undefined,
        status: typeof doc.status === "string" ? doc.status : undefined,
      },
    },
    logger,
  );

  return doc;
};
