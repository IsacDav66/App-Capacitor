/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos a Tailwind dónde escanear las clases que usas.
  // Es CRUCIAL que apunte a todos tus archivos HTML y JS en /web.
  content: [
    "./web/**/*.html", // Escanea todos los archivos HTML en la carpeta 'web' y subcarpetas
    "./web/**/*.js",   // Escanea todos los archivos JavaScript
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}