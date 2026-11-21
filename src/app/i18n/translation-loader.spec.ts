import { TestBed } from '@angular/core/testing';
import { TranslationLoader } from './translation-loader';

describe('TranslationLoader', () => {
  const loader = () => TestBed.inject(TranslationLoader);

  it('loads the English texts', async () => {
    const texts = await loader().getTranslation('en');

    expect(texts['header']).toMatchObject({ appName: 'Task Manager' });
  });

  it('loads the Arabic texts', async () => {
    const texts = await loader().getTranslation('ar');

    expect(texts['header']).toMatchObject({ appName: 'مدير المهام' });
  });

  it('falls back to English for a language it does not have', async () => {
    const texts = await loader().getTranslation('fr');

    expect(texts['header']).toMatchObject({ appName: 'Task Manager' });
  });
});
