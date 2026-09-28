import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  normalizeEmail,
  normalizeName,
  passwordChecks,
  validateEmail,
  validateLogin,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validateSignup,
} from '../shared/validation.js';

describe('입력 검증 규칙 (화면·서버 공용)', () => {
  test('이메일은 앞뒤 공백 제거 후 소문자로 정규화한다', () => {
    assert.equal(normalizeEmail('  Hong.GilDong@Example.COM\t'), 'hong.gildong@example.com');
    assert.equal(normalizeEmail(undefined), '');
  });

  test('이름은 NFC로 통일하고 공백을 정리한다', () => {
    assert.equal(normalizeName('  홍   길동  '), '홍 길동');
    assert.equal(normalizeName('홍'), '홍'); // 자모 분리(NFD) 입력
  });

  test('이름 검증', () => {
    assert.ok(validateName(''));
    assert.ok(validateName('가'.repeat(51)));
    assert.ok(validateName('홍\u0007길동'));
    assert.equal(validateName('홍길동'), null);
    assert.equal(validateName('Jane Doe'), null);
  });

  test('이메일 형식 검증', () => {
    for (const bad of ['', 'plain', 'a@b', 'a@@b.com', 'a b@c.com', '@example.com', 'a@.com', 'a@example.']) {
      assert.ok(validateEmail(bad), `${bad} 는 거절되어야 한다`);
    }
    for (const good of ['a@b.co', 'first.last+tag@sub.example.co.kr']) {
      assert.equal(validateEmail(good), null, `${good} 는 허용되어야 한다`);
    }
    assert.ok(validateEmail(`${'a'.repeat(65)}@example.com`));
  });

  test('비밀번호 정책: 8~128자, 영문·숫자·특수문자 포함, 공백 금지', () => {
    assert.equal(validatePassword('Passw0rd!'), null);
    assert.match(validatePassword(''), /입력/);
    assert.match(validatePassword('Pa0!'), /8자 이상/);
    assert.match(validatePassword(`Aa1!${'x'.repeat(125)}`), /128자 이하/);
    assert.match(validatePassword('Pass w0rd!'), /공백/);
    assert.match(validatePassword('password1'), /특수문자/);
    assert.match(validatePassword('PASSWORD!'), /숫자/);
    assert.match(validatePassword('12345678!'), /영문/);
    assert.deepEqual(
      passwordChecks('abc').map((c) => [c.id, c.ok]),
      [
        ['length', false],
        ['letter', true],
        ['digit', false],
        ['special', false],
        ['space', true],
      ],
    );
  });

  test('비밀번호 확인 일치 검사', () => {
    assert.match(validatePasswordConfirm('Passw0rd!', ''), /한 번 더/);
    assert.match(validatePasswordConfirm('Passw0rd!', 'Passw0rd?'), /일치하지/);
    assert.equal(validatePasswordConfirm('Passw0rd!', 'Passw0rd!'), null);
  });

  test('가입 검증은 정규화된 값과 필드별 오류를 돌려준다', () => {
    const { values, errors } = validateSignup({
      name: ' 홍길동 ',
      email: ' A@B.COM ',
      password: 'Passw0rd!',
      passwordConfirm: 'Passw0rd!',
    });
    assert.deepEqual(values, { name: '홍길동', email: 'a@b.com', password: 'Passw0rd!' });
    assert.deepEqual(errors, {});
    assert.deepEqual(Object.keys(validateSignup(null).errors).sort(), [
      'email',
      'name',
      'password',
      'passwordConfirm',
    ]);
    // 문자열이 아닌 값은 무시한다.
    assert.ok(validateSignup({ password: ['Passw0rd!'] }).errors.password);
  });

  test('로그인 검증은 비밀번호 정책을 다시 적용하지 않는다', () => {
    assert.deepEqual(validateLogin({ email: 'a@b.com', password: 'old' }).errors, {});
    assert.deepEqual(Object.keys(validateLogin({}).errors).sort(), ['email', 'password']);
  });
});
