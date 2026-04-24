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
    <svg height={h} width={h} viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0">
      <rect width="28" height="28" rx="7" fill="#4250AF"/>
      <path d="M14 6.5L20 9.2V14c0 3.6-2.6 6.3-6 7.8C10.6 20.3 8 17.6 8 14V9.2L14 6.5z" fill="white" opacity="0.9"/>
      <circle cx="14" cy="14" r="2.5" fill="#4250AF" opacity="0.85"/>
    </svg>
    <span class="font-semibold text-[#4250AF] dark:text-white leading-none" style="font-size:{textSize}px">PrivoHub Photos</span>
  </span>
{:else}
  <svg
    height={h}
    width={h}
    viewBox="0 0 28 28"
    xmlns="http://www.w3.org/2000/svg"
    class={className}
    aria-label="PrivoHub Photos"
  >
    <rect width="28" height="28" rx="7" fill="#4250AF"/>
    <path d="M14 6.5L20 9.2V14c0 3.6-2.6 6.3-6 7.8C10.6 20.3 8 17.6 8 14V9.2L14 6.5z" fill="white" opacity="0.9"/>
    <circle cx="14" cy="14" r="2.5" fill="#4250AF" opacity="0.85"/>
  </svg>
{/if}
