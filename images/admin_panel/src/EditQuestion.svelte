<script lang="ts">
  import { TextInput, TextArea, Button, NumberInput, Checkbox } from 'carbon-components-svelte';
  import { upsertQuestion } from 'game-socket/dist/trivia/admin_rpcs';
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state';
  import { navigate } from 'svelte-routing';
  import { client, order } from './client';
  import FileField from './FileField.svelte';
  import Header from './Header.svelte';

  export let questionId: string;

  $: question = $client.questions.entities[questionId];
  $: isBonus = $order.bonus.includes(questionId);
  $: headerLink = isBonus ? '/bonus-questions' : '/main-questions';

  function stripFalsy<TValue>(value: TValue): TValue | undefined {
    if (!value) {
      return undefined;
    }
    return value;
  }

  let name: string = '';
  let title: string = '';
  let text: string = '';
  let image: string = '';
  let frame: string = '';
  let answer: string = '';
  let hideAnswer: boolean = false;
  let unlockTime: number = 0;
  let bonusWinner: string = '';

  let lastQuestion: unknown;
  $: {
    if (question !== lastQuestion) {
      name = question.name;
      title = question.title;
      text = question.text;
      image = question.image;
      frame = question.frame;
      answer = question.answer;
      hideAnswer = question.hideAnswer;
      unlockTime = question.unlockTime ?? 0;
      bonusWinner = question.bonusWinner;
      lastQuestion = question;
    }
  }

  $: generatedQuestion = {
    ...question,
    name: stripFalsy(name),
    title: stripFalsy(title),
    text: stripFalsy(text),
    image: stripFalsy(image),
    frame: stripFalsy(frame),
    answer,
    hideAnswer: stripFalsy(hideAnswer),
    unlockTime: stripFalsy(unlockTime),
    bonusWinner: stripFalsy(bonusWinner),
  };

  async function submit() {
    await client.call(upsertQuestion, generatedQuestion);
    navigate(headerLink);
  }
</script>

<Header to={headerLink}>Edit Question</Header>

<div class="edit-form">
  <TextInput
    labelText="Name"
    placeholder="Enter Name... (optional)"
    helperText="This is only used in the admin console and is never seen by players - it's just here so you can label things like image questions."
    bind:value={name}
  />

  <TextInput
    labelText="Title"
    placeholder="Enter Title... (optional)"
    helperText="This will be seen by players above the question. If defined, it replaces the default 'Level X' that appears there normally."
    bind:value={title}
  />

  <TextArea
    labelText="Text"
    placeholder="Enter Text... (optional)"
    helperText="The main text of the question."
    bind:value={text}
  />

  <FileField kind="image" bind:value={image} />

  <FileField kind="bundle" bind:value={frame} />

  <TextInput
    labelText="Answer"
    placeholder="Enter Answer..."
    helperText="The question's answer as a regular expression."
    bind:value={answer}
  />

  <Checkbox labelText="Hide answer box?" bind:checked={hideAnswer} />

  <NumberInput
    label="Unlock Time"
    placeholder="Enter Unlock Time... (optional)"
    helperText="This takes epoch time in milliseconds. To generate a timestamp, go to epochconverter.com and copy the 'Timestamp in milliseconds' field here. A value of 0 is unlocked at all times."
    bind:value={unlockTime}
  />

  {#if isBonus}
    <TextInput
      labelText="Bonus Winner"
      placeholder="Enter Bonus Winner... (optional)"
      helperText="The name of the first team to beat the bonus question. This will automatically fill in when they beat it, but you can manually set this value if you want (in case a typo in the answer let them solve it early or something)"
      bind:value={bonusWinner}
    />
  {/if}

  <Button kind="secondary" on:click={submit}>Submit</Button>
</div>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    margin: 24px 0;
    gap: 24px;
  }
</style>
