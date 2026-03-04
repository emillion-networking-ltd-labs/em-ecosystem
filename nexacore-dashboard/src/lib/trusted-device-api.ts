import { apiClient } from './api';
import type {
  TrustedDeviceResponse,
  TrustDeviceResult,
  RevokeAllDevicesResponse,
  MessageResponse,
} from './types';

export function trustDevice(fingerprint: string): Promise<TrustDeviceResult> {
  return apiClient.post<TrustDeviceResult>('/auth/trusted-devices', { fingerprint });
}

export function listTrustedDevices(): Promise<TrustedDeviceResponse[]> {
  return apiClient.get<TrustedDeviceResponse[]>('/auth/trusted-devices');
}

export function revokeDevice(id: string): Promise<MessageResponse> {
  return apiClient.delete<MessageResponse>(`/auth/trusted-devices/${id}`);
}

export function revokeAllDevices(): Promise<RevokeAllDevicesResponse> {
  return apiClient.delete<RevokeAllDevicesResponse>('/auth/trusted-devices');
}
