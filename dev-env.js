(function () {
  const hmr = document.createElement("script");
  hmr.src = "/systems/dimensionalwar/@vite/client";
  hmr.type = "module";
  document.head.prepend(hmr);

  const lib = document.createElement("script");
  lib.src = "/systems/dimensionalwar/src/dimensionalwar.js";
  lib.type = "module";
  document.head.appendChild(lib);
})();
