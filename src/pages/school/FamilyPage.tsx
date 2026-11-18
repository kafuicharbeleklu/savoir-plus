/**
 * Espace famille d'un parent ou tuteur : pour chaque enfant, le message de la semaine, les chiffres
 * clés, le plan de révision et l'emploi du temps ; puis les codes qu'il crée et les contenus qu'il
 * achète pour eux (achat simulé).
 */
import React, { useState } from 'react';
import { BookOpen, KeyRound, Receipt } from 'lucide-react';
import { formatDayShort, type CalendarEvent, type RevisionPlan, type SessionLog } from '../../calendar';
import {
  PURCHASE_MESSAGE,
  accountOf,
  ageOn,
  buyItem,
  childrenOf,
  classesOfStudent,
  formatPrice,
  guardianCodeExpiry,
  guardianCodeStatus,
  hasAccess,
  institutionOf,
  issueGuardianCode,
  offeringInstitution,
  priceOf,
  slotsFor,
  GUARDIAN_CODE_DAYS
} from '../../school';
import { ActionMenu, EmptyState, IconTile, ListCard, ListRow, Modal, PageHeader, Select, StatusDot } from '../../components/ui';
import { ChildBoard, ChildCard, childSnapshot } from './FamilyBoard';
import { DeviceLockPanel, TimeRequestBanner } from './DeviceLockPanel';
import { lockApplies, requestOfDay, rulesOf } from '../../deviceLock';
import { PAYMENT_METHODS, familyTools } from '../../offers';
import { ofName } from '../../french';
import { dayFromDate } from '../../calendar';
import { FollowUpList, IdentityDot, authorIdOf, followUp, memberName, moduleTitle, plural, type SchoolPageProps } from './shared';

export interface ChildCalendar {
  events: CalendarEvent[];
  plan: RevisionPlan;
  log: SessionLog[];
}


