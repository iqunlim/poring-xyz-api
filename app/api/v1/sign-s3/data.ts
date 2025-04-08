const CorsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
