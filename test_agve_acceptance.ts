import { NecessityDetector } from './src/services/graphics/NecessityDetector';

async function runAgveTests() {
  console.log("=== AGVE AKZEPTANZTESTS START ===");

  // TEST 1: Dichtesteuerung & Prompt-Generierung
  const promptStrict = NecessityDetector.buildAnalysisPrompt("Beispieltext", 1);
  if (!promptStrict.includes("SEHR STRENG")) {
    throw new Error("Test 1 Fehlgeschlagen: Strikte Dichtekontrolle fehlt im Prompt!");
  }
  const promptGen = NecessityDetector.buildAnalysisPrompt("Beispieltext", 8);
  if (!promptGen.includes("GROSSZÜGIGER")) {
    throw new Error("Test 1b Fehlgeschlagen: Großzügige Dichtekontrolle fehlt im Prompt!");
  }
  console.log("✔ Test 1 Bestanden: Dichte-Prompting reagiert autonom auf Seitenabstände.");

  // TEST 2: JSON Parsing & Anti-Halluzination Guard
  const validTableJson = JSON.stringify({
    grafik_sinnvoll: true,
    typ: "tabelle",
    titel: "Vergleich KDP Buchformate",
    spalten: ["Format", "Vorteil"],
    zeilen: [["6x9", "Standard"], ["8.5x11", "Viel Platz"]]
  });
  const resValid = NecessityDetector.parseAndValidateDecision(validTableJson, "Kapiteltext");
  if (!resValid.grafik_sinnvoll || resValid.typ !== 'tabelle') {
    throw new Error("Test 2 Fehlgeschlagen: Valides Tabellen-JSON wurde nicht korrekt geparst!");
  }

  const invalidProcessJson = JSON.stringify({
    grafik_sinnvoll: true,
    typ: "prozess",
    titel: "Halluzinierter Prozess",
    schritte: ["Nur ein Schritt"] // Zu wenig Schritte!
  });
  const resInvalid = NecessityDetector.parseAndValidateDecision(invalidProcessJson, "Kapiteltext");
  if (resInvalid.grafik_sinnvoll) {
    throw new Error("Test 2b Fehlgeschlagen: Halluzinierter/inkompletter Prozess wurde nicht blockiert!");
  }
  console.log("✔ Test 2 Bestanden: Anti-Halluzinations-Parser schützt vor fehlerhaften KI-Grafiken.");

  // TEST 3: Dichteberechnung im Store
  const dummyStore = {
    2: { grafik_sinnvoll: true, typ: 'tabelle' as const },
    5: { grafik_sinnvoll: false }
  };
  const dist = NecessityDetector.evaluateDensityPlacement(6, dummyStore);
  if (dist !== 4) { // 6 - 2 = 4
    throw new Error(`Test 3 Fehlgeschlagen: Abstand berechnet als ${dist} statt 4!`);
  }
  console.log("✔ Test 3 Bestanden: Platzierungs-Algorithmus ermittelte exakten 4-Seiten-Abstand.");

  console.log("=== ALLE AGVE AKZEPTANZTESTS ERFOLGREICH ===");
}

runAgveTests().catch(e => {
  console.error(e);
  process.exit(1);
});
