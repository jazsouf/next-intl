import {cache} from 'react';
import {initializeConfig, IntlConfig} from 'use-intl/core';
import {getRequestLocale} from './RequestLocale';
import createRequestConfig from './createRequestConfig';

// Make sure `now` is consistent across the request in case none was configured
function getDefaultNowImpl() {
  return new Date();
}
const getDefaultNow = cache(getDefaultNowImpl);

// This is automatically inherited by `NextIntlClientProvider` if
// the component is rendered from a Server Component
function getDefaultTimeZoneImpl() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
const getDefaultTimeZone = cache(getDefaultTimeZoneImpl);

async function receiveRuntimeConfigImpl(
  localeOverride?: string,
  getConfig?: typeof createRequestConfig
) {
  // In case the consumer doesn't read `params.locale` and instead provides the
  // `locale` (either in a single-language workflow or because the locale is
  // read from the user settings), don't attempt to read the request locale.
  const params = {
    get locale() {
      return localeOverride || getRequestLocale();
    }
  };

  let result = getConfig?.(params);
  if (result instanceof Promise) {
    result = await result;
  }

  return {
    ...result,
    locale: result?.locale || params.locale,
    now: result?.now || getDefaultNow(),
    timeZone: result?.timeZone || getDefaultTimeZone()
  };
}
const receiveRuntimeConfig = cache(receiveRuntimeConfigImpl);

async function getConfigImpl(localeOverride?: string): Promise<
  IntlConfig & {
    getMessageFallback: NonNullable<IntlConfig['getMessageFallback']>;
    now: NonNullable<IntlConfig['now']>;
    onError: NonNullable<IntlConfig['onError']>;
    timeZone: NonNullable<IntlConfig['timeZone']>;
  }
> {
  const runtimeConfig = await receiveRuntimeConfig(
    localeOverride,
    createRequestConfig
  );
  return initializeConfig(runtimeConfig);
}
const getConfig = cache(getConfigImpl);
export default getConfig;
