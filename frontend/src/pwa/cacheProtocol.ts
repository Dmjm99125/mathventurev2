import type { MediaDownloadStatus } from './mediaCache';

export const MEDIA_MANIFEST_URL = '/free-play-media-manifest.json';
export const MEDIA_METADATA_DB = 'mathventure-offline-media';
export const MEDIA_METADATA_STORE = 'metadata';

export interface GetMediaStatusMessage {
  type: 'GET_MEDIA_STATUS';
  requestId: string;
}

export interface DownloadFreePlayMediaMessage {
  type: 'DOWNLOAD_FREE_PLAY_MEDIA';
  requestId: string;
}

export interface CancelFreePlayMediaMessage {
  type: 'CANCEL_FREE_PLAY_MEDIA';
  requestId: string;
}

export interface CheckMediaUpdateMessage {
  type: 'CHECK_MEDIA_UPDATE';
  requestId: string;
}

export type FreePlayWorkerRequest =
  | GetMediaStatusMessage
  | DownloadFreePlayMediaMessage
  | CancelFreePlayMediaMessage
  | CheckMediaUpdateMessage;

export interface MediaStatusMessage {
  type: 'MEDIA_STATUS';
  requestId: string;
  status: MediaDownloadStatus;
}

export interface MediaProgressMessage {
  type: 'MEDIA_PROGRESS';
  status: MediaDownloadStatus;
}

export interface MediaErrorMessage {
  type: 'MEDIA_ERROR';
  requestId?: string;
  status: MediaDownloadStatus;
}

export type FreePlayWorkerResponse = MediaStatusMessage | MediaProgressMessage | MediaErrorMessage;

export function isFreePlayWorkerRequest(value: unknown): value is FreePlayWorkerRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FreePlayWorkerRequest>;
  return (
    typeof candidate.requestId === 'string' &&
    (candidate.type === 'GET_MEDIA_STATUS' ||
      candidate.type === 'DOWNLOAD_FREE_PLAY_MEDIA' ||
      candidate.type === 'CANCEL_FREE_PLAY_MEDIA' ||
      candidate.type === 'CHECK_MEDIA_UPDATE')
  );
}
