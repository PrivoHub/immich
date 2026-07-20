<script lang="ts">
  type Variant = 'inline' | 'icon';
  type Size = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

  interface Props {
    variant?: Variant;
    size?: Size;
    class?: string;
  }

  let { variant = 'icon', size = 'medium', class: className = '' }: Props = $props();

  const heights: Record<Size, number> = {
    tiny: 16,
    small: 20,
    medium: 28,
    large: 36,
    giant: 48,
  };

  const h = $derived(heights[size] ?? heights.medium);
  const textSize = $derived(Math.round(h * 0.52));
</script>

{#if variant === 'inline'}
  <span class="inline-flex items-center gap-2.5 {className}" aria-label="PrivoHub Photos">
    <svg height={h} width={h} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0">
      <path d="M50 7 C50 7 74 15 83 18 C85 19 86 20 86 23 L86 49 C86 71 71 87 50 94 C29 87 14 71 14 49 L14 23 C14 20 15 19 17 18 C26 15 50 7 50 7 Z" fill="#6D5DD1"/>
      <circle cx="62" cy="37" r="5.5" fill="#fff"/>
      <path d="M27 66 L43 45 L53 58 L62 47 L75 66 Z" fill="#fff"/>
    </svg>
    <span class="font-semibold text-[#6D5DD1] dark:text-white leading-none" style="font-size:{textSize}px">PrivoHub Photos</span>
  </span>
{:else}
  <svg
    height={h}
    width={h}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    class={className}
    aria-label="PrivoHub Photos"
  >
    <path d="M50 7 C50 7 74 15 83 18 C85 19 86 20 86 23 L86 49 C86 71 71 87 50 94 C29 87 14 71 14 49 L14 23 C14 20 15 19 17 18 C26 15 50 7 50 7 Z" fill="#6D5DD1"/>
    <circle cx="62" cy="37" r="5.5" fill="#fff"/>
    <path d="M27 66 L43 45 L53 58 L62 47 L75 66 Z" fill="#fff"/>
  </svg>
{/if}
