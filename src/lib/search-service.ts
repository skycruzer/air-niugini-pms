/**
 * @fileoverview Fuzzy search service for pilot management
 * Provides advanced search capabilities with highlighting, history, and suggestions
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

import Fuse, { IFuseOptions } from 'fuse.js';
import { PilotWithCertifications } from './pilot-service-client';

/**
 * Search configuration for optimal fuzzy matching
 * Tuned for <100ms performance with 500+ pilots
 */
const SEARCH_OPTIONS: IFuseOptions<PilotWithCertifications> = {
  keys: [
    { name: 'first_name', weight: 0.3 },
    { name: 'last_name', weight: 0.3 },
    { name: 'employee_id', weight: 0.2 },
    { name: 'email', weight: 0.1 },
    { name: 'role', weight: 0.05 },
    { name: 'contract_type', weight: 0.05 },
  ],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  useExtendedSearch: false, // Keep false for better performance
};

/**
 * Search result with highlighting information
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  matches: Array<{
    key: string;
    indices: readonly [number, number][];
    value: string;
  }>;
}

/**
 * Recent search history item
 */
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

/**
 * Search service class for fuzzy pilot search
 */
export class PilotSearchService {
  private fuse: Fuse<PilotWithCertifications> | null = null;
  private historyKey = 'pilot-search-history';
  private maxHistoryItems = 10;

  /**
   * Initialize the search index with pilot data
   */
  initialize(pilots: PilotWithCertifications[]) {
    const startTime = performance.now();
    this.fuse = new Fuse(pilots, SEARCH_OPTIONS);
    const endTime = performance.now();
    console.log(`🔍 Search index initialized in ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Perform fuzzy search on pilots
   * Returns results sorted by relevance score
   */
  search(query: string): SearchResult<PilotWithCertifications>[] {
    if (!this.fuse || !query || query.trim().length < 2) {
      return [];
    }

    const startTime = performance.now();
    const results = this.fuse.search(query);
    const endTime = performance.now();

    console.log(
      `🔍 Search completed in ${(endTime - startTime).toFixed(2)}ms (${results.length} results)`
    );

    // Save to history
    this.addToHistory(query, results.length);

    // Transform Fuse results to our SearchResult format
    return results.map((result) => ({
      item: result.item,
      score: result.score || 0,
      matches: (result.matches || []).map((match) => ({
        key: match.key || '',
        indices: match.indices || [],
        value: match.value || '',
      })),
    }));
  }

  /**
   * Get search suggestions based on common patterns
   */
  getSuggestions(query: string, pilots: PilotWithCertifications[]): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // Add matching employee IDs
    pilots.forEach((pilot) => {
      if (pilot.employee_id.toLowerCase().includes(lowerQuery)) {
        suggestions.add(pilot.employee_id);
      }
    });

    // Add matching names
    pilots.forEach((pilot) => {
      const fullName = `${pilot.first_name} ${pilot.last_name}`;
      if (fullName.toLowerCase().includes(lowerQuery)) {
        suggestions.add(fullName);
      }
    });

    // Add matching roles
    if ('captain'.includes(lowerQuery)) suggestions.add('Captain');
    if ('first officer'.includes(lowerQuery)) suggestions.add('First Officer');

    // Add matching contract types
    if ('fulltime'.includes(lowerQuery)) suggestions.add('Fulltime');
    if ('contract'.includes(lowerQuery)) suggestions.add('Contract');
    if ('casual'.includes(lowerQuery)) suggestions.add('Casual');

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Highlight matched terms in text
   * Returns segments with match information for rendering
   */
  highlightMatches(
    text: string,
    indices: Array<[number, number]>
  ): Array<{ text: string; isMatch: boolean }> {
    if (!indices || indices.length === 0) {
      return [{ text, isMatch: false }];
    }

    const result: Array<{ text: string; isMatch: boolean }> = [];
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      // Add text before match
      if (start > lastIndex) {
        result.push({ text: text.substring(lastIndex, start), isMatch: false });
      }

      // Add highlighted match
      result.push({ text: text.substring(start, end + 1), isMatch: true });

      lastIndex = end + 1;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({ text: text.substring(lastIndex), isMatch: false });
    }

    return result;
  }

  /**
   * Add search query to history
   */
  private addToHistory(query: string, resultCount: number) {
    try {
      const history = this.getHistory();

      // Remove duplicate if exists
      const filtered = history.filter((item) => item.query !== query);

      // Add new item at the beginning
      filtered.unshift({
        query,
        timestamp: Date.now(),
        resultCount,
      });

      // Keep only max items
      const trimmed = filtered.slice(0, this.maxHistoryItems);

      localStorage.setItem(this.historyKey, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get search history
   */
  getHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.historyKey);
      if (!stored) return [];

      const history = JSON.parse(stored) as SearchHistoryItem[];

      // Filter out old entries (older than 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return history.filter((item) => item.timestamp > thirtyDaysAgo);
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.historyKey);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  /**
   * Get popular searches from history
   */
  getPopularSearches(limit: number = 5): string[] {
    const history = this.getHistory();

    // Count frequency of each query
    const frequency = new Map<string, number>();
    history.forEach((item) => {
      frequency.set(item.query, (frequency.get(item.query) || 0) + 1);
    });

    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);

    return sorted;
  }
}

/**
 * Singleton instance
 */
export const pilotSearchService = new PilotSearchService();

/**
 * Utility function to extract matched field names from search results
 */
export function getMatchedFields(result: SearchResult<PilotWithCertifications>): string[] {
  return Array.from(new Set(result.matches.map((match) => match.key)));
}

/**
 * Utility function to format field names for display
 */
export function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    employee_id: 'Employee ID',
    email: 'Email',
    role: 'Role',
    contract_type: 'Contract Type',
  };

  return fieldMap[field] || field;
}
