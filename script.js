// Nasłuchiwanie na załadowanie całego DOMu
document.addEventListener("DOMContentLoaded", function () {
  // Funkcja do przetwarzania pojedynczej strony PDF i wykrywania kodu QR
  function processPage(page, fileName) {
    // Tworzenie elementu canvas, aby na nim renderować stronę PDF
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    let viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Obiekt kontekstu renderowania dla strony PDF
    let renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Renderowanie strony PDF na canvas
    page.render(renderContext).promise.then(function () {
      // Pobranie danych obrazu z canvas
      let imageData = context.getImageData(
        0,
        0,
        viewport.width,
        viewport.height
      );
      // Dekodowanie kodu QR z obrazu za pomocą biblioteki jsQR
      let code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // Jeśli kod QR zostanie znaleziony, sprawdź jego obecność w bazie danych
        checkQRCodeExists(code.data, fileName);
      } else {
        // Jeśli kod QR nie zostanie znaleziony, pokaż alert
        showAlert("Błąd", "Kod QR nie został znaleziony w tym pliku.");
      }
    });
  }

  // Sprawdzenie, czy kod QR już istnieje w bazie danych
  function checkQRCodeExists(qrData, fileName) {
    let formData = new FormData(document.getElementById("upload-form"));
    formData.append("qrData", qrData); // Dołączenie danych kodu QR do formularza

    // Wysłanie zapytania do serwera z danymi formularza
    fetch("process_qr.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.exists) {
          // Jeśli dokument istnieje, zapytaj o podmianę
          Swal.fire({
            title: "Kod QR już istnieje w bazie danych.",
            text: "Czy chcesz go podmienić?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Tak",
            cancelButtonText: "Anuluj",
          }).then((result) => {
            if (result.isConfirmed) {
              uploadFormData(qrData, fileName); // Jeśli tak, kontynuuj z podmianą
            }
          });
        } else {
          uploadFormData(qrData, fileName); // Jeśli nie istnieje, kontynuuj z dodaniem
        }
      })
      .catch((error) => {
        // W przypadku błędu połączenia z serwerem, pokaż alert
        console.error("Fetch error:", error);
        showAlert("Błąd", "Wystąpił problem z połączeniem z serwerem.");
      });
  }

  // Funkcja do przesyłania formularza na serwer
  function uploadFormData(qrData, fileName) {
    let formData = new FormData(document.getElementById("upload-form"));
    formData.append("qrData", qrData);
    formData.append("fileName", fileName);

    // Wysyłanie danych na serwer
    fetch("process_qr.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          // Jeśli serwer zwróci błąd, pokaż go użytkownikowi
          showAlert("Błąd", data.error);
        } else {
          // Jeśli sukces, pokaż powiadomienie i wyczyść formularz
          showAlert("Sukces", "Dodano kod QR: " + qrData + " do bazy danych.");
          document.getElementById("pdf_file").value = ""; // Wyczyszczenie inputu pliku
          if (document.getElementById("manualQRCode")) {
            document.getElementById("manualQRCode").value = ""; // Wyczyszczenie manualnego wprowadzenia kodu QR, jeśli istnieje
          }
        }
      })
      .catch((error) => {
        // W przypadku błędu przesyłania, pokaż alert
        showAlert("Błąd", "Wystąpił problem podczas przesyłania danych.");
        console.error("Fetch error:", error);
      });
  }

  // Funkcja do wyświetlania alertów na stronie
  function showAlert(title, message) {
    if (title === "Błąd" && message.includes("Kod QR nie został znaleziony")) {
      // Jeśli kod QR nie został znaleziony, zaoferuj ręczne wprowadzenie
      Swal.fire({
        title: title,
        text: message,
        icon: "error",
        showCancelButton: true,
        confirmButtonText: "Wprowadź kod QR ręcznie",
        cancelButtonText: "Anuluj",
      }).then((result) => {
        if (result.isConfirmed) {
          // Jeśli użytkownik zdecyduje, pokaż ukryty formularz do ręcznego wprowadzenia
          document.getElementById("manualEntry").style.display = "block";
          document.getElementById("manualQRCode").focus();
        }
      });
    } else {
      // W pozostałych przypadkach po prostu pokaż alert
      Swal.fire({
        title: title,
        text: message,
        icon: "info",
        confirmButtonText: "OK",
      });
    }
  }

  // Obsługa manualnego wprowadzania kodu QR
  window.manualQRSubmit = function () {
    const manualQRCodeInput = document.getElementById("manualQRCode");
    const manualQRCode = manualQRCodeInput.value;
    if (manualQRCode) {
      // Jeśli kod QR został wprowadzony, sprawdź jego obecność w bazie danych
      checkQRCodeExists(manualQRCode, "manualInput");
      manualQRCodeInput.value = ""; // Wyczyszczenie pola po użyciu
      document.getElementById("manualEntry").style.display = "none"; // Ukrycie formularza
    } else {
      // Jeśli pole było puste, zwróć uwagę użytkownika
      Swal.fire("Błąd", "Pole kodu QR nie może być puste.", "error");
    }
  };

  // Obsługa wysyłania głównego formularza
  document
    .getElementById("upload-form")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Zapobieganie standardowemu zachowaniu wysyłania
      const pdfFile = document.getElementById("pdf_file").files[0];

      if (pdfFile && /\.pdf$/i.test(pdfFile.name)) {
        // Jeśli plik jest PDFem, kontynuuj jego przetwarzanie
        let reader = new FileReader();
        reader.onload = function (e) {
          let typedarray = new Uint8Array(e.target.result);
          pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            // Po wczytaniu PDF, przetwórz pierwszą stronę w celu wykrycia kodu QR
            pdf.getPage(1).then((page) => {
              processPage(page, pdfFile.name);
            });
          });
        };
        reader.readAsArrayBuffer(pdfFile); // Rozpoczęcie wczytywania pliku PDF
      } else {
        // Jeśli plik nie jest PDFem, poinformuj użytkownika
        showAlert("Błąd", "Proszę wybrać plik w formacie PDF.");
      }
    });
});
