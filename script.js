document.addEventListener("DOMContentLoaded", function () {
  // Funkcja pomocnicza do przetwarzania strony PDF i wykrywania kodu QR
  function processPage(page, fileName) {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    let viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    let renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    page.render(renderContext).promise.then(function () {
      // Konwersja zawartości canvas na obraz
      let imageData = context.getImageData(
        0,
        0,
        viewport.width,
        viewport.height
      );
      // Wykorzystanie biblioteki jsQR do odczytania kodu QR z obrazu
      let code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // Sprawdzenie, czy kod QR już istnieje w bazie danych
        checkQRCodeExists(code.data, fileName);
      } else {
        showAlert("Błąd", "Kod QR nie został znaleziony w tym pliku.");
      }
    });
  }

  // Funkcja do sprawdzenia, czy kod QR już istnieje w bazie danych
  function checkQRCodeExists(qrData, fileName) {
    let formData = new FormData(document.getElementById("upload-form"));
    formData.append("qrData", qrData); // Dodanie danych kodu QR do formularza

    fetch("process_qr.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.exists) {
          // Opcja podmiany istniejącego dokumentu
          Swal.fire({
            title: "Kod QR już istnieje w bazie danych.",
            text: "Czy chcesz go podmienić?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Tak",
            cancelButtonText: "Anuluj",
          }).then((result) => {
            if (result.isConfirmed) {
              uploadFormData(qrData, fileName); // Kontynuacja z podmianą
            }
          });
        } else {
          uploadFormData(qrData, fileName); // Kontynuacja, jeśli kod QR nie istnieje
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        showAlert("Błąd", "Wystąpił problem z połączeniem z serwerem.");
      });
  }

  // Funkcja do przesyłania danych formularza do PHP za pomocą Fetch API
  function uploadFormData(qrData, fileName) {
    let formData = new FormData(document.getElementById("upload-form"));
    formData.append("qrData", qrData);
    formData.append("fileName", fileName);

    fetch("process_qr.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showAlert("Błąd", data.error);
        } else {
          showAlert("Sukces", "Dodano kod QR: " + qrData + " do bazy danych.");
          // Tutaj również wyczyść pole formularza
          document.getElementById("pdf_file").value = "";
          if (document.getElementById("manualQRCode")) {
            document.getElementById("manualQRCode").value = ""; // Wyczyść, jeśli istnieje
          }
        }
      })
      .catch((error) => {
        showAlert("Błąd", "Wystąpił problem podczas przesyłania danych.");
        console.error("Fetch error:", error);
      });
  }

  function showAlert(title, message) {
    if (title === "Błąd" && message.includes("Kod QR nie został znaleziony")) {
      Swal.fire({
        title: title,
        text: message,
        icon: "error",
        showCancelButton: true,
        confirmButtonText: "Wprowadź kod QR ręcznie",
        cancelButtonText: "Anuluj",
      }).then((result) => {
        if (result.isConfirmed) {
          // Pokaż formularz do ręcznego wprowadzenia kodu QR
          document.getElementById("manualEntry").style.display = "block";
          document.getElementById("manualQRCode").focus();
        }
      });
    } else {
      Swal.fire({
        title: title,
        text: message,
        icon: "info",
        confirmButtonText: "OK",
      });
    }
  }

  //wpisywanie manualne kodu QR
  window.manualQRSubmit = function () {
    const manualQRCodeInput = document.getElementById("manualQRCode");
    const manualQRCode = manualQRCodeInput.value;
    if (manualQRCode) {
      checkQRCodeExists(manualQRCode, "manualInput");
      manualQRCodeInput.value = ""; // Wyczyszczanie pola input po użyciu wartości
      document.getElementById("manualEntry").style.display = "none"; // Ukrywanie formularza
    } else {
      Swal.fire("Błąd", "Pole kodu QR nie może być puste.", "error");
    }
  };

  document
    .getElementById("upload-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const pdfFile = document.getElementById("pdf_file").files[0];

      // Sprawdź, czy plik istnieje i czy ma rozszerzenie PDF
      if (pdfFile && /\.pdf$/i.test(pdfFile.name)) {
        let reader = new FileReader();

        reader.onload = function (e) {
          let typedarray = new Uint8Array(e.target.result);

          pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            // Kontynuacja logiki przetwarzania PDF
            pdf.getPage(1).then((page) => {
              processPage(page, pdfFile.name);
            });
          });
        };

        reader.readAsArrayBuffer(pdfFile);
      } else {
        // Wyświetl ostrzeżenie, jeśli plik nie jest PDF
        showAlert("Błąd", "Proszę wybrać plik w formacie PDF.");
      }
    });
});
