<script lang="ts">
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state.js';

  export let question: AdminQuestion;
</script>

<div class="question-preview">
  {question.title}
</div>
