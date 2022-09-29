<script lang="ts">
  import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Checkbox, NumberInput } from 'carbon-components-svelte';
  import { derived } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';
  import { client, order } from './client';
  import type { AdminQuestionOrder } from 'game-socket/dist/trivia/admin_state';
  import type { RequestDoc } from 'game-socket/dist/trivia/base';
  import { setQuestionOrder } from 'game-socket/dist/trivia/admin_rpcs';

  const dispatch = createEventDispatcher();

  export let questionId: string | undefined;
  export let track: 'main' | 'bonus';

  $: trackOrder = track === 'main' ? $order.main : $order.bonus;

  let newPosition: number;

  $: currentPosition = trackOrder.indexOf(questionId) + 1;
  $: {
    newPosition = currentPosition;
  }

  function buildNewOrder(trackOrder: string[]): RequestDoc<AdminQuestionOrder> {
    const patch: Partial<AdminQuestionOrder> = {};
    if (track === 'main') {
      patch.main = trackOrder;
    } else {
      patch.bonus = trackOrder;
    }
    return { ...$order, ...patch };
  }

  async function onSubmit() {
    const newIndex = newPosition - 1;
    const newTrackOrder = trackOrder.filter(id => id !== questionId);
    newTrackOrder.splice(newIndex, 0, questionId);
    const newOrder = buildNewOrder(newTrackOrder);
    await client.call(setQuestionOrder, newOrder);
    onClose();
  }

  function onClose() {
    dispatch('close');
  }
</script>

<ComposedModal open={!!questionId} on:submit={onSubmit} on:close={onClose}>
  <ModalHeader title="Moving Question" />
  <ModalBody hasForm>
    <NumberInput
      label="New Position"
      placeholder="Enter new position..."
      bind:value={newPosition}
      min={1}
      max={trackOrder.length}
    />
  </ModalBody>
  <ModalFooter primaryButtonText="Move" />
</ComposedModal>
