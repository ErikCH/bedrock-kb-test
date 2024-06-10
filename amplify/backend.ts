import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { bedrock } from "@cdklabs/generative-ai-cdk-constructs";
import { pinecone } from "@cdklabs/generative-ai-cdk-constructs";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib/core";
import * as s3 from "aws-cdk-lib/aws-s3";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});

const knowledgeBaseStack = backend.createStack("knowledge-base");
// const existingStack = Stack.of(backend.storage.resources.bucket);

const docsBucket = new s3.Bucket(knowledgeBaseStack, "docsbucket-", {
  lifecycleRules: [
    {
      expiration: Duration.days(10),
    },
  ],
  blockPublicAccess: {
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const kb = new bedrock.KnowledgeBase(knowledgeBaseStack, "KB", {
  embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
  instruction:
    "Use this knowledge base to answer questions about books. " +
    "It contains the full text of novels. Please quote the books to explain your answers.",
});

const docsDataSource = new bedrock.S3DataSource(
  knowledgeBaseStack,
  "knowledgesource",
  {
    knowledgeBase: kb,
    bucket: docsBucket,
    dataSourceName: "docs",
    chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
    maxTokens: 500,
    overlapPercentage: 20,
  }
);
