/**
 * Petites règles d'écriture du français pour les textes composés avec un nom.
 */

/** « de Kokou », « d’Elom », « d’Afi » : élision devant une voyelle ou un h. */
export const ofName = (name: string): string => (/^[aeiouyhàâäéèêëîïôöûüù]/i.test(name) ? `d’${name}` : `de ${name}`);
