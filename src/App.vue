<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'AppRoot'
};
</script>

<style>
html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

body {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f5f7fb;
  color: #172033;
}

* {
  box-sizing: border-box;
}
</style>
