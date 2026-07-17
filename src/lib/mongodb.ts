import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Copy .env.example to .env.local and set your Atlas connection string."
    );
  }
  return uri;
}

function createClientPromise(): Promise<MongoClient> {
  return new MongoClient(getUri()).connect();
}

function clientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    return (global._mongoClientPromise ??= createClientPromise());
  }
  return createClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB || "sportiq");
}

export async function isMongoConfigured(): Promise<boolean> {
  return Boolean(process.env.MONGODB_URI);
}
