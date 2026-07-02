import { getCurrentAppUser, supabase } from '../../supabase';
import type { BrainState } from '../../types/brain';
import type { BrainBookInput } from '../../types/brain';
import { ObsidianSyncService } from './ObsidianSyncService';
import { BrainService } from './BrainService';

export class CloudQueueService {
  private static async getCurrentUid(): Promise<string | null> {
    const user = await getCurrentAppUser();
    return user?.uid ?? null;
  }

  private static getQueueDocId(accountId: string, bookId: string): string {
    return `${accountId}__${bookId}`;
  }

  static async pushBookToQueue(accountId: string, book: BrainBookInput): Promise<void> {
    const uid = await this.getCurrentUid();
    if (!supabase || !uid) return;
    try {
      const { error } = await supabase.from('queue_items').upsert({
        id: this.getQueueDocId(accountId, book.id),
        account_id: accountId,
        book_id: book.id,
        title: book.title || 'Unbekanntes Buch',
        niche: book.marketNiche || 'Allgemein',
        user_id: uid,
        content: book,
        quality_score: book.marketScore || 0,
        synced_to_obsidian: false,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      console.log('Book successfully pushed to Supabase Queue.');
    } catch (err) {
      console.error('Failed to push to Supabase Queue:', err);
    }
  }

  static async processQueue(accountId: string): Promise<number> {
    const uid = await this.getCurrentUid();
    if (!supabase || !uid || !ObsidianSyncService.isConnected()) return 0;

    let syncedCount = 0;
    try {
      const { data, error } = await supabase
        .from('queue_items')
        .select('*')
        .eq('user_id', uid)
        .eq('account_id', accountId)
        .eq('synced_to_obsidian', false)
        .order('updated_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      for (const entry of data) {
        const book = entry.content as BrainBookInput;
        const state = BrainService.getState(accountId);

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

        const { error: updateError } = await supabase
          .from('queue_items')
          .update({ synced_to_obsidian: true, updated_at: new Date().toISOString() })
          .eq('id', entry.id)
          .eq('user_id', uid);

        if (updateError) throw updateError;
        syncedCount++;
      }

      if (syncedCount > 0) {
        BrainService.markObsidianSync(accountId, syncedCount);
      }
    } catch (err) {
      console.error('Failed to process Supabase Queue:', err);
    }

    return syncedCount;
  }

  static async pushBrainState(accountId: string, state: BrainState): Promise<void> {
    const uid = await this.getCurrentUid();
    if (!supabase || !uid) return;
    try {
      const { error } = await supabase.from('brain_states').upsert({
        user_id: uid,
        account_id: accountId,
        state,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,account_id' });
      if (error) throw error;
    } catch (err) {
      console.error('Failed to push BrainState to cloud:', err);
    }
  }

  static async pullBrainState(accountId: string): Promise<BrainState | null> {
    const uid = await this.getCurrentUid();
    if (!supabase || !uid) return null;
    try {
      const { data, error } = await supabase
        .from('brain_states')
        .select('state')
        .eq('user_id', uid)
        .eq('account_id', accountId)
        .maybeSingle();

      if (error) throw error;
      return (data?.state as BrainState | undefined) ?? null;
    } catch (err) {
      console.error('Failed to pull BrainState from cloud:', err);
    }
    return null;
  }
}
