import helmet from 'helmet';
import { INestApplication } from '@nestjs/common';
import { SecurityConfig } from '../../security/security.config';

export function registerHelmetMiddleware(app: INestApplication): void {
  const { contentSecurityPolicy, hsts, referrerPolicy } = SecurityConfig.helmet;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: contentSecurityPolicy.directives,
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: hsts,
      referrerPolicy: referrerPolicy,
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      xXssProtection: false,
    }),
  );

  const permissionsPolicy = SecurityConfig.helmet.permissionsPolicy;
  app.use(
    (
      _req: unknown,
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      const directives = Object.entries(permissionsPolicy)
        .map(([feature, allowlist]) => {
          if (allowlist.length === 0) {
            return `${feature}=()`;
          }
          return `${feature}=(${(allowlist as readonly string[]).join(' ')})`;
        })
        .join(', ');
      res.setHeader('Permissions-Policy', directives);
      next();
    },
  );
}
