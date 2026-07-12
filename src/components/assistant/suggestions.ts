export const SUGGESTED_QUESTIONS: string[] = [
  "¿Qué servicios ofreces?",
  "¿Cómo funciona el Diagnóstico Express?",
  "¿Para quién es este servicio?",
  "¿Por qué empezar con un diagnóstico?",
];

export const SIMULATED_REPLY =
  "Gracias por tu pregunta. En esta versión beta las respuestas son simuladas: pronto conectaré la base de conocimiento real para responder con detalle sobre alcance, tiempos y precios de cada servicio.";

export function simulateReply(_question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const delay = 700 + Math.random() * 600;
    setTimeout(() => {
      if (Math.random() < 0.03) {
        reject(new Error("No se pudo generar la respuesta. Intenta de nuevo."));
        return;
      }
      resolve(SIMULATED_REPLY);
    }, delay);
  });
}