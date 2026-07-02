import { getAdminAuth, getAdminDb } from '../_lib/firebaseAdmin.js';
import { requireOwner } from '../_lib/ownerAuth.js';

function serializeDate(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

async function getBooksGenerated(db, uid, profile = {}) {
  if (typeof profile.booksGenerated === 'number') {
    return profile.booksGenerated;
  }

  try {
    const aggregateSnapshot = await db.collection('users').doc(uid).collection('books').count().get();
    return aggregateSnapshot.data().count ?? 0;
  } catch (error) {
    console.warn(`Falling back to manual books count for ${uid}:`, error);
    const snapshot = await db.collection('users').doc(uid).collection('books').get();
    return snapshot.size;
  }
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  return users;
}

function applyFilters(users, query) {
  const search = (query.q || '').trim().toLowerCase();
  const plan = (query.plan || '').trim().toLowerCase();
  const status = (query.status || '').trim().toLowerCase();
  const sort = (query.sort || 'createdAt_desc').trim();

  let filtered = users.filter((user) => {
    const emailMatches = !search || (user.email || '').toLowerCase().includes(search);
    const planMatches = !plan || String(user.plan || '').toLowerCase() === plan;
    const statusMatches = !status || String(user.status || '').toLowerCase() === status;
    return emailMatches && planMatches && statusMatches;
  });

  filtered.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sort === 'createdAt_asc' ? aTime - bTime : bTime - aTime;
  });

  return filtered;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const owner = await requireOwner(req, res);
  if (!owner) return;

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const authUsers = await listAllUsers(auth);

    const users = await Promise.all(
      authUsers.map(async (userRecord) => {
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const userDocSnap = await userDocRef.get();
        const profile = userDocSnap.exists ? userDocSnap.data() || {} : {};
        const booksGenerated = await getBooksGenerated(db, userRecord.uid, profile);

        return {
          id: userRecord.uid,
          email: userRecord.email || profile.email || null,
          name: profile.name || userRecord.displayName || null,
          plan: profile.plan || null,
          licenseKey: profile.licenseKey || null,
          gumroadProductId: profile.gumroadProductId || null,
          activated: typeof profile.activated === 'boolean' ? profile.activated : !!userRecord.emailVerified,
          createdAt: serializeDate(profile.createdAt) || (userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime).toISOString() : null),
          lastLoginAt: serializeDate(profile.lastLoginAt) || (userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toISOString() : null),
          booksGenerated,
          status: profile.status || (userRecord.disabled ? 'banned' : 'active'),
        };
      })
    );

    return res.status(200).json(applyFilters(users, req.query || {}));
  } catch (error) {
    console.error('Failed to load owner users:', error);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
}
