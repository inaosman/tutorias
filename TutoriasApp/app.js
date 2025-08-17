// Utilidades de fechas
function formatISO(d){ return d.toISOString().slice(0,10); }
function esTuesday(d){ return d.getDay() === 2; } // 0=Dom, 1=Lun, 2=Mar...
function nextTuesday(from=new Date()){
  const d = new Date(from);
  const diff = (2 - d.getDay() + 7) % 7 || 7; // próximo martes (no hoy)
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }

// Generar lista de martes
const datesEl = document.getElementById('dates');
const slotsEl = document.getElementById('slots');
const statusEl = document.getElementById('status');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

let selectedDateISO = null;
let duration = 30;
document.querySelectorAll('input[name="duration"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    duration = parseInt(document.querySelector('input[name="duration"]:checked').value, 10);
    if(selectedDateISO) renderSlots(selectedDateISO);
  });
});

const t0 = nextTuesday(new Date());
const tuesdays = [];
for(let i=0;i<CONFIG.numWeeks;i++){
  tuesdays.push(addDays(t0, i*7));
}

tuesdays.forEach((d,i)=>{
  const btn = document.createElement('button');
  btn.className = 'date-btn' + (i===0?' active':'');
  const fmt = d.toLocaleDateString('es-ES', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
  btn.textContent = fmt;
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.date-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    selectedDateISO = formatISO(d);
    renderSlots(selectedDateISO);
  });
  datesEl.appendChild(btn);
  if(i===0){ selectedDateISO = formatISO(d); }
});

// Cargar estado de reservas desde el backend o demo
async function fetchDay(dateISO){
  if(CONFIG.apiBase){
    const url = CONFIG.apiBase + '?action=list&date=' + encodeURIComponent(dateISO);
    const res = await fetch(url);
    return res.json();
  }else{
    // DEMO: leer del JSON local si existiera, si no, respuesta vacía
    try{
      const res = await fetch('sample_data.json');
      const all = await res.json();
      return all[dateISO] || { date: dateISO, bookings: [] };
    }catch(e){
      return { date: dateISO, bookings: [] };
    }
  }
}

// Regla de negocio: slots válidos según duración
function validSlotsForDuration(){
  if(duration === 60){
    return [{start:'14:00', end:'15:00'}];
  }else{
    return [{start:'14:00', end:'14:30'},{start:'14:30', end:'15:00'}];
  }
}

// Renderizar los slots con su estado
async function renderSlots(dateISO){
  slotsEl.innerHTML = 'Cargando…';
  const data = await fetchDay(dateISO);
  const bookings = data.bookings || []; // {start,end,status:'pending'|'confirmed', name, student}
  const valid = validSlotsForDuration();

  slotsEl.innerHTML='';
  valid.forEach(slot=>{
    // Determinar estado: si hay una reserva que solape este slot
    const overlap = bookings.find(b =>
      (b.status === 'confirmed' || b.status === 'pending') &&
      !(b.end <= slot.start || b.start >= slot.end)
    );
    let state = 'free';
    if(overlap){
      state = overlap.status === 'confirmed' ? 'taken' : 'pending';
    }

    const row = document.createElement('div');
    row.className = 'slot';

    const left = document.createElement('div');
    left.className = 'left';
    const time = document.createElement('strong');
    time.textContent = slot.start + '–' + slot.end;
    const badge = document.createElement('span');
    badge.className = 'badge ' + (state==='free'?'free':state==='pending'?'pending':'taken');
    badge.textContent = state==='free'?'Libre':state==='pending'?'Pendiente':'Ocupada';
    left.appendChild(time);
    left.appendChild(badge);

    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = state==='free'? 'Solicitar' : 'No disponible';
    btn.disabled = state!=='free';
    btn.addEventListener('click', ()=> selectSlot(dateISO, slot));
    right.appendChild(btn);

    row.appendChild(left);
    row.appendChild(right);
    slotsEl.appendChild(row);
  });
}

// Selección de slot y envío
let selectedSlot = null;
function selectSlot(dateISO, slot){
  selectedSlot = {date: dateISO, start: slot.start, end: slot.end};
  statusEl.textContent = `Has seleccionado ${dateISO} · ${slot.start}–${slot.end}`;
}

const form = document.getElementById('requestForm');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!selectedSlot){
    statusEl.textContent = 'Elige primero una fecha y una hora.';
    return;
  }
  const fd = new FormData(form);
  if(!fd.get('consent')){
    statusEl.textContent = 'Debes aceptar el consentimiento.';
    return;
  }
  const payload = {
    date: selectedSlot.date,
    start: selectedSlot.start,
    end: selectedSlot.end,
    duration: duration,
    parentName: fd.get('parentName'),
    studentName: fd.get('studentName'),
    email: fd.get('email'),
    phone: fd.get('phone') || '',
    note: fd.get('note') || ''
  };

  // Validaciones extra: solo martes y dentro de 14:00–15:00 (ya garantizado por UI)
  const d = new Date(selectedSlot.date + "T00:00:00");
  if(d.getDay() !== 2){
    statusEl.textContent = 'Solo se admiten reservas en martes.';
    return;
  }

  try{
    if(CONFIG.apiBase){
      const res = await fetch(CONFIG.apiBase, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({action:'request', data: payload})
      });
      const out = await res.json();
      if(out.ok){
        statusEl.textContent = 'Reserva enviada. Queda PENDIENTE hasta confirmación por la tutora.';
        form.reset();
        selectedSlot = null;
        renderSlots(payload.date);
      }else{
        statusEl.textContent = out.message || 'No se pudo completar la reserva.';
      }
    }else{
      // Sin backend: abre email pre-relleno a la tutora y marca visualmente como pendiente localmente
      const subject = encodeURIComponent(`Solicitud tutoría ${payload.date} ${payload.start}–${payload.end} · ${payload.studentName}`);
      const body = encodeURIComponent(
        `Familia: ${payload.parentName}\nAlumno/a: ${payload.studentName}\nContacto: ${payload.email}${payload.phone?', '+payload.phone:''}\nObservaciones: ${payload.note}\n\nHorario solicitado: ${payload.date} ${payload.start}–${payload.end} (${payload.duration} min)\n\n*La cita quedará PENDIENTE hasta confirmación de la tutora.*`
      );
      window.location.href = `mailto:${encodeURIComponent(CONFIG.teacherEmail)}?subject=${subject}&body=${body}`;
      statusEl.textContent = 'Solicitud enviada por email. Pendiente de confirmación.';
    }
  }catch(err){
    statusEl.textContent = 'Error al enviar. Inténtalo de nuevo.';
  }
});

// Inicial
renderSlots(formatISO(t0));
