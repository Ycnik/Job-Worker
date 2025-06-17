type KreditDaten = {
  name: string;
  schufascore: number; // 0 - 100 (100 = sehr gut)
  insolvenz: boolean;
  kreditsumme: number;
  vermoegen: number;
  verbindlichkeiten: number;
  laufzeit: number; // in Monaten
  einkommen: number;
};

function bewerteKreditRisiko(daten: KreditDaten): number {
  let risiko = 1;

  // 1. Insolvenz
  if (daten.insolvenz) return 5;

  // 2. Schufa-Score
  if (daten.schufascore < 50) risiko += 3;
  else if (daten.schufascore < 75) risiko += 2;
  else if (daten.schufascore < 90) risiko += 1;

  // 3. Verhältnis Vermögen zu Verbindlichkeiten
  const vermögensQuote = daten.vermoegen / (daten.verbindlichkeiten + 1); // +1 um Division durch 0 zu vermeiden
  if (vermögensQuote < 2) risiko += 1;
  if (vermögensQuote < 1) risiko += 1;

  // 4. Kreditbelastung im Vergleich zum Vermögen
  const kreditLastQuote = daten.kreditsumme / (daten.vermoegen + 1);
  if (kreditLastQuote > 0.75) risiko += 1;
  if (kreditLastQuote > 1.0) risiko += 1;

  // 5. Laufzeit berücksichtigen (lange Laufzeit = höheres Risiko)
  if (daten.laufzeit > 60) risiko += 1;
  else if (daten.laufzeit > 36) risiko += 0.5;

  return Math.min(5, Math.round(risiko));
}
