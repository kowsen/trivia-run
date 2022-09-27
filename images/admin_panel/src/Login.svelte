<script lang="ts">
  import { navigate } from 'svelte-routing';
  import { refreshToken } from './client';

  let password = '';
  let errorText = '';

  $: displayError = password ? '' : errorText;

  function onInputKeydown(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();
      loginAndRedirect();
    }
  }

  async function loginAndRedirect() {
    const result = await refreshToken(password);
    if (!result.success) {
      password = '';
      errorText = 'Invalid, try again...';
    }
  }
</script>

<input type="password" placeholder="Password" bind:value={password} on:keydown={onInputKeydown} />
<p>{displayError}</p>

<button on:click={loginAndRedirect}>LOGIN</button>
