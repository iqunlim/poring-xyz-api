import { BucketError } from "@/app/errors";

export function checkTypeIsMultipart(fileType: string) {
  return ["multipart/form-data", "application/x-www-form-urlencoded"].includes(
    fileType
  );
}

export function checkSearchParams(searchParams: URLSearchParams) {
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  // Require all params
  if (!fileName || !fileType) {
    throw new BucketError(
      400,
      "Missing required parameters: fileName, fileType are required"
    );
  }
}
