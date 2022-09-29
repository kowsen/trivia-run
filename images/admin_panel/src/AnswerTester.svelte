<script lang="ts">
  import { ComposedModal, ModalHeader, ModalBody, TextInput, Button } from 'carbon-components-svelte';
  import { checkGuess } from 'game-socket/dist/trivia/admin_state';

  export let answer: string;

  let isOpen = false;

  let guess: string;

  $: isCorrect = checkGuess(guess ?? '', answer ?? '');

  function onClick() {
    isOpen = true;
  }

  function onClose() {
    isOpen = false;
  }
</script>

<div>
  <Button kind="secondary" size="small" on:click={onClick}>Test Guess</Button>
  <ComposedModal open={isOpen} on:close={onClose}>
    <ModalHeader title="Answer Regex Generator" />
    <ModalBody>
      <TextInput
        labelText="Guess"
        placeholder="Enter Guess..."
        helperText="Check your guess against the currently entered answer regular expression."
        bind:value={guess}
      />
      <p class:accent={isCorrect}>Is Correct: {isCorrect}</p>
    </ModalBody>
  </ComposedModal>
</div>

<style>
  p {
    margin-top: 12px;
  }
</style>
