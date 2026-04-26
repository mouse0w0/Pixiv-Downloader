import type { SkebMeta } from './parser';
import {
  MayBeMultiIllustsConfig,
  SupportedTemplate,
  type IndexOption,
  type OptionBase
} from '../base/downloadConfig';
import type { DownloadConfig } from '@/lib/downloader';

export class SkebDownloadConfig extends MayBeMultiIllustsConfig {
  protected userId: string;
  protected workId: string;
  protected genre: string;
  protected body: string;

  constructor(meta: SkebMeta<string | string[]>) {
    super(meta);
    this.userId = meta.userId;
    this.workId = meta.workId;
    this.genre = meta.genre;
    this.body = meta.body;
  }

  static get supportedTemplate() {
    return {
      [SupportedTemplate.ID]: '{id}',
      [SupportedTemplate.ARTIST]: '{artist}',
      [SupportedTemplate.ARTISTID]: '{artistID}',
      [SupportedTemplate.DATE]: '{date} {date(YYYY-MM-DD)}',
      [SupportedTemplate.PAGE]: '{page}',
      [SupportedTemplate.TAGS]: '{tags}',
      [SupportedTemplate.TITLE]: '{title}'
    };
  }

  protected getZipComment(): string {
    return this.body;
  }

  protected getTemplateData(
    data: Partial<typeof SkebDownloadConfig.supportedTemplate> & { page: string }
  ): typeof SkebDownloadConfig.supportedTemplate {
    return {
      id: this.workId,
      artist: this.normalizeString(this.artist) || this.userId,
      artistID: this.userId,
      date: this.createDate,
      title: this.normalizeString(this.title) || this.workId,
      tags: this.tags.join('_'),
      ...data
    };
  }

  create(option: OptionBase | IndexOption): DownloadConfig {
    const {
      filenameTemplate,
      directoryTemplate,
      setProgress,
      useFileSystemAccessApi,
      filenameConflictAction
    } = option;
    const index = 'index' in option ? option.index : 0;

    return {
      taskId: this.getTaskId(),
      src: this.getSrc(index),
      path: this.getSavePath(
        directoryTemplate,
        filenameTemplate,
        this.getExt(index),
        this.getTemplateData({ page: String(index) })
      ),
      timeout: this.getDownloadTimeout(index),
      onProgress: setProgress,
      useFileSystemAccessApi,
      filenameConflictAction
    };
  }

  createMulti(option: OptionBase): DownloadConfig[] {
    if (!this.isStringArray(this.src)) throw new Error(`Artwork ${this.id} only have one media.`);

    const {
      filenameTemplate,
      directoryTemplate,
      setProgress,
      useFileSystemAccessApi,
      filenameConflictAction
    } = option;
    const taskId = this.getTaskId();
    const onFileSaved = setProgress ? this.getMultipleMediaDownloadCB(setProgress) : undefined;

    return this.src.map((src, i) => {
      return {
        taskId,
        src,
        path: this.getSavePath(
          directoryTemplate,
          filenameTemplate,
          this.getExt(i),
          this.getTemplateData({ page: String(i) })
        ),
        timeout: this.getDownloadTimeout(),
        onFileSaved,
        useFileSystemAccessApi,
        filenameConflictAction
      };
    });
  }

  createBundle(option: OptionBase): DownloadConfig[] {
    if (!this.isStringArray(this.src) || !this.isStringArray(this.ext))
      throw new Error(`Artwork ${this.id} only have one media.`);

    const {
      filenameTemplate,
      directoryTemplate,
      setProgress,
      useFileSystemAccessApi,
      filenameConflictAction
    } = option;

    const taskId = this.getTaskId();
    const onXhrLoaded = setProgress ? this.getMultipleMediaDownloadCB(setProgress) : undefined;

    const path = this.getSavePath(
      directoryTemplate,
      filenameTemplate,
      'zip',
      this.getTemplateData({
        page: String(this.src.length)
      })
    );

    const filenameTemplateWithPage = filenameTemplate.includes(`{${SupportedTemplate.PAGE}}`)
      ? filenameTemplate
      : filenameTemplate + `_{${SupportedTemplate.PAGE}}`;

    const filenames = this.src.map((_, i) => {
      return this.getSavePath(
        '',
        filenameTemplateWithPage,
        this.getExt(i),
        this.getTemplateData({ page: String(i) })
      );
    });

    return this.src.map((src, i) => {
      return {
        taskId,
        src,
        path,
        timeout: this.getDownloadTimeout(i),
        onXhrLoaded,
        beforeFileSave: this.handleBundleFactory(filenames),
        onError: this.handleBundleErrorFactory(),
        onAbort: this.handleBundleAbortFactory(),
        useFileSystemAccessApi,
        filenameConflictAction
      };
    });
  }
}
