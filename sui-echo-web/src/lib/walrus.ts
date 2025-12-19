/**
 * Walrus Storage Utilities
 * For uploading and retrieving content from Walrus
 */

import { WALRUS_AGGREGATOR, WALRUS_PUBLISHER } from "@/config";

export type WalrusUploadResponse = {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      storedEpoch: number;
      endEpoch: number;
    };
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch: number;
  };
};

/**
 * Uploads a file (Blob/Buffer) to Walrus
 * @param file - The file or blob to upload
 * @returns The blob ID for retrieval
 */
export async function uploadToWalrus(file: Blob | File): Promise<string> {
  const response = await fetch(`${WALRUS_PUBLISHER}/v1/store`, {
    method: "PUT",
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload to Walrus: ${response.status} - ${errorText}`);
  }

  const data: WalrusUploadResponse = await response.json();

  // Handle different response formats
  if (data.newlyCreated?.blobObject?.blobId) {
    return data.newlyCreated.blobObject.blobId;
  }
  if (data.alreadyCertified?.blobId) {
    return data.alreadyCertified.blobId;
  }

  console.error("[Walrus] Unexpected response:", data);
  throw new Error("Invalid response from Walrus Publisher");
}

/**
 * Constructs the URL to read a blob from Walrus
 * @param blobId - The blob ID to retrieve
 * @returns The full URL to fetch the blob
 */
export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/${blobId}`;
}

/**
 * Fetches content from Walrus
 * @param blobId - The blob ID to fetch
 * @returns The blob content as text
 */
export async function fetchFromWalrus(blobId: string): Promise<string> {
  const url = getWalrusUrl(blobId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from Walrus: ${response.status}`);
  }

  return await response.text();
}

// Re-export config for convenience
export { WALRUS_AGGREGATOR, WALRUS_PUBLISHER };
