import argon2 from 'argon2';

// OWASP Password Storage Cheat Sheet의 Argon2id 권장 최소 설정(메모리 19MiB, 반복 2회, 병렬 1).
// 값을 올리면 기존 회원은 다음 로그인 때 새 설정으로 자동 재해시된다(needsRehash).
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password) {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function needsRehash(hash) {
  return argon2.needsRehash(hash, HASH_OPTIONS);
}

let dummyHash;

/**
 * 가입되지 않은 이메일로 로그인할 때도 실제 검증과 같은 비용의 해시 연산을 수행한다.
 * 응답 시간 차이로 가입 여부가 드러나지 않게 하기 위함이며 항상 false를 반환한다.
 */
export async function verifyAgainstDummy(password) {
  dummyHash ??= hashPassword('dummy-password-for-timing-equalization');
  await verifyPassword(await dummyHash, password);
  return false;
}
