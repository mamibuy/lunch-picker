// 上線前改成公司 Email 網域，例如 'yourcompany.com'
// 空字串 = 開發階段，接受任何 Email
export const ALLOWED_EMAIL_DOMAIN = '';

export function isAllowedEmail(email: string): boolean {
  if (!ALLOWED_EMAIL_DOMAIN) return true;
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}
