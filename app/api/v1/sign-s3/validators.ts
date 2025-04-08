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

const excludedMimeTypes = [
  "application/x-msdownload", // .exe, .dll
  "application/x-sh", // .sh
  "application/x-bat", // .bat
  "application/x-msdos-program", // .com
  "application/x-python", // .py
  "application/x-php", // .php
  "application/x-perl", // .pl
  "application/x-java-archive", // .jar
  "application/x-ms-shortcut", // .lnk
  "application/x-msdos-windows", // .sys
  "application/x-msdos-program", // .drv
  "application/x-msi", // .msi, .msp
  "application/octet-stream", // generic binary files
  "text/x-shellscript", // .sh, .bash
  "application/json", // sometimes restricted due to API security concerns
  "application/x-dosexec", // Windows executable binaries
  "application/x-httpd-php", // .php
  "text/html", // .html, .htm (to prevent phishing attempts)
  "application/javascript", // .js
  "application/x-java", // .class
  "application/iso", // .iso
  "application/x-bittorrent", // .torrent
];

const excludedFileExtensions = [
  "exe",
  "dll",
  "sh",
  "bat",
  "com",
  "py",
  "php",
  "pl",
  "jar",
  "lnk",
  "sys",
  "drv",
  "msi",
  "msp",
  "bin",
  "bash",
  "json",
  "class",
  "html",
  "htm",
  "js",
  "wav",
  "iso",
  "torrent",
];

export function checkExcludedTypes(fileType: string) {
  if (excludedMimeTypes.includes(fileType))
    // throw new BucketError(400, "This file format is disallowed");
    return false;
  return true;
}

export function checkFileExtension(fileName: string) {
  const fileExt = fileName.substring(fileName.indexOf(".") + 1);
  // const fileBlobExt = mime.getExtension(fileType);
  if (
    !fileExt ||
    // !fileBlobExt ||
    // !(fileExt === fileBlobExt) ||
    excludedFileExtensions.includes(fileExt)
  ) {
    // throw new BucketError(
    //   400,
    //   `File name must have a valid extension: ${fileExt}`
    // );
    return false;
  }
  return true;
}
