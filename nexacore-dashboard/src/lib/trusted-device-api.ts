import { apiClient } from "./api";
import type {
  TrustedDeviceResponse,
  TrustDeviceResult,
  RevokeAllDevicesResponse,
  MessageResponse,
} from "./types";

export function trustDevice(
  fingerprint: string,
  password: string,
): Promise<TrustDeviceResult> {
  return apiClient.post<TrustDeviceResult>("/auth/trusted-devices", {
    fingerprint,
    password,
  });
}

export function listTrustedDevices(): Promise<TrustedDeviceResponse[]> {
  return apiClient.get<TrustedDeviceResponse[]>("/auth/trusted-devices");
}

export function revokeDevice(
  id: string,
  password: string,
): Promise<MessageResponse> {
  return apiClient.deleteWithBody<MessageResponse>(
    `/auth/trusted-devices/${id}`,
    { password },
  );
}

export function revokeAllDevices(
  password: string,
): Promise<RevokeAllDevicesResponse> {
  return apiClient.deleteWithBody<RevokeAllDevicesResponse>(
    "/auth/trusted-devices",
    { password },
  );
}
