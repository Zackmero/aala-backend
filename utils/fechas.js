// Utilidades de fecha/hora para el backend.
//
// El servidor (Render) corre en UTC, no en hora de México, así que nunca
// hay que usar `new Date().toISOString()` para obtener "el día de hoy":
// eso da la fecha en UTC, que ya es mañana en México durante las horas de
// la tarde/noche (UTC-6). Estas funciones fijan explícitamente el huso
// horario de México (America/Mexico_City) sin importar en qué zona horaria
// corra el proceso de Node.

// Fecha de HOY en hora de México, como "YYYY-MM-DD", para columnas DATE.
const hoyMexico = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
};

// Fecha y hora ACTUAL en hora de México, como "YYYY-MM-DD HH:MM:SS".
// Se usa en vez de NOW()/CURDATE() de MySQL porque esas funciones dependen
// del timezone configurado en el servidor de base de datos (normalmente
// UTC), mientras que fecha_hora/fecha_vencimiento se guardan como hora
// local de México en texto plano: comparar uno contra otro directamente
// desfasa los resultados según la hora del día.
const ahoraMexico = () => {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const obtener = (tipo) => partes.find((p) => p.type === tipo).value;
  return `${obtener("year")}-${obtener("month")}-${obtener("day")} ${obtener("hour")}:${obtener("minute")}:${obtener("second")}`;
};

module.exports = { hoyMexico, ahoraMexico };
