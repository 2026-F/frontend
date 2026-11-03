import axios from 'axios';

export function requestFailure(
  error: unknown,
  fallback = '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return '로그인이 필요하거나 만료되었습니다. 다시 로그인해 주세요.';
    if (error.response?.status === 403) return '이 정보를 볼 권한이 없습니다.';
    if (error.response?.status === 404) return '요청한 정보를 찾을 수 없습니다.';
    if (!error.response)
      return '서버에 연결할 수 없습니다. 연결 상태를 확인하고 다시 시도해 주세요.';
  }
  return fallback;
}

export function isMissing(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
