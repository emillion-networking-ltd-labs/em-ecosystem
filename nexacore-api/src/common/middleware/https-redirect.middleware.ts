import { INestApplication } from '@nestjs/common';

export function registerHttpsRedirectMiddleware(app: INestApplication): void {
  if (process.env.NODE_ENV !== 'production') return;

  app.use(
    (
      req: {
        headers: Record<string, string | undefined>;
        url: string;
        hostname: string;
      },
      res: { redirect: (status: number, url: string) => void },
      next: () => void,
    ) => {
      const proto = req.headers['x-forwarded-proto'];
      if (proto && proto !== 'https') {
        res.redirect(301, `https://${req.hostname}${req.url}`);
        return;
      }
      next();
    },
  );
}
