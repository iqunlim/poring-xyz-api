export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest } from "next/server";

type ApiResponse = {
  url?: string;
  imageUrl?: string;
  error?: string;
};

const checkDefined = (...vars: string[]) => vars.every((v) => v !== undefined);

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  try {
    const {
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      R2_ACCOUNT_ID,
      R2_DOMAIN,
    } = getRequestContext().env;

    // All of these are required
    if (
      !checkDefined(
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        R2_ACCOUNT_ID,
        R2_DOMAIN
      )
    ) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType");
    const t = searchParams.get("t");

    if (!fileName || !fileType || !t) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required parameters: fileName, fileType, and t are required",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const SignedUrl = await getSignedUrl(
      S3,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        ContentType: fileType,
        ContentLength: Number(t),
      }),
      { expiresIn: 3600 }
    );

    const resp: ApiResponse = {
      url: SignedUrl,
      imageUrl: `https://${R2_DOMAIN}/${fileName}`,
      error: "",
    };

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.name, error.message);
    }
    return new Response("Error setting up S3 client", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  // Specifies the maximum allowed duration for this function to execute (in seconds)
  maxDuration: 10,
};
