/** Đồng bộ với Auth Service PasswordPolicy: ít nhất 10 ký tự, chữ + số, tối đa 72 byte UTF-8. */
export function validateNewPassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu mới.";
  if (
    password.length < 10 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return "Cần ít nhất 10 ký tự, gồm chữ và số.";
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "Mật khẩu không được vượt quá 72 byte.";
  }
  return null;
}
