/**
 * Photo de profil et photo de couverture, sur le modèle de LinkedIn :
 * une fenêtre d'aperçu (Modifier · Mettre à jour · Supprimer) puis un éditeur réel
 * (déplacer, zoomer, pivoter, retourner, régler la lumière) qui enregistre l'image recadrée.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Eye, FlipHorizontal2, FlipVertical2, Pencil, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { Modal } from './ui';

export type MediaKind = 'photo' | 'cover';

const SPEC: Record<MediaKind, { ratio: number; out: [number, number]; title: string; editTitle: string; noun: string }> = {
  photo: { ratio: 1, out: [400, 400], title: 'Photo de profil', editTitle: 'Modifier la photo', noun: 'la photo de profil' },
  cover: { ratio: 4, out: [1584, 396], title: 'Photo de couverture', editTitle: 'Modifier la photo de couverture', noun: 'la photo de couverture' }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const supportsCanvasFilter =
  typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

/** Lit un fichier image et le ramène à 2000 px au plus, pour un éditeur fluide. */
function loadImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('lecture'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const ratio = Math.min(1, 2000 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------------- éditeur */

function ImageEditor({
  kind,
  src,
  onCancel,
  onSave
}: {
  kind: MediaKind;
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const spec = SPEC[kind];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const [tab, setTab] = useState<'crop' | 'adjust'>('crop');
  const [zoom, setZoom] = useState(1);
  const [fine, setFine] = useState(0);
  const [quarter, setQuarter] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offset, setOffset] = useState({ u: 0, v: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  useLayoutEffect(() => {
    const measure = () => {
      const box = viewportRef.current?.getBoundingClientRect();
      if (box) setView({ w: box.width, h: box.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Géométrie : l'image couvre toujours le cadre, quels que soient l'angle et le zoom.
  const theta = ((quarter * 90 + fine) * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const needW = view.w * Math.abs(cos) + view.h * Math.abs(sin);
  const needH = view.w * Math.abs(sin) + view.h * Math.abs(cos);
  const iw = image?.naturalWidth || 1;
  const ih = image?.naturalHeight || 1;
  const scale = Math.max(needW / iw, needH / ih) * zoom;
  const maxU = Math.max(0, (iw * scale - needW) / 2);
  const maxV = Math.max(0, (ih * scale - needH) / 2);
  const u = clamp(offset.u, -maxU, maxU);
  const v = clamp(offset.v, -maxV, maxV);
  const fx = flipH ? -1 : 1;
  const fy = flipV ? -1 : 1;
  const filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const last = dragRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    // Le déplacement à l'écran est ramené dans les axes de l'image (qui peut être pivotée).
    setOffset({ u: clamp(u + dx * cos + dy * sin, -maxU, maxU), v: clamp(v - dx * sin + dy * cos, -maxV, maxV) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  /** Flèches : déplacement au clavier, pour ne pas dépendre de la souris. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 8;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const [dx, dy] = move;
    setOffset({ u: clamp(u + dx * cos + dy * sin, -maxU, maxU), v: clamp(v - dx * sin + dy * cos, -maxV, maxV) });
  };

  const save = () => {
    if (!image || !view.w) return;
    const [ow, oh] = spec.out;
    const k = ow / view.w;
    const canvas = document.createElement('canvas');
    canvas.width = ow;
    canvas.height = oh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ow, oh);
    if (supportsCanvasFilter) ctx.filter = filter;
    ctx.translate(ow / 2, oh / 2);
    ctx.rotate(theta);
    ctx.translate(u * k, v * k);
    ctx.scale(scale * k * fx, scale * k * fy);
    ctx.drawImage(image, -iw / 2, -ih / 2);
    onSave(canvas.toDataURL('image/jpeg', 0.88));
  };

  const reset = () => {
    setZoom(1);
    setFine(0);
    setQuarter(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ u: 0, v: 0 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <Modal
      open
      size="xl"
      flush
      title={spec.editTitle}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="pm-reset" onClick={reset}>
            Réinitialiser
          </button>
          <button type="button" className="primary ui-btn-sm" disabled={!image} onClick={save}>
            Enregistrer les modifications
          </button>
        </>
      }
    >
      <div className={`pm-editor is-${kind}`}>
        <div className="pm-stage">
          <div
            ref={viewportRef}
            className="pm-viewport"
            tabIndex={0}
            role="img"
            aria-label="Cadre de l’image : faites glisser ou utilisez les flèches pour la déplacer"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            {image && (
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  width: iw,
                  height: ih,
                  filter,
                  transform: `translate(-50%, -50%) rotate(${quarter * 90 + fine}deg) translate(${u}px, ${v}px) scale(${scale * fx}, ${scale * fy})`
                }}
              />
            )}
          </div>
        </div>

        <div className="pm-controls">
          <div className="pm-tabs" role="tablist" aria-label="Outils">
            <button type="button" role="tab" aria-selected={tab === 'crop'} className={tab === 'crop' ? 'is-on' : ''} onClick={() => setTab('crop')}>
              Rogner
            </button>
            {supportsCanvasFilter && (
              <button type="button" role="tab" aria-selected={tab === 'adjust'} className={tab === 'adjust' ? 'is-on' : ''} onClick={() => setTab('adjust')}>
                Ajuster
              </button>
            )}
          </div>

          {tab === 'crop' ? (
            <>
              <div className="pm-icon-row">
                <button type="button" aria-label="Pivoter à gauche" title="Pivoter à gauche" onClick={() => setQuarter((q) => (q + 3) % 4)}>
                  <RotateCcw size={22} />
                </button>
                <button type="button" aria-label="Pivoter à droite" title="Pivoter à droite" onClick={() => setQuarter((q) => (q + 1) % 4)}>
                  <RotateCw size={22} />
                </button>
                <button type="button" aria-label="Retourner horizontalement" title="Retourner horizontalement" aria-pressed={flipH} onClick={() => setFlipH((f) => !f)}>
                  <FlipHorizontal2 size={22} />
                </button>
                <button type="button" aria-label="Retourner verticalement" title="Retourner verticalement" aria-pressed={flipV} onClick={() => setFlipV((f) => !f)}>
                  <FlipVertical2 size={22} />
                </button>
              </div>
              <label className="pm-slider">
                <span>Zoomer</span>
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </label>
              <label className="pm-slider">
                <span>Pivoter</span>
                <input type="range" min={-45} max={45} step={1} value={fine} onChange={(e) => setFine(Number(e.target.value))} />
              </label>
            </>
          ) : (
            <>
              <label className="pm-slider">
                <span>Luminosité</span>
                <input type="range" min={50} max={150} step={1} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
              </label>
              <label className="pm-slider">
                <span>Contraste</span>
                <input type="range" min={50} max={150} step={1} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
              </label>
              <label className="pm-slider">
                <span>Saturation</span>
                <input type="range" min={0} max={200} step={1} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />
              </label>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- fenêtre d'aperçu */

export function ProfileMediaDialog({
  kind,
  open,
  current,
  placeholder,
  visibilityLabel,
  onOpenVisibility,
  onChange,
  onClose,
  setToast
}: {
  kind: MediaKind;
  open: boolean;
  /** Image enregistrée (data URL), s'il y en a une. */
  current?: string;
  /** Affichage par défaut quand aucune image n'est enregistrée (initiales, couverture de base). */
  placeholder: React.ReactNode;
  visibilityLabel?: string;
  onOpenVisibility?: () => void;
  /** Reçoit la nouvelle image, ou `null` pour la retirer. */
  onChange: (dataUrl: string | null) => void;
  onClose: () => void;
  setToast: (message: string) => void;
}) {
  const spec = SPEC[kind];
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setConfirmDelete(false);
    }
  }, [open]);

  if (!open) return null;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast('Ce fichier n’est pas une image.');
      return;
    }
    try {
      setEditing(await loadImageFile(file));
    } catch {
      setToast('Cette image n’a pas pu être lue. Essayez un fichier JPEG ou PNG.');
    }
  };

  if (editing) {
    return (
      <ImageEditor
        kind={kind}
        src={editing}
        onCancel={() => setEditing(null)}
        onSave={(dataUrl) => {
          onChange(dataUrl);
          setEditing(null);
          setToast(kind === 'photo' ? 'Photo de profil enregistrée' : 'Photo de couverture enregistrée');
        }}
      />
    );
  }

  return (
    <Modal open size={kind === 'photo' ? 'lg' : 'xl'} flush title={spec.title} onClose={onClose}>
      <div className={`pm-view is-${kind}`}>
        <div className="pm-view-stage">{current ? <img src={current} alt={spec.title} /> : placeholder}</div>

        {kind === 'photo' && visibilityLabel && (
          <button type="button" className="pm-visibility" onClick={onOpenVisibility} title="Modifier qui peut voir votre profil">
            <Eye size={16} aria-hidden="true" /> {visibilityLabel}
          </button>
        )}

        <div className="pm-actions">
          {current && (
            <button type="button" onClick={() => setEditing(current)}>
              <Pencil size={24} aria-hidden="true" />
              Modifier
            </button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()}>
            <Camera size={24} aria-hidden="true" />
            {current ? (kind === 'photo' ? 'Mettre à jour' : 'Modifier la photo') : 'Ajouter une photo'}
          </button>
          <input ref={fileRef} className="sr-only" type="file" accept="image/*" tabIndex={-1} aria-hidden="true" onChange={onPick} />
          {current &&
            (confirmDelete ? (
              <span className="pm-confirm">
                Supprimer {spec.noun} ?
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    onChange(null);
                    setConfirmDelete(false);
                    setToast(kind === 'photo' ? 'Photo de profil supprimée' : 'Photo de couverture supprimée');
                  }}
                >
                  Oui
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}>
                  Non
                </button>
              </span>
            ) : (
              <button type="button" className="pm-delete" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={24} aria-hidden="true" />
                Supprimer
              </button>
            ))}
        </div>
      </div>
    </Modal>
  );
}
