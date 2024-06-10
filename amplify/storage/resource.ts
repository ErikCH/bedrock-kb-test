import { defineStorage, defineFunction } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "myProjectFiles",
  triggers: {
    onUpload: defineFunction({
      entry: "./on-upload-handler.ts",
    }),
  },
});
