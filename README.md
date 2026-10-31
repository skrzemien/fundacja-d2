# Sztuczna inteligencja – ćwiczenia praktyczne

Interaktywne ćwiczenia do modułu 3 kursu „Kompetencje cyfrowe i bezpieczeństwo online” (InvertArt IFG).
Osiemnaście ćwiczeń z punktacją w dwóch częściach (każda około 60 minut, razem maksymalnie 450 punktów) oraz część „Zapytania do wypróbowania” z 18 gotowymi zapytaniami do prawdziwego czatu AI.

Materiał jest przygotowany dla dorosłych osób z Ukrainy, które wracają na rynek pracy w Polsce: prosty język polski (ok. B1), formy neutralne płciowo, przykłady z szukania pracy, pracy, urzędów i nauki polskiego.

**Część 1: Podstawy**

| Nr | Ćwiczenie | Forma |
|---|---|---|
| 1 | Gdzie jest sztuczna inteligencja? | sortowanie narzędzi |
| 2 | Jak działa czat AI | quiz |
| 3 | Budowa dobrego polecenia | składanie polecenia z elementów |
| 4 | Które polecenie jest lepsze? | porównywanie par |
| 5 | Co dopisać do polecenia? | quiz |
| 6 | Sprawdzanie odpowiedzi AI | wyłapywanie zmyśleń w tekście |
| 7 | Co można wkleić do czatu? | sortowanie |
| 8 | AI w codziennej pracy | quiz: Excel, PDF, grafika, przepisy |
| 9 | Rozmowa krok po kroku | symulacja rozmowy z czatem |
| – | Zapytania do wypróbowania | 18 zapytań w 4 kategoriach: szukanie pracy, w pracy, prywatnie i w urzędzie, nauka polskiego; edytowalne pola, przycisk kopiowania, wskazówki bezpieczeństwa |

**Część 2: AI w praktyce**

| Nr | Ćwiczenie | Forma |
|---|---|---|
| 10 | AI czy specjalista? | sortowanie spraw |
| 11 | Sprawdzanie odpowiedzi o Excelu | wyłapywanie zmyśleń w tekście |
| 12 | Prywatność w czacie AI | quiz |
| 13 | Oszustwa z użyciem AI | ocena ogłoszeń i wiadomości (fałszywe oferty pracy, deepfake, podrobiony głos) |
| 14 | Ton i styl wiadomości | quiz: polskie formy grzecznościowe |
| 15 | Rozmowa krok po kroku: SMS | symulacja rozmowy z czatem |
| 16 | Budowa polecenia: umowa i ogłoszenie | składanie polecenia z elementów |
| 17 | Wiarygodne źródła | quiz: ISAP, praca.gov.pl, KRAZ, ZUS, urząd wojewódzki |
| 18 | Uczciwe korzystanie z AI | quiz: CV, prawa autorskie, deepfake, odpowiedzialność |


Ćwiczenia nie łączą się z żadnym narzędziem AI — odpowiedzi czatu to przygotowane przykłady. Strona jest napisana w czystym HTML, CSS i JavaScript, bez bibliotek i zewnętrznych zasobów, i działa także offline.

## Struktura

```
index.html          strona główna
assets/style.css    wygląd (tryb jasny i ciemny)
assets/script.js    logika i treść ćwiczeń
.nojekyll           wyłącza przetwarzanie Jekyll na GitHub Pages
```

## Publikacja na GitHub Pages

1. Utwórz nowe repozytorium, np. `cwiczenia-ai`.
2. Wgraj zawartość folderu: **Add file → Upload files**, potem **Commit changes**.
3. **Settings → Pages → Deploy from a branch**, gałąź **main**, folder **/ (root)**, **Save**.
4. Po 1–2 minutach strona będzie pod adresem `https://NAZWA-UZYTKOWNIKA.github.io/cwiczenia-ai/`

## Uwagi

- Wyniki zapisują się lokalnie w przeglądarce uczestnika (localStorage).
- Treść ćwiczeń jest w `assets/script.js`: `WHERE`, `QHOW`, `BUILD`, `QAB`, `QFIX`, `ANSWER`, `PASTE`, `QUSE`, `CHAT1` (część 1) oraz `WHO`, `ANSWER2`, `QPRIV`, `QSCAM`, `QTONE`, `CHAT2`, `BUILD2`, `QSRC`, `QETH` (część 2), a zapytania do wypróbowania w tablicy `LIB`. Pola do uzupełnienia zapisuje się w szablonie jako `{Nazwa pola|tekst domyślny}`.
- Do części „Zapytania do wypróbowania” uczestnicy potrzebują konta w wybranym czacie AI.
- Ćwiczenie 6 opiera się na przepisach o urlopie wypoczynkowym z Kodeksu pracy (tablica `ANSWER`), a ćwiczenie 13 na zasadach działania agencji zatrudnienia. Jeśli przepisy się zmienią, zaktualizuj te treści.
