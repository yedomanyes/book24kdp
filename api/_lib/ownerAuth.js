import { getAdminAuth } from './firebaseAdmin.js';

export function isOwner(user) {
  return Boolean(
    user &&
      user.email &&
      process.env.OWNER_EMAIL &&
      user.email === process.env.OWNER_EMAIL
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}

export async function requireOwner(req, res) {
  const token = getBearerToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);

    if (!isOwner(decoded)) {
      res.status(403).json({ error: 'Access denied. Owner only.' });
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Owner auth verification failed:', error);
    res.status(401).json({ error: 'Invalid authentication token.' });
    return null;
  }
}
