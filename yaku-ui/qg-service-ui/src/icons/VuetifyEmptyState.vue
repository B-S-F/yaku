<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 790 618">
    <g fill="none" fill-rule="evenodd">
      <path class="text-grey-lighten-5" name="windowFrame"
        d="M408.896 0v302.126h214.258V0H408.896ZM608.83 133.406h-85.766V17.421h85.766v115.985ZM508.938 17.421v115.985h-85.751V17.421h85.751Zm-85.751 130.11h85.774v137.181h-85.774V147.531Zm99.901 137.181V147.531h85.766v137.181h-85.766Z" />
      <path class="text-white" name="windowGlass"
        d="M423.163 17.421h85.774v115.993h-85.774V17.421Zm0 130.111h85.774v137.18h-85.774v-137.18Zm99.901 0h85.774v137.18h-85.774v-137.18Zm0-130.11h85.774v115.992h-85.774V17.421Z" />
      <path class="text-grey-lighten-3" name="lampCover"
        d="M641.542 110.649a19.12 19.12 0 0 1 19.118 19.116c0 7.847-10.571 25.7-15.987 34.325a67.865 67.865 0 0 0 45.956-20.916 67.847 67.847 0 0 0 18.785-46.863H573.639a67.838 67.838 0 0 0 18.785 46.863 67.86 67.86 0 0 0 45.955 20.916c-5.415-8.632-15.987-26.47-15.987-34.325a19.118 19.118 0 0 1 19.119-19.116h.031Z" />
      <path class="text-white" name="lampLight"
        d="M660.661 129.749a19.126 19.126 0 0 0-5.321-13.629 19.108 19.108 0 0 0-13.401-5.876 19.128 19.128 0 0 0-13.631 5.321 19.1 19.1 0 0 0-5.876 13.399v.785c0 7.847 10.571 25.7 15.987 34.325l.737 1.169v-.447h4.78v.47c.227-.368.479-.784.738-1.169 5.415-8.648 15.987-26.493 15.987-34.348Z" />
      <path class="text-grey-lighten-2" name="lampStand" d="M639.156 164.772v423.793h4.78V164.772h-4.78Z" />
      <path ref="floorRef" class="text-grey-lighten-4" fill-rule="evenodd" name="floor"
        d="M790 561.184C790 592.574 613.155 618 394.996 618 176.837 618 0 592.558 0 561.184c0-31.374 176.845-56.815 394.996-56.815 218.151 0 395.004 25.434 395.004 56.815Z"
        clip-rule="evenodd" />
      <path class="text-grey-3" fill-rule="evenodd" name="labelContainer"
        d="M479.667 467.667H310.334c-11.642 0-21.167-9.525-21.167-21.167V298.333h71.041l15.875 15.875h124.751V446.5c0 11.642-9.525 21.167-21.167 21.167ZM299.75 308.917V446.5c0 5.821 4.763 10.583 10.584 10.583h169.333c5.821 0 10.583-4.762 10.583-10.583V324.792H371.585l-15.875-15.875h-55.96Z"
        clip-rule="evenodd" />
      <text v-if="label" :x="labelX ?? 394" y="390" fill="currentColor" dominant-baseline="middle" text-anchor="middle"
        name="label">{{ label }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  label?: string
  labelX?: number
}>()

const floorRef = ref<SVGPathElement>()

defineExpose({
  floorRef,
})
</script>
<style lang="scss" scoped>
path[name="windowFrame"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }
}

path[name="windowGlass"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }

}

path[name="lampCover"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }

}

path[name="lampLight"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }

}

path[name="lampStand"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }
}

path[name="floor"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }

}

path[name="labelContainer"] {

  fill: currentColor;

  .-dark-mode & {

    fill: currentColor;
  }
}
</style>
