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

test('couvertures par sujet : une par module, aucune pour une fiche ou un parcours sans sujet reconnu', async () => {
  const { coverFor } = await import('../src/components/SubjectCovers');
  assert.equal(coverFor({ id: 'phishing', title: 'Ne tombez plus dans le piège', type: 'module' }), 'phish');
  assert.equal(coverFor({ id: 'sauvegarde', title: 'Sauvegarder ses fichiers', type: 'module' }), 'sauv');
  assert.equal(coverFor({ id: 'memo-liens', title: 'Mémo : Vérifier un lien suspect', type: 'resource' }), 'lien');
  assert.equal(coverFor({ id: 'fiche-reseau', title: 'Ma fiche de révision : Les repères du réseau', type: 'resource' }), null);
  // Un module du Studio : le sujet se lit dans son titre.
  assert.equal(coverFor({ id: 'st-1', title: 'Découverte du clavier', type: 'module' }), 'clavier');
  assert.equal(coverFor({ id: 'st-2', title: 'Histoire du Togo', type: 'module' }), null);
  const ids = ['phishing', 'reseaux', 'comptes', 'email-pro', 'budget', 'sauvegarde', 'reunion'].map((id) => coverFor({ id, title: '', type: 'module' }));
  assert.equal(new Set(ids).size, ids.length, 'jamais la même composition');
});

test('photos des annonces : une par annonce, toujours la même ; l’annonce maison garde son illustration', async () => {
  const { adPhoto, PHOTOS } = await import('../src/media');
  assert.equal(adPhoto({ id: 'ad-house', advertiserKind: 'house' }), null);
  const photo = adPhoto({ id: 'ad-palmiers', advertiserKind: 'institution' });
  assert.ok(photo && (Object.values(PHOTOS) as string[]).includes(photo));
  assert.equal(adPhoto({ id: 'ad-palmiers', advertiserKind: 'institution' }), photo);
});
