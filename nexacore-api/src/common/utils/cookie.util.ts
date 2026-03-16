import type { Response } from 'express';
import type { CookieConfig } from '../../auth/auth.service';

/**
 * Set a cookie on the response using a CookieConfig object.
 */
export function setCookieFromConfig(res: Response, cookie: CookieConfig): void {
  res.cookie(cookie.name, cookie.value, cookie.options);
}
