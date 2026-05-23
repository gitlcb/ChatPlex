<template>
  <section class="command-center-page">
    <iframe
      class="command-frame"
      src="https://vide.snownk.xyz/#apps"
      title="命令中心"
      loading="eager"
      referrerpolicy="no-referrer"
      allow="clipboard-read; clipboard-write; fullscreen"
    ></iframe>
  </section>
</template>

<style scoped>
.command-center-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary, #0a0f16);
}

.command-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--bg-primary, #0a0f16);
}
</style>
