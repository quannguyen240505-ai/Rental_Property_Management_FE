import { describe, expect, it } from 'vitest';
import { validateNewPassword } from './password-validation';

describe('validateNewPassword', () => {
  it('không cho phép mật khẩu trống', () => {
    expect(validateNewPassword('')).toBeTruthy();
  });

  it('không cho phép mật khẩu dưới 10 ký tự', () => {
    expect(validateNewPassword('Abc123')).toBeTruthy();
  });

  it('yêu cầu đồng thời chữ và số', () => {
    expect(validateNewPassword('abcdefghijk')).toBeTruthy();
    expect(validateNewPassword('12345678901')).toBeTruthy();
  });

  it('từ chối chuỗi dài hơn 72 byte UTF-8', () => {
    expect(validateNewPassword('é'.repeat(36) + 'a1')).toBeTruthy();
  });

  it('chấp nhận mật khẩu đúng chính sách Backend', () => {
    expect(validateNewPassword('Example12345')).toBeNull();
  });
});
