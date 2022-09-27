<script lang="ts">
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state';

  export let question: AdminQuestion;
  export let index: number;

  $: questionText = question.name ?? question.title ?? question.text ?? question.image ?? question.frame;
</script>

<div class="question-preview">
  <span class="index">{index + 1}.</span>
  <span>{questionText}</span>
</div>

<style lang="scss">
  .question-preview {
    display: flex;
    padding: 12px;
    outline: 1px solid #ccc;
    gap: 12px;
  }

  .index {
    width: 32px;
    text-align: right;
  }
</style>
