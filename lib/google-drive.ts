import { google } from "googleapis";

export type GoogleDriveImageFile = {
  id: string;
  name: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
};

function getDriveAuth() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GOOGLE_DRIVE_CLIENT_EMAIL or GOOGLE_DRIVE_PRIVATE_KEY.",
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

function getDriveClient() {
  return google.drive({
    version: "v3",
    auth: getDriveAuth(),
  });
}

export function extractGoogleDriveFolderId(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const folderUrlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);

  if (folderUrlMatch) {
    return folderUrlMatch[1];
  }

  return trimmed;
}

export async function listGoogleDriveImages(folderId: string) {
  const drive = getDriveClient();
  const files: GoogleDriveImageFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, imageMediaMetadata(width, height))",
      orderBy: "name_natural",
      pageSize: 1000,
      pageToken,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    for (const file of response.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType) {
        continue;
      }

      files.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        width: file.imageMediaMetadata?.width ?? null,
        height: file.imageMediaMetadata?.height ?? null,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

export async function downloadGoogleDriveFile(fileId: string) {
  const drive = getDriveClient();
  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "arraybuffer",
    },
  );

  return Buffer.from(response.data as ArrayBuffer);
}
