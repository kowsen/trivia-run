<script lang="ts">
  import QuestionPreview from './QuestionPreview.svelte';
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state.js';

  export let questions: AdminQuestion[];
</script>

<div class="question-list">
  {#each questions as question, index}
    <QuestionPreview {question} {index} />
  {/each}
</div>

<style lang="scss">
  .question-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
