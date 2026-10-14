# Protokół / Raport Wykonania Prac - WUWER

Aplikacja webowa (React + TypeScript + Vite + Tailwind CSS) służąca do generowania, ewidencjonowania i drukowania do formatu **PDF / A4** protokołów i raportów wykonania prac montażowych, serwisowych oraz delegacji dla **WUWER Sp. z o.o.**

## Główne funkcjonalności

- **Centralna synchronizacja numeracji dokumentów w chmurze (Google Firebase Firestore)**:
  - Unikalna, atomowa numeracja raportów (`KG/RR/XXX`).
  - Gwarancja braku zdublowanych numerów w firmie – każdy pracownik pobiera kolejny wolny numer z centralnej bazy.
  - Synchronizacja w czasie rzeczywistym u wszystkich użytkowników.
  - Automatyczny tryb zapasowy (offline) w razie braku połączenia z siecią.

- **Precyzyjny wydruk A4 i PDF**:
  - Poprawny szablon wydruku A4 (`@page { size: A4 portrait; margin: 10mm; }`).
  - Dokładne proporcje tabeli (100% szerokości, brak ucinania tekstu, automatyczne zawijanie wierszy).
  - Brak rozjeżdżania się komórek przy generowaniu PDF w przeglądarce (`Ctrl + P` / "Zapisz jako PDF").
  - Blok podpisów i podsumowania ze zabezpieczeniem przed niepożądanym łamaniem strony (`break-inside: avoid`).
  - Wbudowany tryb **Podgląd A4** na ekranie przed wydrukiem.

- **Automatyczne przeliczenia**:
  - Czas netto wierszy (z uwzględnieniem przerw w minutach i przejścia przez północ).
  - Sumowanie godzin dla Delegacji oraz Biura.
  - Sumowanie godzin Pracy oraz Podróży.
  - Automatyczne wyliczanie **nadgodzin** (> 8h pracy w jednym dniu roboczym).
  - Automatyczne rozpoznawanie sobót, niedziel oraz świąt ustawowych w Polsce (w tym algorytm wyznaczania Wielkanocy, Bożego Ciała itp.).

- **Zarządzanie raportami**:
  - Automatyczna numeracja w chmurze (`KG/RR/XXX`).
  - Zapisywanie wielu raportów w pamięci przeglądarki (`localStorage`).
  - Menedżer raportów: wyszukiwanie, duplikowanie, zmiana nazwy, historia wersji (do 20 wersji wstecz).
  - Eksport i import do plików **JSON**.
  - Eksport do plików **CSV (Excel)** z kodowaniem UTF-8 BOM.

- **Słowniki podpowiedzi**:
  - Autouzupełnianie pól: Wykonawcy, Zlecający, Funkcje / stanowiska, Miejsca prac, Pojazdy służbowe, Domyślne trasy, Noclegi.
  - Dynamiczne uczenie się nowych wartości wpisanych przez użytkownika.

- **Skróty klawiszowe**:
  - `Ctrl + S`: Szybki zapis raportu.
  - `Ctrl + P`: Drukuj / Zapisz jako PDF.
  - `Ctrl + Enter`: Dodaj kolejny wiersz.

## Uruchomienie deweloperskie

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev

# Zbudowanie wersji produkcyjnej
npm run build
```