export function FamilyPage({
  school,
  saveSchool,
  ext,
  user,
  people,
  today,
  catalog,
  selectedId,
  nav,
  setToast,
  calendarOf
}: SchoolPageProps & {
  /** Calendrier et plan de révision d'un enfant, tels qu'il les voit lui-même. */
  calendarOf: (uid: string) => ChildCalendar;
}) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [buying, setBuying] = useState<string | null>(null);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  const account = accountOf(school, user.id);
  const verified = account.identity === 'verified';
  const children = childrenOf(school, user.id);
  const codes = school.guardianCodes.filter((c) => c.guardianId === user.id);
  const purchases = school.purchases.filter((p) => p.buyerId === user.id);
  const child = children.find((id) => id === selectedId);
  // Formule Famille : plan de révision et emploi du temps des enfants, contenus payants inclus.
  const familyPlan = familyTools(ext.subscriptions, user.id);

  const classLine = (uid: string) => {
    const schoolClass = classesOfStudent(school, uid)[0];
    return schoolClass ? `${schoolClass.name} · ${institutionOf(school, schoolClass.institutionId)?.name || ''}` : 'Sans classe';
  };
  // Sur la carte d'un enfant de moins de 12 ans : SAVOIR+ en pause, ou une demande de temps à traiter.
  const lockNote = (uid: string) => {
    if (!lockApplies(school, uid, today)) return '';
    if (requestOfDay(school, uid, dayFromDate(new Date()))?.status === 'pending') return ' · demande plus de temps';
    return rulesOf(school, uid).lockedNow ? ' · SAVOIR+ en pause' : '';
  };
  const moduleIdsOf = (uid: string) => Array.from(new Set(classesOfStudent(school, uid).flatMap((c) => c.moduleIds)));

  /* ---------------------------------------------------------------- Un enfant */
  if (child) {
    const name = memberName(child, people);
    const firstName = name.split(' ')[0];
    const birth = accountOf(school, child).birthDate;
    const rows = moduleIdsOf(child).map((id) => followUp(ext, catalog, child, id));
    const calendar = calendarOf(child);
    const paid = catalog.filter((item) => priceOf(school, item.id) > 0);
    const buyingItem = paid.find((item) => item.id === buying);

    const confirmPurchase = () => {
      if (!buyingItem) return;
      const result = buyItem(school, user.id, child, buyingItem.id, today, method);
      setBuying(null);
      if (result.ok === false) {
        setToast(PURCHASE_MESSAGE[result.reason]);
        return;
      }
      saveSchool(result.school);
      setToast(`Achat simulé enregistré · reçu ${result.purchase.id}`);
    };

    return (
      <div className="sc-page">
        <PageHeader
          back={{ label: 'Espace famille', onClick: () => nav('family') }}
          title={name}
          subtitle={`${classLine(child)}${birth ? ` · ${ageOn(birth, today)} ans` : ''}`}
        />

        {lockApplies(school, child, today) && (
          <TimeRequestBanner school={school} saveSchool={saveSchool} childId={child} firstName={firstName} now={new Date()} setToast={setToast} />
        )}

        <ChildBoard
          name={name}
          rows={rows}
          calendar={calendar}
          slots={slotsFor(school, child)}
          people={people}
          today={today}
          planIncluded={familyPlan}
          onUpgrade={() => nav('settings', 'account/plan/family')}
        />

        {/* Moins de 12 ans : le parent règle le verrouillage de SAVOIR+ selon son besoin. */}
        {lockApplies(school, child, today) && (
          <DeviceLockPanel school={school} saveSchool={saveSchool} childId={child} firstName={firstName} now={new Date()} setToast={setToast} />
        )}

        <div className="ui-section-title">
          <h2>Modules de sa classe</h2>
        </div>
        <FollowUpList rows={rows} label={`Modules ${ofName(firstName)}`} />

        <div className="ui-section-title">
          <h2>Contenus payants</h2>
        </div>
        <ListCard label="Contenus payants">
          {paid.map((item) => {
            // Contenu d'un enseignant de son établissement : offert à l'enfant, rien à acheter.
            const offeredBy = offeringInstitution(school, child, authorIdOf(people, item));
            const owned = hasAccess(school, child, item.id);
            return (
              <ListRow
                key={item.id}
                leading={<IconTile tone={owned ? 'brand' : 'neutral'}>{<BookOpen size={20} aria-hidden="true" />}</IconTile>}
                title={item.title}
                meta={`${item.domain} · ${formatPrice(priceOf(school, item.id))}`}
                trailing={
                  offeredBy ? (
                    <StatusDot tone="info">Offert par {offeredBy.name}</StatusDot>
                  ) : owned ? (
                    <StatusDot tone="info">Acquis pour {firstName}</StatusDot>
                  ) : familyPlan ? (
                    <StatusDot tone="info">Inclus dans la formule Famille</StatusDot>
                  ) : (
                    <button type="button" className="li-text-link" onClick={() => setBuying(item.id)}>
                      Acheter
                    </button>
                  )
                }
              />
            );
          })}
        </ListCard>
        <p className="sc-note">Démonstration : le paiement est simulé, aucun argent n’est débité. Les prix ne sont jamais montrés à un enfant.</p>

        {buyingItem && (
          <Modal
            open
            size="sm"
            title="Acheter ce contenu"
            onClose={() => setBuying(null)}
            footer={
              <button type="button" className="primary ui-btn-sm" onClick={confirmPurchase}>
                Payer {formatPrice(priceOf(school, buyingItem.id))} (simulé)
              </button>
            }
          >
            <dl className="ui-facts">
              <div>
                <dt>Contenu</dt>
                <dd>{buyingItem.title}</dd>
              </div>
              <div>
                <dt>Pour</dt>
                <dd>{name}</dd>
              </div>
              <div>
                <dt>Prix</dt>
                <dd>{formatPrice(priceOf(school, buyingItem.id))}</dd>
              </div>
            </dl>
            <label className="ui-field">
              <span>Moyen de paiement</span>
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </label>
            <p className="cal-form-note">Démonstration : aucun paiement réel n’a lieu. Un reçu est ajouté à vos achats.</p>
          </Modal>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- Accueil de l'espace */
  const createCode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = issueGuardianCode(school, user.id, childName, today);
    if (result.ok === false) {
      setToast(result.reason === 'unverified' ? 'Faites vérifier votre identité avant de créer un code.' : 'Indiquez le prénom de l’enfant.');
      return;
    }
    saveSchool(result.school);
    setCodeOpen(false);
    setChildName('');
    setToast(`Code créé pour ${result.code.childName} : valable ${GUARDIAN_CODE_DAYS} jours`);
  };

  return (
    <div className="sc-page">
      <PageHeader title="Espace famille" />

      {/* Le bandeau n'apparaît que s'il y a quelque chose à faire. */}
      {!verified && (
        <section className="sc-status" aria-label="Votre statut">
          <IdentityDot status={account.identity} />
          <p>Tant que votre identité n’est pas vérifiée, vous consultez les contenus mais vous ne pouvez ni rattacher un enfant ni acheter pour lui.</p>
          <button type="button" className="li-text-link" onClick={() => nav('settings', 'account/verification')}>
            Faire vérifier mon identité
          </button>
        </section>
      )}

      <div className="ui-section-title">
        <h2>Mes enfants</h2>
      </div>
      {children.length === 0 ? (
        <ListCard label="Mes enfants">
          <EmptyState title="Aucun enfant rattaché" text="Créez un code, puis donnez-le à votre enfant : il le saisit à l’ouverture de son compte." />
        </ListCard>
      ) : (
        <div className="pl-children">
          {children.map((id) => {
            const name = memberName(id, people);
            const rows = moduleIdsOf(id).map((m) => followUp(ext, catalog, id, m));
            return <ChildCard key={id} name={name} classLine={`${classLine(id)}${lockNote(id)}`} snapshot={childSnapshot(name, rows, calendarOf(id), today)} onOpen={() => nav('family', id)} />;
          })}
        </div>
      )}

      <div className="ui-section-title">
        <h2>Codes</h2>
        <button type="button" className="li-text-link" disabled={!verified} onClick={() => setCodeOpen(true)}>
          Créer un code
        </button>
      </div>
      <ListCard label="Codes créés pour vos enfants">
        {codes.length === 0 ? (
          <EmptyState title="Aucun code créé" text="Un code sert une seule fois, pour un seul enfant." />
        ) : (
          codes.map((code) => {
            const status = guardianCodeStatus(code, today);
            return (
              <ListRow
                key={code.code}
                leading={<IconTile tone={status === 'valid' ? 'brand' : 'neutral'}>{<KeyRound size={20} aria-hidden="true" />}</IconTile>}
                title={<span className="sc-code">{code.code}</span>}
                meta={
                  status === 'valid'
                    ? `Pour ${code.childName} · valable jusqu’au ${formatDayShort(guardianCodeExpiry(code))}`
                    : status === 'used'
                      ? `Pour ${code.childName} · utilisé par ${memberName(code.usedBy || '', people)}`
                      : `Pour ${code.childName} · expiré le ${formatDayShort(guardianCodeExpiry(code))}`
                }
                trailing={
                  <>
                    <StatusDot tone={status === 'valid' ? 'info' : 'neutral'}>{status === 'valid' ? 'Valide' : status === 'used' ? 'Utilisé' : 'Expiré'}</StatusDot>
                    {status === 'valid' && (
                      <ActionMenu
                        label={`Plus d’actions pour le code de ${code.childName}`}
                        items={[
                          {
                            label: 'Copier le code',
                            onSelect: () => {
                              navigator.clipboard?.writeText(code.code).then(
                                () => setToast('Code copié'),
                                () => setToast(`Copie impossible : notez le code ${code.code}`)
                              );
                            }
                          }
                        ]}
                      />
                    )}
                  </>
                }
              />
            );
          })
        )}
      </ListCard>

      <div className="ui-section-title">
        <h2>Achats</h2>
      </div>
      <ListCard label="Vos achats">
        {purchases.length === 0 ? (
          <EmptyState title="Aucun achat" text="Les contenus payants se trouvent sur la fiche de chaque enfant." />
        ) : (
          purchases.map((purchase) => (
            <ListRow
              key={purchase.id}
              leading={<IconTile>{<Receipt size={20} aria-hidden="true" />}</IconTile>}
              title={moduleTitle(catalog, purchase.itemId)}
              meta={`${formatPrice(purchase.amount)} · pour ${memberName(purchase.forUserId, people)} · ${formatDayShort(purchase.day)} · reçu ${purchase.id}`}
              trailing={<StatusDot tone="neutral">Simulé</StatusDot>}
            />
          ))
        )}
      </ListCard>

      {codeOpen && (
        <Modal
          open
          size="sm"
          title="Créer un code"
          onClose={() => setCodeOpen(false)}
          footer={
            <button type="submit" form="sc-code-form" className="primary ui-btn-sm" disabled={!childName.trim()}>
              Créer le code
            </button>
          }
        >
          <form id="sc-code-form" className="cal-form" onSubmit={createCode}>
            <label className="ui-field">
              <span>Prénom de l’enfant</span>
              <input value={childName} maxLength={40} autoFocus onChange={(e) => setChildName(e.target.value)} />
              <small>Le code sert une seule fois et reste valable {GUARDIAN_CODE_DAYS} jours. L’enfant le saisit à l’ouverture de son compte.</small>
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
