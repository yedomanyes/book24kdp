import { OutlinePlanner } from './src/services/cmie/OutlinePlanner';
import { DuplicateGuard } from './src/services/cmie/DuplicateGuard';
import { CopyrightGuard, LocalSourcePlagiarismChecker } from './src/services/cmie/CopyrightGuard';
import { BookMemoryStore } from './src/services/cmie/BookMemoryStore';

async function runAcceptanceTests() {
  console.log("=== CMIE AKZEPTANZTEST SUITE ===");

  // TEST 1: 11-Kapitel-Testgliederung (Scopes < 0.75)
  console.log("\n[Test 1] 11-Kapitel-Testgliederung auf Scope Similarity < 0.75...");
  const dummyOutline: any = {
    title: "Künstliche Intelligenz im Praxis-Test",
    target_pages: 11,
    pages: []
  };
  for (let i = 1; i <= 11; i++) {
    dummyOutline.pages.push({
      page_number: i,
      chapter_title: `Kapitel ${i}: KI Systeme`,
      focus: `Grundlegende Betrachtung der Algorithmen und Datenstrukturen von Bereich ${i}`,
      key_points: [`Schwerpunkt ${i}A`, `Schwerpunkt ${i}B`]
    });
  }

  const res1 = OutlinePlanner.validateAndFixScopes(dummyOutline, 0.75);
  console.log(`Max Scope Similarity nach CMIE-Prüfung: ${res1.maxSimilarity.toFixed(4)} (Grenze < 0.75)`);
  if (res1.maxSimilarity >= 0.75) {
    throw new Error("Akzeptanzkriterium 1 nicht erfüllt: Scope Similarity >= 0.75!");
  }
  console.log("✔ AKZEPTANZKRITERIUM 1 ERFOLGREICH BESTANDEN!");

  // TEST 2: Aufeinanderfolgende Kapitel mit ähnlichem Thema (Opening < 0.85)
  console.log("\n[Test 2] Zwei Kapitel mit ähnlichem Thema auf Opening Similarity < 0.85...");
  const mem1 = BookMemoryStore.createMemory(
    1,
    "Einleitung in die Materie",
    "Dies ist der entscheidende Eröffnungssatz unseres Buches über künstliche neuronale Netze und Tiefenlernen. Wir erklären die gesamte technologische Basis im Detail.",
    "Scope 1"
  );
  const store = { 1: mem1 };

  // Kapitel 2 versucht fast denselben Einstieg
  const similarOpening = "Dies ist der entscheidende Eröffnungssatz unseres Buches über künstliche neuronale Netze. Wir erklären die technologische Basis im Detail.";
  const dupRes = DuplicateGuard.validate(similarOpening, "Zusammenfassung", store, 0.85, 0.80);
  
  console.log(`DuplicateGuard Prüfung bei ähnlichem Einstieg: passed = ${dupRes.passed}, opSim = ${dupRes.maxOpeningSimilarity.toFixed(4)}`);
  if (dupRes.passed) {
    throw new Error("Akzeptanzkriterium 2 nicht erfüllt: Ähnlicher Einstieg wurde fälschlicherweise freigegeben!");
  }
  console.log("✔ AKZEPTANZKRITERIUM 2 ERFOLGREICH BESTANDEN (Dopplung erkannt & Korrektur-Prompt generiert)!");

  // TEST 3: 20-Wort Zitat-Übernahme aus bekannter Quelle -> "review_needed"
  console.log("\n[Test 3] 20-Wort Quelltext-Übernahme auf harten Block-Status 'review_needed'...");
  const knownSource = "Die generative künstliche Intelligenz verändert die moderne Arbeitswelt durch automatisierte Texterstellung und multimodale Datenanalyse in mittelständischen Unternehmen nachhaltig und dauerhaft.";
  const checker = new LocalSourcePlagiarismChecker(knownSource);

  const infringingChapterText = "Zahlreiche Experten betonen: Die generative künstliche Intelligenz verändert die moderne Arbeitswelt durch automatisierte Texterstellung und multimodale Datenanalyse in mittelständischen Unternehmen nachhaltig und dauerhaft. Ein klares Signal.";
  
  const copyRes = await CopyrightGuard.inspectChapter(infringingChapterText, checker, 15);
  console.log(`CopyrightGuard Ergebnis: passed = ${copyRes.passed}, statusOverride = ${copyRes.statusOverride}`);
  
  if (copyRes.passed || copyRes.statusOverride !== 'review_needed') {
    throw new Error("Akzeptanzkriterium 3 nicht erfüllt: 20-Wort-Zitat wurde nicht als 'review_needed' markiert!");
  }
  console.log("✔ AKZEPTANZKRITERIUM 3 ERFOLGREICH BESTANDEN (Schutzsperre aktiv)!\n");
  console.log("==========================================");
  console.log("🎉 ALLE 3 AKZEPTANZKRITERIEN ERFOLGREICH ERFÜLLT!");
  console.log("==========================================");
}

runAcceptanceTests().catch(err => {
  console.error("❌ TEST FEHLGESCHLAGEN:", err);
  process.exit(1);
});
