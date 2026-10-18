// Only a confirmed absence of a session may use browser-only guest storage.
export async function draftIdentity(client) {
  const session = await client.auth.getSession();
  if (session.error) throw session.error;
  if (!session.data?.session) return null;
  const result = await client.auth.getUser();
  if (result.error) throw result.error;
  if (!result.data?.user || result.data.user.id !== session.data.session.user.id)
    throw new Error('DRAFT_AUTH_CHANGED');
  return result.data.user;
}
