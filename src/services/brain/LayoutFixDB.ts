export interface LayoutWarning {
  templateId: string;
  contentType: string; // e.g., "chapter_page", "toc"
  cause: string;
  count: number;
}

export class LayoutFixDB {
  private static STORAGE_KEY = 'b24studio_layout_fix_db';

  static load(): LayoutWarning[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static save(data: LayoutWarning[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static logWarning(templateId: string, contentType: string, cause: string) {
    const warnings = this.load();
    const existing = warnings.find(w => w.templateId === templateId && w.contentType === contentType && w.cause === cause);
    if (existing) {
      existing.count += 1;
    } else {
      warnings.push({ templateId, contentType, cause, count: 1 });
    }
    this.save(warnings);
  }

  static getWarningsForPrompt(templateId: string, contentType: string): string[] {
    const warnings = this.load();
    return warnings
      .filter(w => w.templateId === templateId && w.contentType === contentType)
      .map(w => `Achtung (bereits ${w.count}x aufgetreten): ${w.cause}`);
  }
}
