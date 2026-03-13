import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthCallbackFilter } from '../guards/oauth-callback.filter';
import { ErrorMessages } from '../../common/constants/error-messages';

describe('OAuthCallbackFilter', () => {
  let filter: OAuthCallbackFilter;
  let configService: { get: jest.Mock };
  let response: { redirect: jest.Mock };
  let host: ArgumentsHost;
  let loggerWarnSpy: jest.SpyInstance;

  const FRONTEND_URL = 'https://frontend.test';
  const EXPECTED_REDIRECT = `${FRONTEND_URL}/auth/callback?error=${encodeURIComponent(ErrorMessages.auth.AUTHENTICATION_FAILED)}`;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = { get: jest.fn().mockReturnValue(FRONTEND_URL) };
    response = { redirect: jest.fn() };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    filter = new OAuthCallbackFilter(configService as unknown as ConfigService);
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
  });

  it('should redirect to frontend with encoded error on HttpException', () => {
    const exception = new HttpException('Bad Request', 400);

    filter.catch(exception, host);

    expect(configService.get).toHaveBeenCalledWith('app.frontendUrl');
    expect(response.redirect).toHaveBeenCalledWith(EXPECTED_REDIRECT);
  });

  it('should redirect to frontend with encoded error on generic Error', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, host);

    expect(response.redirect).toHaveBeenCalledWith(EXPECTED_REDIRECT);
  });

  it('should redirect to frontend with encoded error on unknown (non-Error) exception', () => {
    filter.catch('unknown string error', host);

    expect(response.redirect).toHaveBeenCalledWith(EXPECTED_REDIRECT);
  });

  it('should log warning with exception message for HttpException and Error', () => {
    const httpException = new HttpException('Forbidden', 403);
    filter.catch(httpException, host);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      `OAuth callback failed: ${httpException.message}`,
    );

    loggerWarnSpy.mockClear();

    const genericError = new Error('connection timeout');
    filter.catch(genericError, host);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'OAuth callback failed: connection timeout',
    );
  });

  it('should log warning with "unknown error" for non-Error exception', () => {
    filter.catch({ weird: 'object' }, host);

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'OAuth callback failed with unknown error',
    );
  });
});
