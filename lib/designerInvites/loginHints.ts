/** Согласовано с лимитом в DesignerInviteService.sendInvite. */
export const DESIGNER_INVITE_DAILY_LIMIT = 100;

export function formatDesignerInviteClaimError(message: string, inviteEmail?: string | null): string {
  const email = inviteEmail?.trim().toLowerCase();
  if (!email) return message;
  if (message.includes('не подходит')) {
    return `${message} Войдите с email из приглашения: ${email}.`;
  }
  return message;
}
