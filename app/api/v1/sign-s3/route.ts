export const runtime = "edge";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest } from "next/server";
import mime from "mime";
import { get } from "http";

type ApiResponse = {
  imageUrl?: string;
  error?: string;
};

class BucketError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "bmp",
  "svg",
  "jfif",
  "pjpeg",
  "pjp",
  "gif",
  "webp",
  "avif",
  "ico",
  "apng",
  "heif",
  "heic",
];

// Respond with the CORS headers for the options query
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const res = await ProcessRequest(request);
    return res;
  } catch (error) {
    let status = 500;
    let errorMsg = "Unknown error occured";
    if (error instanceof BucketError) {
      errorMsg = error.message;
      status = error.status;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    return new Response(
      JSON.stringify({
        error: errorMsg,
      }),
      { status: status, headers: CORS_HEADERS }
    );
  }
}

async function ProcessRequest(request: NextRequest) {
  const bucket = getRequestContext().env.IMAGES || "Test";
  const R2_DOMAIN =
    getRequestContext().env.R2_DOMAIN || "https://files2.iqun.xyz/";

  // Bucket must exist
  if (!bucket || !R2_DOMAIN) {
    throw new BucketError(
      500,
      "Missing required environment varibles, please set in wrangler.json or on your dashboard"
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  // Require all params
  if (!fileName || !fileType) {
    throw new BucketError(
      400,
      "Missing required parameters: fileName, fileType are required"
    );
  }

  // Validate that file type in headers is correct
  if (
    ["multipart/form-data", "application/x-www-form-urlencoded"].includes(
      request.headers.get("content-type") || "None"
    )
  ) {
    throw new BucketError(400, "No body data");
  }

  // Get file from form for validation and use
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    throw new BucketError(400, "No Body data or no file");
  }

  // Verify file name is safe and has a valid extension
  const fileExt = fileName.split(".").pop();
  const fileBlobExt = mime.getExtension(file.type);
  if (
    !fileExt ||
    !fileBlobExt ||
    !(fileExt === fileBlobExt) ||
    !ALLOWED_EXTENSIONS.includes(fileBlobExt)
  ) {
    throw new BucketError(
      400,
      "File name must have a valid extension, currently this API only supports images"
    );
  }

  // Verify file extension matches sent file type in header
  const mimeType = mime.getType(fileExt);
  if (mimeType !== fileType) {
    throw new BucketError(
      400,
      "File type does not match file extension sent in header"
    );
  }

  // Verify file size is less than 20mb
  const contentLength = request.headers.get("content-length");
  const MAX_SIZE = 20 * 1024 * 1024; // TODO: Make this an env variable
  if (!contentLength || Number(contentLength) > MAX_SIZE) {
    throw new BucketError(400, "File size must be less than 20mb");
  }

  // Generate file key
  const uploadKey = `${crypto.randomUUID().slice(0, 8)}/${fileName}`;
  const resp: ApiResponse = {
    imageUrl: `https://${R2_DOMAIN}/${uploadKey}`,
    error: "",
  };

  // Finally, put the validated file
  await bucket.put(uploadKey, file);

  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  return new Response("Valid endpoint");
}
