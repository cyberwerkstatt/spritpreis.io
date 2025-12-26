const API_BASE = "https://api.e-control.at/sprit/1.0";

// 1. GPS Position abrufen
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchPrices(pos.coords.latitude, pos.coords.longitude);
      },
      () => alert("GPS Zugriff verweigert.")
    );
  }
}

// 2. Suche via Ortsname (Geocoding über Nominatim)
async function getPricesByCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`
  );
  const data = await res.json();
  if (data.length > 0) {
    fetchPrices(data[0].lat, data[0].lon);
  } else {
    alert("Ort nicht gefunden.");
  }
}

// 3. E-Control API abfragen
async function fetchPrices(lat, lon) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = '<p class="text-center">Lade Preise...</p>';

  try {
    const res = await fetch(
      `${API_BASE}/search/gas-stations/by-address?latitude=${lat}&longitude=${lon}&fuelType=DIE&includeClosed=false`
    );
    const stations = await res.json();
    renderStations(stations);
    updateSyncInfo();
  } catch (err) {
    resultsDiv.innerHTML =
      '<p class="text-red-500 text-center">Fehler beim Laden der Daten.</p>';
  }
}

// 4. Anzeige rendern
function renderStations(stations) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  stations.slice(0, 10).forEach((s) => {
    const price = s.prices[0]?.amount.toFixed(3) || "N/A";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${s.location.latitude},${s.location.longitude}`;

    resultsDiv.innerHTML += `
                    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-600">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-bold text-gray-800 text-lg">${s.name}</h3>
                                <p class="text-sm text-gray-500">${s.location.address}, ${s.location.city}</p>
                            </div>
                            <div class="text-right">
                                <span class="text-xl font-bold text-blue-700">${price}€</span>
                            </div>
                        </div>
                        <a href="${mapsUrl}" target="_blank" class="mt-3 block text-center bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm font-medium transition">
                            <i class="fas fa-directions mr-1 text-blue-600"></i> Auf Karte zeigen
                        </a>
                    </div>
                `;
  });
}

// 5. Monitoring (Sync Zeit)
async function updateSyncInfo() {
  try {
    const res = await fetch(`${API_BASE}/monitoring`);
    const text = await res.text();
    // Da wir wissen, dass die API Text/HTML liefert, suchen wir das Datum manuell
    const dateMatch = text.match(/Date:\s*([\d\-T\:\.]+)/);
    if (dateMatch) {
      document.getElementById(
        "syncInfo"
      ).innerText = `Datenstand: ${dateMatch[1]
        .split(".")[0]
        .replace("T", " ")} (UTC)`;
    }
  } catch (e) {}
}
