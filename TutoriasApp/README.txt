TUTORÍAS – RESERVA (MARTES 14:00–15:00)
======================================

Cómo funciona
-------------
1) La app muestra los próximos martes.
2) Las familias eligen 30 o 60 minutos y ven los slots válidos:
   - 30 min: 14:00–14:30 o 14:30–15:00
   - 60 min: 14:00–15:00
3) Cada slot indica si está Libre, Pendiente o Ocupado.
4) Al solicitar, la reserva queda **Pendiente** hasta que la tutora la confirme.

Backend recomendado (Google Apps Script + Sheet)
-----------------------------------------------
1) Crea una Hoja de cálculo con cabeceras:
   date | start | end | status | parentName | studentName | email | phone | note | timestamp | reqId
2) Apps Script > Nuevo proyecto y pega `apps_script_example.gs`.
3) Cambia SHEET_ID, DEST_EMAIL y TOKEN_ADMIN (se usa para confirmar).
4) Implementa como aplicación web "Cualquiera con el enlace".
5) Copia la URL de despliegue en `config.js` -> `apiBase`.

Confirmación por la tutora
--------------------------
- El script envía un email con enlaces de **Confirmar** o **Rechazar**.
- También puedes confirmar abriendo la URL: `?action=confirm&reqId=...&decision=confirm&token=...`

Privacidad
----------
- La app solo envía los datos necesarios para gestionar la cita.


Tu configuración
----------------
• Email de tutora: ina.osman@educa.madrid.org  
• TOKEN_ADMIN (para confirmar desde enlaces): Fg48WBs2vRtIm-ethH2Kw04fCVZllksQ

Recuerda:
1) Pega el `SHEET_ID` de tu Hoja en `apps_script_example.gs`.
2) Implementa como app web y copia la URL de despliegue en `config.js` → `apiBase`.


Panel de administración
-----------------------
- Abre `admin.html` y guarda tu **API Base** (URL del Apps Script) y tu **TOKEN_ADMIN**.
- Pulsa **Cargar pendientes** para ver solicitudes en espera y confirma/cancela con un clic.
- También puedes consultar por fecha (hoy o próximo martes).

Cómo compartir la app con las familias
--------------------------------------
1) **Publica** los archivos en GitHub Pages, Netlify o Vercel (sube la carpeta tal cual).
   - GitHub Pages: crea repo, sube la carpeta y activa Pages (branch `main`, carpeta raíz).
   - Netlify/Vercel: arrastra la carpeta o conecta el repo.
2) **Comparte el enlace** de `index.html` (la URL pública). Opcional: genera un **código QR**.
3) **Añadir a pantalla de inicio** (PWA): en móvil, el navegador ofrece "Añadir a pantalla de inicio" para acceso rápido.
4) **Privacidad**: informa a las familias que la reserva queda **Pendiente** hasta tu confirmación por email.

