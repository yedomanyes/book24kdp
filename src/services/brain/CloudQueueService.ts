import { db } from '../../firebase';
import { collection, setDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { BrainState } from '../../types/brain';
import type { BrainBookInput } from '../../types/brain';
import { ObsidianSyncService } from './ObsidianSyncService';
import { BrainService } from './BrainService';

export class CloudQueueService {
  /**
   * Pushes a book to the cloud queue.
   * If the Mac is offline, it stays there with synced_to_obsidian = false.
   */
  static async pushBookToQueue(accountId: string, book: BrainBookInput): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'books', book.id);
      await setDoc(docRef, {
        title: book.title || 'Unbekanntes Buch',
        niche: book.marketNiche || 'Allgemein',
        user_id: accountId, // Or a global auth uid
        content: JSON.stringify(book), // Store the raw book structure
        quality_score: book.marketScore || 0,
        synced_to_obsidian: false,
        updated_at: serverTimestamp()
      }, { merge: true });
      console.log('Book successfully pushed to Cloud Queue.');
    } catch (err) {
      console.error('Failed to push to Cloud Queue:', err);
    }
  }

  /**
   * Reads from the Cloud Queue and syncs to Obsidian if connected.
   */
  static async processQueue(accountId: string): Promise<number> {
    if (!db || !ObsidianSyncService.isConnected()) return 0;
    
    let syncedCount = 0;
    try {
      const colRef = collection(db, 'books');
      const q = query(
        colRef, 
        where('synced_to_obsidian', '==', false),
        where('user_id', '==', accountId)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return 0;

      for (const document of snapshot.docs) {
        const data = document.data();
        const book: BrainBookInput = JSON.parse(data.content);
        
        // Sync the full book to Obsidian
        const state = BrainService.getState(accountId);
        
        // Re-sync book metadata and chapters
        await ObsidianSyncService.syncBookMeta(book, state);
        
        if (book.cmieStore && book.pagesText) {
          for (const [pageStr, text] of Object.entries(book.pagesText)) {
            const pageNum = Number(pageStr);
            const memory = book.cmieStore[pageNum];
            if (memory && text) {
              await ObsidianSyncService.syncPageLearned(book, pageNum, memory, state);
            }
          }
        }
        
        // Mark as synced in Firebase
        await updateDoc(doc(db, 'books', document.id), {
          synced_to_obsidian: true
        });
        
        syncedCount++;
      }
      
      if (syncedCount > 0) {
        BrainService.markObsidianSync(accountId, syncedCount);
      }
      
    } catch (err) {
      console.error('Failed to process Cloud Queue:', err);
    }
    
    return syncedCount;
  }

  /**
   * Pushes the entire BrainState to the cloud.
   */
  static async pushBrainState(accountId: string, state: BrainState): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'brain_states', accountId);
      await setDoc(docRef, {
        state: JSON.stringify(state),
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Failed to push BrainState to cloud:', err);
    }
  }

  /**
   * Pulls the BrainState from the cloud.
   */
  static async pullBrainState(accountId: string): Promise<BrainState | null> {
    if (!db) return null;
    try {
      const docRef = doc(db, 'brain_states', accountId);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().state) {
        return JSON.parse(snap.data().state) as BrainState;
      }
    } catch (err) {
      console.error('Failed to pull BrainState from cloud:', err);
    }
    return null;
  }
}
