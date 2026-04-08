import { google } from "googleapis";

export type GoogleDriveImageFile = {
  id: string;
  name: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
};

export type GoogleDriveFolder = {
  id: string;
  name: string;
};

export type GoogleDriveChildItem = {
  id: string;
  name: string;
  mimeType: string;
  targetId?: string | null;
  targetMimeType?: string | null;
};

export type GoogleDriveFolderSummary = {
  inputId: string;
  resolvedId: string;
  folderName: string;
  childCount: number;
  folderCount: number;
  imageCount: number;
  sampleItems: Array<{
    name: string;
    mimeType: string;
  }>;
};

function getDriveClientEmail() {
  return normalizeEnvString(process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
}

function isGoogleFileNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    code?: number;
    status?: number;
    message?: string;
  };

  return (
    maybeError.code === 404 ||
    maybeError.status === 404 ||
    maybeError.message?.includes("File not found") === true
  );
}

function getDriveAuth() {
  const clientEmail = normalizeEnvString(process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.GOOGLE_DRIVE_PRIVATE_KEY);

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

function stripTrailingDelimiters(value: string) {
  return value.replace(/[,\s;]+$/g, "");
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeEnvString(value?: string) {
  if (!value) {
    return undefined;
  }

  let normalized = value.trim();

  normalized = stripTrailingDelimiters(normalized);
  normalized = stripWrappingQuotes(normalized);
  normalized = stripTrailingDelimiters(normalized);

  return normalized;
}

function normalizePrivateKey(value?: string) {
  const normalizedValue = normalizeEnvString(value);

  if (!normalizedValue) {
    return undefined;
  }

  let normalized = normalizedValue;

  normalized = normalized.replace(/\r\n/g, "\n");
  normalized = normalized.replace(/\\n/g, "\n");

  if (!normalized.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_DRIVE_PRIVATE_KEY is not formatted like a service-account private key.",
    );
  }

  return normalized;
}

function getDriveClient() {
  return google.drive({
    version: "v3",
    auth: getDriveAuth(),
  });
}

async function getGoogleDriveItem(fileId: string) {
  const drive = getDriveClient();
  const response = await drive.files.get({
    fileId,
    fields:
      "id, name, mimeType, shortcutDetails(targetId, targetMimeType), parents",
    supportsAllDrives: true,
  });

  return response.data;
}

async function resolveDriveFolderReference(folderId: string) {
  let item;

  try {
    item = await getGoogleDriveItem(folderId);
  } catch (error) {
    if (isGoogleFileNotFoundError(error)) {
      const clientEmail = getDriveClientEmail();

      throw new Error(
        clientEmail
          ? `Google Drive could not open that folder. If this is a copied parent folder, share the copied folder again with ${clientEmail}. Google Drive copies do not keep the old service-account access automatically.`
          : "Google Drive could not open that folder. If this is a copied parent folder, share the copied folder again with your service account email. Google Drive copies do not keep the old service-account access automatically.",
      );
    }

    throw error;
  }

  if (!item.id || !item.name || !item.mimeType) {
    throw new Error("Google Drive could not read that folder reference.");
  }

  if (item.mimeType === "application/vnd.google-apps.folder") {
    return {
      id: item.id,
      name: item.name,
      inputId: folderId,
      wasShortcut: false,
    };
  }

  if (
    item.mimeType === "application/vnd.google-apps.shortcut" &&
    item.shortcutDetails?.targetMimeType === "application/vnd.google-apps.folder" &&
    item.shortcutDetails.targetId
  ) {
    const targetItem = await getGoogleDriveItem(item.shortcutDetails.targetId);

    if (
      !targetItem.id ||
      !targetItem.name ||
      targetItem.mimeType !== "application/vnd.google-apps.folder"
    ) {
      throw new Error(
        `Google Drive shortcut "${item.name}" does not point to a readable folder.`,
      );
    }

    return {
      id: targetItem.id,
      name: targetItem.name,
      inputId: folderId,
      wasShortcut: true,
    };
  }

  throw new Error(
    `"${item.name}" is not a Google Drive folder. Paste a folder URL or folder ID instead.`,
  );
}

async function listGoogleDriveChildren(folderId: string) {
  const drive = getDriveClient();
  const resolvedFolder = await resolveDriveFolderReference(folderId);
  const items: GoogleDriveChildItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${resolvedFolder.id}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, shortcutDetails(targetId, targetMimeType))",
      orderBy: "name_natural",
      pageSize: 1000,
      pageToken,
      corpora: "allDrives",
      spaces: "drive",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    for (const file of response.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType) {
        continue;
      }

      items.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        targetId: file.shortcutDetails?.targetId ?? null,
        targetMimeType: file.shortcutDetails?.targetMimeType ?? null,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return {
    resolvedFolder,
    items,
  };
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
  const { items } = await listGoogleDriveChildren(folderId);
  const files: GoogleDriveImageFile[] = [];

  const imageItems = items.filter((item) => {
    if (item.mimeType.startsWith("image/")) {
      return true;
    }

    return (
      item.mimeType === "application/vnd.google-apps.shortcut" &&
      item.targetMimeType?.startsWith("image/") &&
      item.targetId
    );
  });

  for (const item of imageItems) {
    const fileId =
      item.mimeType === "application/vnd.google-apps.shortcut"
        ? item.targetId
        : item.id;

    if (!fileId) {
      continue;
    }

    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, imageMediaMetadata(width, height)",
      supportsAllDrives: true,
    });

    const file = response.data;

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

  return files;
}

export async function listGoogleDriveFolders(folderId: string) {
  const { items } = await listGoogleDriveChildren(folderId);

  return items
    .filter((item) => {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        return true;
      }

      return (
        item.mimeType === "application/vnd.google-apps.shortcut" &&
        item.targetMimeType === "application/vnd.google-apps.folder" &&
        item.targetId
      );
    })
    .map((item) => ({
      id:
        item.mimeType === "application/vnd.google-apps.shortcut"
          ? (item.targetId ?? "")
          : item.id,
      name: item.name,
    }));
}

export async function inspectGoogleDriveFolder(folderId: string) {
  const { resolvedFolder, items } = await listGoogleDriveChildren(folderId);

  const folderCount = items.filter((item) => {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      return true;
    }

    return (
      item.mimeType === "application/vnd.google-apps.shortcut" &&
      item.targetMimeType === "application/vnd.google-apps.folder"
    );
  }).length;

  const imageCount = items.filter((item) => {
    if (item.mimeType.startsWith("image/")) {
      return true;
    }

    return (
      item.mimeType === "application/vnd.google-apps.shortcut" &&
      item.targetMimeType?.startsWith("image/")
    );
  }).length;

  return {
    inputId: resolvedFolder.inputId,
    resolvedId: resolvedFolder.id,
    folderName: resolvedFolder.name,
    childCount: items.length,
    folderCount,
    imageCount,
    sampleItems: items.slice(0, 8).map((item) => ({
      name: item.name,
      mimeType:
        item.mimeType === "application/vnd.google-apps.shortcut" &&
        item.targetMimeType
          ? `shortcut -> ${item.targetMimeType}`
          : item.mimeType,
    })),
  } satisfies GoogleDriveFolderSummary;
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
