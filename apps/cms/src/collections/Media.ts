import type { CollectionConfig } from "payload";

import { triggerRebuild, triggerRebuildAfterDelete } from "../hooks/triggerRebuild";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "alt",
  },
  hooks: {
    afterChange: [triggerRebuild],
    afterDelete: [triggerRebuildAfterDelete],
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      localized: true,
    },
  ],
};
