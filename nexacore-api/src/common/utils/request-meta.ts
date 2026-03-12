export interface RequestMeta {
  ipAddress: string;
  userAgent: string | null;
}

export function extractRequestMeta(req: {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
}): RequestMeta {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: (req.headers?.['user-agent'] as string | undefined) || null,
  };
}
