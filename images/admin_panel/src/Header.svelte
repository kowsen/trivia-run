<script lang="ts">
  import { Link } from 'svelte-routing';

  export let to = '/';
</script>

<div class="header">
  <div class="home-link"><Link {to}>&lt;</Link></div>
  <h2><slot /></h2>
</div>

<style lang="scss">
  .header {
    display: flex;
    gap: 16px;
  }

  .home-link {
    font-size: 36px;
  }
</style>
