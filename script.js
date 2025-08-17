// Usa la URL que ya guardaste en config.js
// API_URL viene de <script src="config.js"></script>

// Calcula el próximo martes en formato YYYY-MM-DD
function nextTuesdayISO() {
  const d = new Date();
  const diff = (2 - d.getDay() + 7) % 7 || 7; // 2 = martes
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  const iso = d.toISOString().slice(0,10);
  return iso;
}

// Envía una reserva de PRUEBA (14:00–14:30 del próximo martes)
async function enviarEjemplo() {
  const payload = {
    date: nextTuesdayISO(),
    start: "14:00",
    end: "14:30",
    parentName: "Familia de prueba"
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    alert("Respuesta del servidor: " + text);
  } catch (err) {
    alert("Error al enviar: " + err.message);
  }
}

// Si existe el botón #btnDemo, lo conectamos
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("btnDemo");
  if (b) b.addEventListener("click", enviarEjemplo);
});
