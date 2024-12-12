<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="empty-state-2">
    <BuildingSilhouetteNatureCloudXS class="xs" />
    <BuildingSilhouetteNatureCloudSM class="sm" />
    <BuildingSilhouetteNatureCloudLG class="lg" />
  </div>
</template>

<script setup lang="ts">
import BuildingSilhouetteNatureCloudLG from './emptyStateIcons/BuildingSilhouetteNatureCloudLG.vue'
import BuildingSilhouetteNatureCloudSM from './emptyStateIcons/BuildingSilhouetteNatureCloudSM.vue'
import BuildingSilhouetteNatureCloudXS from './emptyStateIcons/BuildingSilhouetteNatureCloudXS.vue'
</script>

<style scoped lang="scss">
.empty-state-2 {
  container-type: inline-size;
  display: flex;
  justify-content: center;
  // icon fill color
  color: #e0e2e5;
  ;

  >* {
    // flex somehow does not work
    min-height: 0;
    height: 100%;
    max-height: 100%;
  }

  // small container size
  @container (min-width: 850px) {
    .sm {
      display: block;
    }

    .xs,
    .lg {
      display: none;
    }
  }

  // large container size
  @container (min-width: 1200px) {
    .lg {
      display: block;
    }

    .xs,
    .sm {
      display: none;
    }
  }
}

// basic state (extra-small container size)
.xs {
  display: block;
}

.sm {
  display: none;
}

.lg {
  display: none;
}
</style>
