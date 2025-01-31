export const runtime = "edge";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest } from "next/server";
import mime from "mime";
import { get } from "http";

type ApiResponse = {
  imageUrl?: string;
  error?: string;
};

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

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  const bucket = getRequestContext().env.IMAGES;
  const R2_DOMAIN = getRequestContext().env.R2_DOMAIN || "files2.iqun.xyz";
  // Bucket must exist
  if (!bucket || !R2_DOMAIN) {
    return new Response(
      JSON.stringify({
        error:
          "Missing required environment varibles, please set in wrangler.json or on your dashboard",
      }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  // Require all params
  if (!fileName || !fileType) {
    return new Response(
      JSON.stringify({
        error: "Missing required parameters: fileName, fileType are required",
      }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Verify file name is safe and has a valid extension
  const fileExt = fileName.split(".").pop();
  if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
    return new Response(
      JSON.stringify({
        error:
          "File name must have a valid extension, currently this API only supports images",
      }),
      { status: 400, headers: CORS_HEADERS }
    );
    type ApiResponse = {
      url?: string;
      imageUrl?: string;
      error?: string;
    };
  }

  // Verify file extension matches sent file type in header
  const mimeType = mime.getType(fileExt);
  if (mimeType !== fileType) {
    return new Response(
      JSON.stringify({
        error: "File type does not match file extension sent in header",
      }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Verify file size is less than 20mb
  const contentLength = request.headers.get("content-length");
  const MAX_SIZE = 20 * 1024 * 1024; // TODO: Make this an env variable
  if (!contentLength || Number(contentLength) > MAX_SIZE) {
    return new Response(
      JSON.stringify({
        error: "File size must be less than 20mb",
      }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Upload file
  const resp: ApiResponse = {
    imageUrl: `https://${R2_DOMAIN}/${fileName}`,
    error: "",
  };
  try {
    // If this got used earlier in the code I want it to throw an error
    if (request.bodyUsed) {
      throw new Error("formData already used");
    }

    // This is the best way I found to handle the file op
    // Will break for larger files and require a refactor
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify("Bad Request"), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    await bucket.put(fileName, file);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.name, error.message);
      resp.error = `Bucket Error: ${error.message}`;
    }
  }
  return new Response(JSON.stringify(resp), {
    status: resp.error !== "" ? 200 : 500,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  return new Response("Valid endpoint");
}
