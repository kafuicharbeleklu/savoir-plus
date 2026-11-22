/**
 * « Ma formule » : l'abonnement et ses paiements, sur le modèle de LinkedIn Premium (menu Me › Premium
 * features, puis « Manage your subscription » : pages Purchases et Transactions de l'Admin Center).
 * - En tête, la formule et son état (active, résiliée jusqu'au…, offre gratuite) et ce qu'elle ouvre.
 * - Achats : l'abonnement (fréquence de facturation à modifier, prochaine facturation, moyen de paiement
 *   à changer, changer de formule, résilier) et les contenus achetés à l'unité.
 * - Transactions : chaque paiement, avec « … » › Télécharger le reçu, Modifier les détails du reçu.
 * Démonstration : tout paiement est simulé.
 */
import React, { useEffect, useState } from 'react';
import { BadgeCheck, BookOpen, Check, Download, Pencil, Receipt } from 'lucide-react';
import type { CatalogItem, ExtendedDemoState } from '../wireframeData';
import type { Profile } from '../data';
import type { Day } from '../calendar';
import type { SchoolState } from '../school';
import {
  PAYMENT_METHODS,
  formatCfa,
  offerById,
  paidSubscription,
  plansFor,
  priceLabel,
  type BillingCycle,
  type Offer,
  type OfferAudience,
  type Subscription
} from '../offers';
import { CYCLE_LABEL, CYCLE_UNIT, cancel, changeCycle, changeMethod, cyclePrice, receiptHtml, settle, subscribe, type Transaction } from '../billing';
import { ActionMenu, ConfirmDialog, EmptyState, IconTile, ListCard, ListRow, Modal, PageHeader, RadioList, Select, StatusDot, Tabs } from '../components/ui';
import { memberName, moduleTitle } from './school/shared';

type Tab = 'purchases' | 'transactions';

const longDate = (day: Day) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const shortDate = (day: Day) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));

const CANCEL_CONSEQUENCE: Record<OfferAudience, string> = {
  family: 'Le plan de révision et l’emploi du temps de vos enfants se referment, leurs contenus payants aussi, et la publicité redevient obligatoire.',
  learner: 'Les contenus payants se referment et la publicité redevient obligatoire.',
  educator: 'Vos classes au-delà de la première se referment et la publicité redevient obligatoire.',
  institution: 'La publicité redevient obligatoire.',
  advertiser: ''
};

function Fact({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="sb-fact">
      <dt>{label}</dt>
      <dd>
        <span>{value}</span>
        {action}
      </dd>
    </div>
  );
}

