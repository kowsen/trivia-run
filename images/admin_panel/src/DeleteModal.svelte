<script lang="ts">
  import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Checkbox, NumberInput } from 'carbon-components-svelte';
  import { derived } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';
  import { client, order } from './client';
  import type { AdminQuestionOrder } from 'game-socket/dist/trivia/admin_state';
  import type { RequestDoc } from 'game-socket/dist/trivia/base';
  import { setQuestionOrder, upsertQuestion } from 'game-socket/dist/trivia/admin_rpcs';

  const dispatch = createEventDispatcher();

  export let documentId: string | undefined;
  export let kind: 'question' | 'team' | 'guess';

  async function onSubmit() {
    if (kind === 'question') {
      const newOrder = {
        main: $order.main.filter(id => id !== documentId),
        bonus: $order.bonus.filter(id => id !== documentId),
      };
      await client.call(setQuestionOrder, newOrder);
      const newQuestion = { ...$client.questions.entities[documentId], _deleted: true };
      await client.call(upsertQuestion, newQuestion);
    }
    onClose();
  }

  function onClose() {
    dispatch('close');
  }
</script>

<ComposedModal open={!!documentId} on:submit={onSubmit} on:close={onClose}>
  <ModalHeader title="Delete Item" />
  <ModalBody>
    <p>This will permanently delete this item and remove it from the game.</p>
    {#if kind === 'question'}
      <p>
        If you delete a question that a team is currently working on, their game's gonna go pretty wonky. Only do this
        either before the game has started or with Kyle's help. It's much safer to edit questions than it is to move or
        delete them.
      </p>
    {/if}
  </ModalBody>
  <ModalFooter primaryButtonText="Delete" />
</ComposedModal>
