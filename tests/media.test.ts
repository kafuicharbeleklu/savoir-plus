import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HOSTED_VIDEOS, hostedVideo } from '../src/media';
import { initialExtendedState } from '../src/wireframeData';

test('vidéos hébergées avec le site : présentes dans public/, au format MP4', () => {
  for (const [id, file] of Object.entries(HOSTED_VIDEOS)) {
    const full = path.join(process.cwd(), 'public', file);
    assert.ok(fs.existsSync(full), `${file} manquant`);
    const head = fs.readFileSync(full).subarray(4, 8).toString('latin1');
    assert.equal(head, 'ftyp', `${file} n’est pas un MP4`);
    assert.ok(fs.statSync(full).size > 1_000_000, `${id} : fichier trop petit`);
  }
});

test('vidéos : une adresse Pexels connue lit le fichier du site ; une autre reste telle quelle', () => {
  assert.equal(hostedVideo('https://videos.pexels.com/video-files/9198355/9198355-sd_960_540_25fps.mp4'), 'media/pexels-9198355.mp4');
  assert.equal(hostedVideo('https://videos.pexels.com/video-files/1234567/1234567-hd.mp4'), 'https://videos.pexels.com/video-files/1234567/1234567-hd.mp4');
  assert.equal(hostedVideo('media/pexels-6281083.mp4'), 'media/pexels-6281083.mp4');
  // Les publications de démonstration n'appellent plus videos.pexels.com.
  const videos = initialExtendedState().posts.filter((p) => p.media?.kind === 'video');
  assert.ok(videos.length >= 2);
  assert.ok(videos.every((p) => p.media!.src.startsWith('media/')));
});
