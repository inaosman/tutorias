// === Tutorías – Backend (Google Apps Script) ===
// Hoja con cabeceras: date | start | end | status | parentName | studentName | email | phone | note | timestamp | reqId
// STATUS: 'pending' | 'confirmed' | 'cancelled'
// Reglas: solo martes, 14:00–15:00; 30 o 60 min; no solapar; no 2 horas seguidas (placeholder).

const SHEET_ID = 'PON_AQUI_EL_ID_DE_TU_HOJA';
const DEST_EMAIL = 'ina.osman@educa.madrid.org';
const TOKEN_ADMIN = 'Fg48WBs2vRtIm-ethH2Kw04fCVZllksQ'; // para confirmar desde el enlace

function doGet(e){
  const params = e.parameter || {};
  const action = params.action || 'list';
  if(action === 'list'){
    const date = params.date;
    const data = listDay(date);
    return json(data);
  }
  if(action === 'listAllPending'){
    const token = e.parameter.token;
    if(token !== TOKEN_ADMIN){ return json({ok:false, message:'Token inválido'}); }
    return json({ok:true, items:listAllPending()});
  }
  if(action === 'confirm'){
    const reqId = params.reqId;
    const decision = params.decision; // 'confirm' | 'cancel'
    const token = params.token;
    if(token !== TOKEN_ADMIN){ return json({ok:false, message:'Token inválido'}); }
    const ok = confirmRequest(reqId, decision);
    return json({ok});
  }
  return json({ok:false, message:'Acción no soportada'});
}

function doPost(e){
  const body = JSON.parse(e.postData.contents || '{}');
  if(body.action === 'request'){
    return json(handleRequest(body.data));
  }
  return json({ok:false, message:'Acción no soportada'});
}

function listDay(dateISO){
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).filter(r => r[0] === dateISO);
  const bookings = rows.map(r => ({ start:r[1], end:r[2], status:r[3], parentName:r[4], student:r[5], email:r[6], phone:r[7], note:r[8], reqId:r[10] }));
  return { date: dateISO, bookings };
}

function handleRequest(d){
  // Validar reglas
  if(!isTuesday(d.date)) return {ok:false, message:'Solo martes'};
  if(!( (d.start==='14:00'&&d.end==='14:30') || (d.start==='14:30'&&d.end==='15:00') || (d.start==='14:00'&&d.end==='15:00') ))
    return {ok:false, message:'Horario no permitido'};
  // Comprobar solapamiento
  const day = listDay(d.date);
  const overlap = day.bookings.some(b => (b.status==='pending'||b.status==='confirmed') && !(b.end <= d.start || b.start >= d.end));
  if(overlap) return {ok:false, message:'La hora ya no está disponible'};

  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const reqId = Utilities.getUuid();
  sh.appendRow([d.date, d.start, d.end, 'pending', d.parentName, d.studentName, d.email, d.phone, d.note || '', new Date(), reqId]);

  // Email a la tutora con enlaces de confirmar/cancelar
  const url = ScriptApp.getService().getUrl();
  const confirmUrl = `${url}?action=confirm&reqId=${reqId}&decision=confirm&token=${TOKEN_ADMIN}`;
  const cancelUrl = `${url}?action=confirm&reqId=${reqId}&decision=cancel&token=${TOKEN_ADMIN}`;
  const html = `Nueva solicitud de tutoría:<br>
    <b>${d.date} ${d.start}–${d.end}</b><br>
    Familia: ${escapeHtml(d.parentName)} · Alumno/a: ${escapeHtml(d.studentName)}<br>
    Contacto: ${escapeHtml(d.email)} ${d.phone?(', '+escapeHtml(d.phone)) : ''}<br>
    Nota: ${escapeHtml(d.note || '')}<br><br>
    <a href="${confirmUrl}">✅ Confirmar</a> &nbsp;|&nbsp;
    <a href="${cancelUrl}">❌ Rechazar</a>`;
  MailApp.sendEmail({to: DEST_EMAIL, subject: `Tutorías – Solicitud ${d.date} ${d.start}-${d.end}`, htmlBody: html});

  return {ok:true, reqId};
}

function confirmRequest(reqId, decision){
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const values = sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){
    if(values[i][10] === reqId){
      const row = i+1;
      sh.getRange(row, 4).setValue(decision==='confirm' ? 'confirmed' : 'cancelled');
      // Aviso a la familia si hay email
      const email = values[i][6];
      if(email){
        const date = values[i][0], start = values[i][1], end = values[i][2];
        const subject = decision==='confirm' ? 'Confirmación de tutoría' : 'Solicitud no disponible';
        const body = decision==='confirm'
          ? `Tu cita de tutoría para el ${date} ${start}-${end} ha sido CONFIRMADA.`
          : `No ha sido posible confirmar tu solicitud para el ${date} ${start}-${end}. Elige otro horario.`;
        MailApp.sendEmail(email, subject, body);
      }
      return true;
    }
  }
  return false;
}

function isTuesday(dateISO){
  const d = new Date(dateISO + 'T00:00:00');
  return d.getDay() === 2;
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }


function listAllPending(){
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const values = sh.getDataRange().getValues();
  const items = [];
  for(let i=1;i<values.length;i++){
    const r = values[i];
    if(r[3] === 'pending'){
      items.push({date:r[0], start:r[1], end:r[2], status:r[3], parentName:r[4], student:r[5], email:r[6], phone:r[7], note:r[8], reqId:r[10]});
    }
  }
  return items;
}
