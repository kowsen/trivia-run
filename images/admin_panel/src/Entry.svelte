<script lang="ts" context="module">
  export interface EntryMenuItem {
    text: string;
    action: () => void;
  }
</script>

<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';

  export let handle: string;
  export let content: string;
  export let options: EntryMenuItem[];
  export let isSecret = false;
</script>

<div class="entry" class:secret={isSecret}>
  <span class="handle header accent">{handle}</span>
  <span class="content">{content}</span>

  <div class="menu-container">
    <OverflowMenu size="sm" flipped={true}>
      {#each options as option}
        <OverflowMenuItem text={option.text} on:click={option.action} />
      {/each}
    </OverflowMenu>
  </div>
</div>

<style lang="scss">
  .entry {
    display: flex;
    padding: 12px 24px;
    background-color: #5e5e5e;
    gap: 12px;
    align-items: center;
    font-size: 20px;

    &.secret {
      background-color: #4a4a4a;
      span {
        opacity: 0.7;
      }
    }
  }

  .handle {
    min-width: 32px;
  }

  .menu-container {
    margin-left: auto;
  }
</style>
