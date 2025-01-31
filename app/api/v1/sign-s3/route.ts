import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const bucket = getRequestContext().env.R2_BUCKET_NAME;
  return new Response(bucket);
}

export async function POST(request: NextRequest) {
  try {
    const {
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      R2_ACCOUNT_ID,
      R2_DOMAIN,
    } = getRequestContext().env;

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    if (R2_ACCOUNT_ID === undefined) {
      return new Response("R2_ACCOUNT_ID is not defined", { status: 500 });
    }

    if (R2_ACCESS_KEY_ID === undefined) {
      return new Response("R2_ACCESS_KEY_ID is not defined", { status: 500 });
    }

    if (R2_SECRET_ACCESS_KEY === undefined) {
      return new Response("R2_SECRET_ACCESS_KEY is not defined", {
        status: 500,
      });
    }

    if (R2_BUCKET_NAME === undefined) {
      return new Response("R2_BUCKET_NAME is not defined", { status: 500 });
    }

    if (R2_DOMAIN === undefined) {
      return new Response("R2_DOMAIN is not defined", { status: 500 });
    }
    // need key, file type, and size
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
        { status: 400 }
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

    const resp = {
      url: SignedUrl,
      imageUrl: `https://${R2_DOMAIN}/${fileName}`,
      error: "",
    };
    return new Response(JSON.stringify(resp));
  } catch (error) {
    return new Response("Error setting up S3 client", { status: 500 });
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
