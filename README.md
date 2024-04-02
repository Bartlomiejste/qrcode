# Aplikacja do przesyłania i przetwarzania dokumentów PDF z kodami QR

## Opis

Aplikacja webowa umożliwia użytkownikom przesyłanie dokumentów PDF, które zawierają kody QR. Po przesłaniu dokumentu, aplikacja automatycznie skanuje i dekoduje zawarty kod QR w celu uzyskania informacji o dokumencie. Użytkownik ma również możliwość ręcznego wprowadzenia kodu QR, jeśli automatyczne skanowanie się nie powiedzie.

## Główne Cechy

- Przesyłanie plików PDF przez interfejs użytkownika.
- Automatyczne skanowanie i dekodowanie kodów QR z przesłanych plików.
- Ręczne wprowadzanie kodu QR, gdy automatyczne skanowanie zawiedzie.
- Weryfikacja unikalności kodu QR w bazie danych.
- Możliwość podmiany istniejącego dokumentu.

## Użyte Biblioteki

- **PDF.js**: Biblioteka do renderowania plików PDF w przeglądarce.
- **jsQR**: Biblioteka do dekodowania kodów QR z obrazów.
- **SweetAlert2**: Biblioteka do wyświetlania estetycznych okien dialogowych.

## Wymagania

Aby uruchomić projekt lokalnie, potrzebujesz:

- Serwer HTTP, np. Apache lub Nginx.
- PHP w wersji 7.0 lub wyższej.
- Dowolna przeglądarka internetowa.

![baza](https://raw.githubusercontent.com/Bartlomiejste/qrcode/main/1.png)


## Instalacja i Uruchomienie

### Krok 1: Klonowanie Repozytorium

Otwórz terminal i wprowadź poniższą komendę, aby sklonować repozytorium:

```sh
git clone https://github.com/Bartlomiejste/qrcode.git

### Krok 2: Konfiguracja Serwera

Umieść sklonowany projekt w katalogu htdocs Twojego serwera Apache lub odpowiednim katalogu w przypadku innych serwerów.

### Krok 3: Uruchomienie Serwera

Uruchom serwer Apache/Nginx. Dla Apache w XAMPP, możesz to zrobić za pomocą Panelu Kontrolnego XAMPP.

### Krok 4: Dostęp do Aplikacji

Otwórz przeglądarkę i wprowadź adres URL do twojego projektu: http://localhost/qr
