

export interface KreditDaten {
  daten: {
    finanzielle_situation: {
      einkommen_monatlich: number;
      vermoegen: {
        sparguthaben: number;
        immobilienwert: number;
        wertpapiere: number;
      };
      verbindlichkeiten: {
        laufende_kredite: number;
        kreditkartenschulden: number;
        sonstige_fixkosten: number;
      };
    };
    bonitaetsauskunft: {
      schufa_score: number;
      zahlungsverzoegerungen: number;
      mahnverfahren: boolean;
      inkasso_faelle: boolean;
      insolvenz: boolean;
    };
    kreditinformationen: {
      gewunschte_kreditsumme: number;
      laufzeit_monate: number;
      verwendungszweck: string;
    };
  };
}

// Funktion exportieren

export function pruefeKreditwuerdigkeit(): boolean {


  const axios = require('axios');
  const response = axios.get('http://localhost:3001/daten');
  const daten = response.data;
  const einkommen = daten.einkommen;
  const verbindlichkeiten = daten.verbindlichkeiten;
  const vermoegen = daten.vermoegen;
  const schufaScore = daten.schufa_score;

  // Überprüfen auf negative Merkmale in der Bonitätsauskunft
  const hatNegativeMerkmale =
    !daten.insolvenz &&
    daten.schufascore > 65;

  // Kreditinformationen
  const kreditSumme = daten.daten.kreditinformationen.gewunschte_kreditsumme;
  const laufzeit = daten.daten.kreditinformationen.laufzeit_monate;

  // Monatliche Kreditrate (vereinfachte Annahme ohne Zinsen)
  const monatlicheRate = kreditSumme / laufzeit;

  // Summe der monatlichen Fixkosten + Kreditrate
  const gesamtBelastung = verbindlichkeiten.sonstige_fixkosten + monatlicheRate;

  // Prüfkriterien
  const istEinkommenAusreichend = einkommen > gesamtBelastung * 2;
  const istSchufaGut = schufaScore >= 90;
  const hatGenugVermoegen = (vermoegen.sparguthaben + vermoegen.wertpapiere) >= kreditSumme / 2;

  // Rückgabe der Entscheidung (true oder false)
  return istEinkommenAusreichend && istSchufaGut && !hatNegativeMerkmale && hatGenugVermoegen;
}
