export const runtime = "edge";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest } from "next/server";
import mime from "mime";
import { checkExcludedTypes, checkFileExtension } from "./validators";

type ApiResponse = {
  fileUrl?: string;
  error?: string;
};

class BucketError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const CorsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Respond with the CORS headers for the options query
export async function OPTIONS() {
  return new Response(null, {
    headers: CorsHeaders,
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
      { status: status, headers: CorsHeaders }
    );
  }
}

async function ProcessRequest(request: NextRequest) {
  const bucket = getRequestContext().env.IMAGES;
  const R2_DOMAIN = getRequestContext().env.R2_DOMAIN;

  // Bucket must exist
  if (!bucket || !R2_DOMAIN) {
    throw new BucketError(
      500,
      "Missing required environment varibles, please set in wrangler.json or on your dashboard"
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const fileName = decodeURIComponent(searchParams.get("fileName") || "");
  const fileType = decodeURIComponent(searchParams.get("fileType") || "");

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

  // Verify MIME type is not excluded
  if (!checkExcludedTypes(fileType)) {
    throw new BucketError(400, `This file format is disallowed, ${fileType}`);
  }

  // Verify file name is safe and has a valid extension
  // And that its extension matches the MIME type (is this necessary...)
  // This was causing errors with a HUGE variety of MIME types due to changes to the library
  // REmoving this vadidator for now
  // const fileExt = fileName.split(".").pop();
  // const fileBlobExt = mime.getExtension(file.type);
  if (!checkFileExtension(fileName)) {
    throw new BucketError(
      400,
      `File name must have a valid extension: ${fileName}, FileType Sent: ${fileName.substring(
        fileName.indexOf(".") + 1
      )}`
    );
  }

  // Verify file extension matches sent file type in header
  // const mimeType = mime.getType(fileExt);
  // if (mimeType !== fileType) {
  //   throw new BucketError(
  //     400,
  //     "File type does not match file extension sent in header"
  //   );
  // }

  // Verify file size is less than MAX_FILE_SIZE
  // Note: The service itself we are running this on will handle this by throwing a 413 for too big of a file
  // const contentLength = request.headers.get("content-length");
  // if (!contentLength || Number(contentLength) > 100 * 1024 * 1024) {
  //   throw new BucketError(400, `File size must be less than 100MB`);
  // }

  // Generate file key
  const uploadKey = `${crypto.randomUUID().slice(0, 8)}/${fileName}`;
  const resp: ApiResponse = {
    fileUrl: `https://${R2_DOMAIN}/${uploadKey}`,
    error: "",
  };

  // Finally, put the validated file
  await bucket.put(uploadKey, file);

  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: CorsHeaders,
  });
}