export function SubscriptionPage({
  user,
  ext,
  updateExt,
  school,
  people,
  catalog,
  audience,
  adult,
  nav,
  setToast,
  today,
  target
}: {
  user: Profile;
  ext: ExtendedDemoState;
  updateExt: (fn: (prev: ExtendedDemoState) => ExtendedDemoState) => void;
  school?: SchoolState;
  people: Profile[];
  catalog: CatalogItem[];
  audience: OfferAudience;
  /** Un mineur ne souscrit pas : ses parents, si. */
  adult: boolean;
  nav: (page: any, id?: string) => void;
  setToast: (msg: string) => void;
  today: Day;
  /** Après #subscription/ : « transactions », ou « choose/<formule> » pour ouvrir le choix d'une formule. */
  target: string;
}) {
  const plans = plansFor(audience);
  const paidPlans = plans.filter((p) => p.price !== 0);
  const freePlan = plans.find((p) => p.price === 0);
  const raw = ext.subscriptions?.[user.id];
  const paid = paidSubscription(ext.subscriptions, user.id, today);
  // L'abonnement à jour (échéances passées payées) ; un abonnement terminé ne garde que son historique.
  const settled = raw ? settle(raw, today) : undefined;
  const current = paid && settled ? { sub: settled, offer: paid.offer } : null;
  const cancelled = Boolean(current?.sub.endsOn);
  const cycle: BillingCycle = current?.sub.cycle || 'monthly';
  // La période en cours garde sa fréquence ; une nouvelle fréquence ne vaut qu'à la prochaine échéance.
  const periodCycle: BillingCycle = current?.sub.payments?.at(-1)?.cycle || cycle;
  const pendingCycle = Boolean(current && !cancelled && periodCycle !== cycle);

  const [tab, setTab] = useState<Tab>(target === 'transactions' ? 'transactions' : 'purchases');
  const [planOpen, setPlanOpen] = useState(false);
  const [choice, setChoice] = useState('');
  const [choiceCycle, setChoiceCycle] = useState<BillingCycle>('monthly');
  const [choiceMethod, setChoiceMethod] = useState(PAYMENT_METHODS[0]);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [cycleChoice, setCycleChoice] = useState<BillingCycle>('monthly');
  const [methodOpen, setMethodOpen] = useState(false);
  const [methodChoice, setMethodChoice] = useState(PAYMENT_METHODS[0]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptAddress, setReceiptAddress] = useState('');
  const [receiptTaxId, setReceiptTaxId] = useState('');

  const openPlans = (offerId?: string) => {
    const preferred = (offerId && paidPlans.find((p) => p.id === offerId)) || paidPlans.find((p) => p.id !== current?.offer.id) || paidPlans[0];
    setChoice(preferred?.id || '');
    setChoiceCycle(cycle);
    setChoiceMethod(current?.sub.method || PAYMENT_METHODS[0]);
    setPlanOpen(true);
  };
  // « Choisir cette formule » (page Formules, Espace famille) : le choix s'ouvre sur la formule demandée.
  useEffect(() => {
    if (adult && target.startsWith('choose/')) openPlans(target.slice('choose/'.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const writeSub = (next: Subscription) =>
    updateExt((prev) => ({ ...prev, subscriptions: { ...prev.subscriptions, [user.id]: next } }));

  if (!adult || plans.length === 0) {
    return (
      <div className="sb-page">
        <PageHeader title="Ma formule" keepTitle />
        <ListCard label="Ma formule">
          <EmptyState title="Votre formule est gérée par un parent" text="Les formules se souscrivent à partir de 18 ans." />
        </ListCard>
      </div>
    );
  }

  /* ---------------------------------------------------------------- transactions */
  const subscriptionRows: Transaction[] = (settled?.payments || []).map((p) => ({
    id: p.id,
    day: p.day,
    label: `Formule ${offerById(p.offerId)?.name || p.offerId}`,
    detail: `Facturation ${p.cycle === 'annual' ? 'annuelle' : 'mensuelle'}`,
    amount: p.amount,
    method: p.method
  }));
  const purchases = (school?.purchases || []).filter((p) => p.buyerId === user.id);
  const purchaseRows: Transaction[] = purchases.map((p) => ({
    id: p.id,
    day: p.day,
    label: `« ${moduleTitle(catalog, p.itemId)} »`,
    detail: p.forUserId === user.id ? 'Contenu payant' : `Pour ${memberName(p.forUserId, people)}`,
    amount: p.amount,
    method: p.method
  }));
  const transactions = [...subscriptionRows, ...purchaseRows].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.id.localeCompare(a.id)));

  const detailsKey = (id: string) => `${user.id}:${id}`;
  const downloadReceipt = (t: Transaction) => {
    const d = ext.receiptDetails?.[detailsKey(t.id)];
    const html = receiptHtml(t, { name: d?.name || user.name, address: d?.address, taxId: d?.taxId }, longDate(t.day), formatCfa(t.amount));
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-${t.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`Reçu ${t.id} téléchargé`);
  };
  const openReceipt = (t: Transaction) => {
    const d = ext.receiptDetails?.[detailsKey(t.id)];
    setReceiptName(d?.name || user.name);
    setReceiptAddress(d?.address || '');
    setReceiptTaxId(d?.taxId || '');
    setReceipt(t);
  };
  const saveReceipt = () => {
    if (!receipt || !receiptName.trim()) return;
    const key = detailsKey(receipt.id);
    updateExt((prev) => ({
      ...prev,
      receiptDetails: {
        ...prev.receiptDetails,
        [key]: { name: receiptName.trim(), address: receiptAddress.trim() || undefined, taxId: receiptTaxId.trim() || undefined }
      }
    }));
    setReceipt(null);
    setToast('Détails du reçu enregistrés');
  };

  /* ---------------------------------------------------------------- actions sur l'abonnement */
  const chosen: Offer | undefined = paidPlans.find((p) => p.id === choice);
  const choiceIsCurrent = Boolean(current && chosen && chosen.id === current.offer.id);
  const confirmPlan = () => {
    if (!chosen || chosen.price === null || choiceIsCurrent) return;
    writeSub(subscribe(raw, chosen.id, choiceCycle, choiceMethod, today));
    setPlanOpen(false);
    setTab('purchases');
    setToast(`Formule ${chosen.name} activée · paiement simulé (${choiceMethod})`);
  };
  const planLabel = !chosen
    ? 'Choisir'
    : chosen.price === null
      ? 'Sur devis : nous contacter'
      : choiceIsCurrent
        ? 'Formule actuelle'
        : `${current ? `Passer à ${chosen.name}` : 'Souscrire'} · ${formatCfa(cyclePrice(chosen, choiceCycle))} / ${CYCLE_UNIT[choiceCycle]}`;

  const canCancel = Boolean(freePlan);
  const status = !current ? (
    <StatusDot tone="neutral">{freePlan ? 'Offre gratuite' : 'Aucune formule'}</StatusDot>
  ) : cancelled ? (
    <StatusDot tone="warn">Active jusqu’au {shortDate(current.sub.endsOn!)}</StatusDot>
  ) : (
    <StatusDot tone="ok">Active</StatusDot>
  );
  const shown = current?.offer || freePlan;
  const title = current
    ? `Formule ${current.offer.name}`
    : freePlan
      ? freePlan.name === 'Gratuite'
        ? 'Offre gratuite'
        : `Formule ${freePlan.name}`
      : 'Aucune formule';

  return (
    <div className="sb-page">
      <PageHeader title="Ma formule" keepTitle />

      {/* La formule et son état, comme « My Premium » */}
      <section className="wf-card sb-plan" aria-label="Votre formule">
        <div className="sb-plan-head">
          <IconTile tone="brand">
            <BadgeCheck size={20} aria-hidden="true" />
          </IconTile>
          <div className="sb-plan-name">
            <h2>{title}</h2>
            <p>{shown ? shown.tagline : 'Choisissez la formule de votre établissement.'}</p>
          </div>
          {status}
        </div>
        {shown && shown.features.length > 0 && (
          <ul className="sb-features">
            {shown.features.map((f) => (
              <li key={f}>
                <Check size={16} aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="li-text-link sb-compare" onClick={() => nav('info', `pricing/${audience}`)}>
          Comparer les formules
        </button>
      </section>

      <Tabs<Tab>
        label="Gestion de la formule"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'purchases', label: 'Achats' },
          { id: 'transactions', label: 'Transactions', count: transactions.length }
        ]}
      />

      {tab === 'purchases' ? (
        <>
          <div className="ui-section-title">
            <h2>Abonnement</h2>
          </div>
          {current ? (
            <section className="wf-card sb-card" aria-label="Abonnement">
              <dl className="sb-facts tabular-nums">
                <Fact label="Formule" value={`${current.offer.name} · ${formatCfa(cyclePrice(current.offer, periodCycle))} / ${CYCLE_UNIT[periodCycle]}`} />
                <Fact label="Souscrite le" value={longDate(current.sub.since)} />
                <Fact
                  label="Fréquence de facturation"
                  value={
                    pendingCycle
                      ? `${CYCLE_LABEL[periodCycle]} · ${CYCLE_LABEL[cycle].toLowerCase()} à partir du ${longDate(current.sub.nextDue!)}`
                      : CYCLE_LABEL[periodCycle]
                  }
                  action={
                    !cancelled && (
                      <button
                        type="button"
                        className="li-text-link"
                        onClick={() => {
                          setCycleChoice(cycle);
                          setCycleOpen(true);
                        }}
                      >
                        Modifier
                      </button>
                    )
                  }
                />
                {cancelled ? (
                  <Fact label="Fin de la formule" value={longDate(current.sub.endsOn!)} />
                ) : (
                  <Fact label="Prochaine facturation" value={`${longDate(current.sub.nextDue!)} · ${formatCfa(cyclePrice(current.offer, cycle))}`} />
                )}
                <Fact
                  label="Moyen de paiement"
                  value={current.sub.method}
                  action={
                    !cancelled && (
                      <button
                        type="button"
                        className="li-text-link"
                        onClick={() => {
                          setMethodChoice(current.sub.method || PAYMENT_METHODS[0]);
                          setMethodOpen(true);
                        }}
                      >
                        Changer de moyen de paiement
                      </button>
                    )
                  }
                />
              </dl>
              {cancelled ? (
                <p className="sb-note-line">
                  Résiliée le {longDate(current.sub.cancelledOn!)} : votre formule reste active jusqu’au {longDate(current.sub.endsOn!)}, puis votre
                  compte revient à l’offre gratuite. Aucun nouveau prélèvement.
                </p>
              ) : (
                (paidPlans.length > 1 || canCancel) && (
                  <div className="sb-actions">
                    {paidPlans.length > 1 && (
                      <button type="button" className="secondary ui-btn-sm" onClick={() => openPlans()}>
                        Changer de formule
                      </button>
                    )}
                    {canCancel && (
                      <button type="button" className="secondary ui-btn-sm" onClick={() => setCancelOpen(true)}>
                        Résilier l’abonnement
                      </button>
                    )}
                  </div>
                )
              )}
            </section>
          ) : (
            <ListCard label="Abonnement">
              <EmptyState
                title="Aucun abonnement en cours"
                text={freePlan ? 'Votre compte utilise l’offre gratuite.' : 'Votre établissement n’a pas encore de formule.'}
                action={{ label: 'Choisir une formule', onClick: () => openPlans() }}
              />
            </ListCard>
          )}

          {purchases.length > 0 && (
            <>
              <div className="ui-section-title">
                <h2>Achats à l’unité</h2>
              </div>
              <ListCard label="Achats à l’unité">
                {purchases.map((p) => (
                  <ListRow
                    key={p.id}
                    leading={
                      <IconTile>
                        <BookOpen size={20} aria-hidden="true" />
                      </IconTile>
                    }
                    title={moduleTitle(catalog, p.itemId)}
                    meta={`${p.forUserId === user.id ? 'Contenu payant' : `Pour ${memberName(p.forUserId, people)}`} · ${shortDate(p.day)}`}
                    trailing={<span className="sb-amount tabular-nums">{formatCfa(p.amount)}</span>}
                  />
                ))}
              </ListCard>
            </>
          )}
        </>
      ) : (
        <ListCard label="Transactions">
          {transactions.length === 0 ? (
            <EmptyState title="Aucune transaction" text="Vos paiements et leurs reçus apparaîtront ici." />
          ) : (
            transactions.map((t) => (
              <ListRow
                key={t.id}
                leading={
                  <IconTile>
                    <Receipt size={20} aria-hidden="true" />
                  </IconTile>
                }
                title={t.label}
                meta={`${shortDate(t.day)} · ${t.detail ? `${t.detail} · ` : ''}${t.method}`}
                trailing={
                  <>
                    <span className="sb-amount tabular-nums">{formatCfa(t.amount)}</span>
                    <ActionMenu
                      label={`Plus d’actions pour le reçu ${t.id}`}
                      items={[
                        { label: 'Télécharger le reçu', icon: <Download size={16} aria-hidden="true" />, onSelect: () => downloadReceipt(t) },
                        { label: 'Modifier les détails du reçu', icon: <Pencil size={16} aria-hidden="true" />, onSelect: () => openReceipt(t) }
                      ]}
                    />
                  </>
                }
              />
            ))
          )}
        </ListCard>
      )}

      <p className="sb-demo">Démonstration : les paiements sont simulés, aucun argent n’est débité.</p>

      {/* Changer de formule / Choisir une formule : effet immédiat, nouvelle période de facturation */}
      <Modal
        open={planOpen}
        size="md"
        title={current ? 'Changer de formule' : 'Choisir une formule'}
        onClose={() => setPlanOpen(false)}
        footer={
          <>
            <button type="button" className="secondary ui-btn-sm" onClick={() => setPlanOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="primary ui-btn-sm"
              disabled={!chosen || chosen.price === null || choiceIsCurrent}
              onClick={confirmPlan}
            >
              {planLabel}
            </button>
          </>
        }
      >
        <div className="sb-modal">
          <RadioList
            name="sb-plan"
            legend="Formule"
            value={choice}
            onChange={setChoice}
            options={paidPlans.map((p) => ({
              value: p.id,
              label: `${p.name} · ${priceLabel(p)}${current?.offer.id === p.id ? ' · votre formule' : ''}`,
              hint: `${p.tagline} ${p.features.join(' · ')}.`
            }))}
          />
          {chosen && chosen.price !== null && !choiceIsCurrent && (
            <>
              <h3 className="sb-modal-label">Fréquence de facturation</h3>
              <RadioList
                name="sb-plan-cycle"
                legend="Fréquence de facturation"
                value={choiceCycle}
                onChange={setChoiceCycle}
                options={[
                  { value: 'monthly', label: `Mensuelle · ${formatCfa(cyclePrice(chosen, 'monthly'))} / mois` },
                  { value: 'annual', label: `Annuelle · ${formatCfa(cyclePrice(chosen, 'annual'))} / an`, hint: 'Deux mois offerts.' }
                ]}
              />
              <label className="ui-field">
                <span>Moyen de paiement (simulé)</span>
                <Select value={choiceMethod} onChange={(e) => setChoiceMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </label>
              <p className="sb-modal-note">
                {current
                  ? 'Le changement prend effet aujourd’hui : une nouvelle période de facturation commence.'
                  : 'Premier paiement aujourd’hui, puis à chaque échéance.'}
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Modifier la fréquence de facturation : à la prochaine échéance */}
      {current && (
        <Modal
          open={cycleOpen}
          size="sm"
          title="Modifier la fréquence de facturation"
          onClose={() => setCycleOpen(false)}
          footer={
            <>
              <button type="button" className="secondary ui-btn-sm" onClick={() => setCycleOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="primary ui-btn-sm"
                disabled={cycleChoice === cycle}
                onClick={() => {
                  writeSub(changeCycle(raw!, cycleChoice, today));
                  setCycleOpen(false);
                  setToast(`Facturation ${cycleChoice === 'annual' ? 'annuelle' : 'mensuelle'} à partir du ${shortDate(current.sub.nextDue!)}`);
                }}
              >
                Mettre à jour
              </button>
            </>
          }
        >
          <div className="sb-modal">
            <RadioList
              name="sb-cycle"
              legend="Fréquence de facturation"
              value={cycleChoice}
              onChange={setCycleChoice}
              options={[
                { value: 'monthly', label: `Mensuelle · ${formatCfa(cyclePrice(current.offer, 'monthly'))} / mois` },
                { value: 'annual', label: `Annuelle · ${formatCfa(cyclePrice(current.offer, 'annual'))} / an`, hint: 'Deux mois offerts.' }
              ]}
            />
            <p className="sb-modal-note">La nouvelle fréquence s’applique à la prochaine facturation, le {longDate(current.sub.nextDue!)}.</p>
          </div>
        </Modal>
      )}

      {/* Changer de moyen de paiement : pour les prochaines échéances */}
      {current && (
        <Modal
          open={methodOpen}
          size="sm"
          title="Changer de moyen de paiement"
          onClose={() => setMethodOpen(false)}
          footer={
            <>
              <button type="button" className="secondary ui-btn-sm" onClick={() => setMethodOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="primary ui-btn-sm"
                disabled={methodChoice === current.sub.method}
                onClick={() => {
                  writeSub(changeMethod(raw!, methodChoice, today));
                  setMethodOpen(false);
                  setToast(`Moyen de paiement mis à jour : ${methodChoice}`);
                }}
              >
                Confirmer les changements
              </button>
            </>
          }
        >
          <div className="sb-modal">
            <label className="ui-field">
              <span>Moyen de paiement (simulé)</span>
              <Select value={methodChoice} onChange={(e) => setMethodChoice(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </label>
            <p className="sb-modal-note">Il servira à partir de la prochaine facturation, le {longDate(current.sub.nextDue!)}.</p>
          </div>
        </Modal>
      )}

      {/* Résilier : active jusqu'à la fin de la période payée */}
      {current && (
        <ConfirmDialog
          open={cancelOpen}
          title="Résilier votre abonnement ?"
          text={`Votre formule ${current.offer.name} reste active jusqu’au ${longDate(current.sub.nextDue!)}, puis votre compte revient à l’offre gratuite. ${CANCEL_CONSEQUENCE[audience]} Aucun nouveau prélèvement.`}
          confirmLabel="Confirmer la résiliation"
          danger
          onCancel={() => setCancelOpen(false)}
          onConfirm={() => {
            writeSub(cancel(raw!, today));
            setCancelOpen(false);
            setToast(`Abonnement résilié : la formule ${current.offer.name} reste active jusqu’au ${shortDate(current.sub.nextDue!)}`);
          }}
        />
      )}

      {/* Modifier les détails du reçu : ce reçu seulement */}
      <Modal
        open={Boolean(receipt)}
        size="sm"
        title="Modifier les détails du reçu"
        onClose={() => setReceipt(null)}
        footer={
          <>
            <button type="button" className="secondary ui-btn-sm" onClick={() => setReceipt(null)}>
              Annuler
            </button>
            <button type="submit" form="sb-receipt-form" className="primary ui-btn-sm" disabled={!receiptName.trim()}>
              Enregistrer
            </button>
          </>
        }
      >
        <form
          id="sb-receipt-form"
          className="sb-modal"
          onSubmit={(e) => {
            e.preventDefault();
            saveReceipt();
          }}
        >
          <label className="ui-field">
            <span>Nom ou raison sociale</span>
            <input value={receiptName} maxLength={80} onChange={(e) => setReceiptName(e.target.value)} />
          </label>
          <label className="ui-field">
            <span>Adresse (facultatif)</span>
            <input value={receiptAddress} maxLength={120} onChange={(e) => setReceiptAddress(e.target.value)} />
          </label>
          <label className="ui-field">
            <span>NIF (facultatif)</span>
            <input value={receiptTaxId} maxLength={30} onChange={(e) => setReceiptTaxId(e.target.value)} />
            <small>Numéro d’identification fiscale.</small>
          </label>
          <p className="sb-modal-note">Ces détails ne s’appliquent qu’au reçu {receipt?.id}.</p>
        </form>
      </Modal>
    </div>
  );
}
