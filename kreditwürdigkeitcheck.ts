// Typen definieren und exportieren

export interface Vermoegen {
  sparguthaben: number;
  immobilienwert: number;
  wertpapiere: number;
}

export interface Verbindlichkeiten {
  laufende_kredite: number;
  kreditkartenschulden: number;
  sonstige_fixkosten: number;
}

export interface FinanzielleSituation {
  einkommen_monatlich: number;
  vermoegen: Vermoegen;
  verbindlichkeiten: Verbindlichkeiten;
}

export interface Bonitaetsauskunft {
  schufa_score: number;
  zahlungsverzoegerungen: number;
  mahnverfahren: boolean;
  inkasso_faelle: boolean;
  insolvenz: boolean;
}

export interface Kreditinformationen {
  gewunschte_kreditsumme: number;
  laufzeit_monate: number;
  verwendungszweck: string;
}

export interface KreditDaten {
  finanzielle_situation: FinanzielleSituation;
  bonitaetsauskunft: Bonitaetsauskunft;
  kreditinformationen: Kreditinformationen;
}

export interface KreditPruefungErgebnis {
  kreditWuerdig: boolean;
  gruende: {
    einkommenOK: boolean;
    schufaOK: boolean;
    keineNegativmerkmale: boolean;
    vermoegenOK: boolean;
  };
}

// Funktion exportieren

export function pruefeKreditwuerdigkeit(daten: KreditDaten): KreditPruefungErgebnis {
  const einkommen = daten.finanzielle_situation.einkommen_monatlich;
  const verbindlichkeiten = daten.finanzielle_situation.verbindlichkeiten;
  const vermoegen = daten.finanzielle_situation.vermoegen;
  const schufaScore = daten.bonitaetsauskunft.schufa_score;
  const hatNegativeMerkmale =
    daten.bonitaetsauskunft.zahlungsverzoegerungen > 0 ||
    daten.bonitaetsauskunft.mahnverfahren ||
    daten.bonitaetsauskunft.inkasso_faelle ||
    daten.bonitaetsauskunft.insolvenz;

  const kreditSumme = daten.kreditinformationen.gewunschte_kreditsumme;
  const laufzeit = daten.kreditinformationen.laufzeit_monate;

  // Monatliche Kreditrate (vereinfachte Annahme ohne Zinsen)
  const monatlicheRate = kreditSumme / laufzeit;

  // Summe der monatlichen Fixkosten + Kreditrate
  const gesamtBelastung = verbindlichkeiten.sonstige_fixkosten + monatlicheRate;

  // Prüfkriterien
  const istEinkommenAusreichend = einkommen > gesamtBelastung * 2;
  const istSchufaGut = schufaScore >= 90;
  const hatGenugVermoegen = (vermoegen.sparguthaben + vermoegen.wertpapiere) >= kreditSumme / 2;

  // Entscheidung
  const kreditWuerdig = istEinkommenAusreichend && istSchufaGut && !hatNegativeMerkmale && hatGenugVermoegen;

  return {
    kreditWuerdig,
    gruende: {
      einkommenOK: istEinkommenAusreichend,
      schufaOK: istSchufaGut,
      keineNegativmerkmale: !hatNegativeMerkmale,
      vermoegenOK: hatGenugVermoegen,
    },
  };
}
