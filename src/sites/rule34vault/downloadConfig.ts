import { BooruDownloadConfig, SupportedTemplate, type TemplateData } from '../base/downloadConfig';

export class Rule34VaultDownloadConfig extends BooruDownloadConfig {
  static get supportedTemplate(): Partial<TemplateData> {
    return {
      [SupportedTemplate.ID]: '{id}',
      [SupportedTemplate.ARTIST]: '{artist}',
      [SupportedTemplate.CHARACTER]: '{character}',
      [SupportedTemplate.DATE]: '{date}, {date(YYYY-MM-DD)}',
      [SupportedTemplate.SCORE]: '{score}'
    };
  }

  protected getTemplateData(): Partial<TemplateData> {
    return {
      id: this.id,
      artist: this.artist,
      character: this.character,
      date: this.createDate,
      score: String(this.score)
    };
  }
}
