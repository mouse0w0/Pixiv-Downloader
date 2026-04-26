import { ParserBase, type MediaMeta } from '../base/parser';
import type { SkebWork } from './types';

export interface SkebMeta<T extends string | string[] = string> extends MediaMeta<T> {
  userId: string;
  workId: string;
  genre: string;
  nsfw: boolean;
  body: string;
}

export class SkebParser extends ParserBase {
  parseScreenNameFromPath(path: string): string | undefined {
    const match = path.match(/@([^/]+)/);
    return match?.[1];
  }

  parseWorkNumberFromPath(path: string): number | undefined {
    const match = path.match(/\/works\/(\d+)/);
    return match ? Number(match[1]) : undefined;
  }

  buildMetaByWork(work: SkebWork): SkebMeta<string | string[]> {
    const creatorName = work.creator?.screen_name ?? this.UNKNOWN_ARTIST;
    const workNumber = this.parseWorkNumberFromPath(work.path);
    const workId = String(workNumber ?? work.id);
    const id = `${creatorName}/${workId}`;

    const srcs: string[] = [];
    const exts: string[] = [];

    for (const preview of work.previews) {
      if (preview.url) {
        srcs.push(preview.url);
        const ext = this.#getExtFromUrl(preview.url);
        exts.push(ext);
      }
    }

    if (srcs.length === 0 && work.preview_url) {
      srcs.push(work.preview_url);
      exts.push(this.#getExtFromUrl(work.preview_url));
    }

    const src = srcs.length === 1 ? srcs[0] : srcs;
    const extendName = exts.length === 1 ? exts[0] : exts;

    return {
      id,
      src,
      extendName,
      artist: creatorName,
      title: work.body || workId,
      tags: work.tag_list ?? [],
      createDate: '',
      userId: String(work.creator?.id ?? ''),
      workId,
      genre: work.genre,
      nsfw: work.nsfw,
      body: work.body ?? ''
    };
  }

  #getExtFromUrl(url: string): string {
    try {
      const fm = new URL(url).searchParams.get('fm');
      return fm ?? 'webp';
    } catch {
      return 'webp';
    }
  }
}
